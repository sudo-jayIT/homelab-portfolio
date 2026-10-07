"use client";

/**
 * The occupant: a smooth, rigged 2-D side-view figure of the room's owner who
 * idles, walks to the desk and types, walks to the rack and works on it, then
 * wanders. Clicking (Enter/Space) opens the About section.
 *
 * Unlike the earlier box build, limbs are drawn as thick round-capped strokes
 * (capsules) on a real skeleton: a hip root with two-segment legs (thigh→shin→
 * foot) and arms (upper→fore→hand), each joint a nested <g> that rotates about
 * its pivot. The controller drives the joint rotations with GSAP: a phase-
 * coupled walk cycle (the leg phase advances with the body's travel, so feet
 * plant instead of skate), and blended tweens between stand / sit / fix poses.
 *
 * The figure is a side-view "billboard" placed on the floor at a world point
 * (iso projection of the spot) and flipped horizontally to face left/right. A
 * ground shadow keeps it planted. Nothing animates under reduced motion.
 *
 * Tuning dials: C (colours), the skeleton constants, POSES and walkAngles().
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { INITIAL_VIEWBOX } from "@/components/lab/contracts";
import { iso, r2, K } from "@/lib/iso";
import { goToSection } from "@/lib/view-store";

/* --------------------------------- palette -------------------------------- */

const C = {
  shirt: "#23272f",
  jeans: "#3c5872",
  jeansDk: "#2e4357",
  skin: "#b37c52",
  skinDk: "#956540",
  shoe: "#16181c",
  shoeDk: "#0d0e11",
  hair: "#18140f",
};

/* ------------------------------ skeleton sizes ----------------------------- */
// Local units, ground at y=0, "up" is -y. The figure is ~166 tall and gets
// scaled to the room by SCALE when placed.

const S = {
  hip: -86, // hip height above the floor
  thigh: 42,
  shin: 34,
  shoulder: -136, // shoulder height
  upper: 30,
  fore: 26,
  headR: 13,
  torsoW: 30,
  thighW: 17,
  shinW: 14,
  upperW: 12,
  foreW: 10,
};
const SCALE = 1.28; // match the room's vertical scale (~K)

type Pose = "stand" | "walk" | "sit" | "fix";
type Angles = Record<string, number>;
const JOINTS = ["torso", "thighN", "shinN", "thighF", "shinF", "upperN", "foreN", "upperF", "foreF"] as const;

/* --------------------------------- drawing -------------------------------- */

/** A capsule limb segment: a round-capped stroke from (0,0) down to (0,len). */
function Seg({ len, w, color }: { len: number; w: number; color: string }) {
  return <line x1={0} y1={0} x2={0} y2={len} stroke={color} strokeWidth={w} strokeLinecap="round" />;
}

/** A nested rotatable joint group (bakes `rotate(a)` for the dev harness; the
 *  live controller leaves it identity and drives it with GSAP). */
function Joint({ id, a, children }: { id: string; a?: number; children: ReactNode }) {
  return (
    <g data-joint={id} transform={a === undefined ? undefined : `rotate(${r2(a)})`} style={{ transformOrigin: "0px 0px" }}>
      {children}
    </g>
  );
}

/** A side-view shoe pointing forward (-x). */
function Shoe({ dark }: { dark?: boolean }) {
  return <rect x={-21} y={-6} width={24} height={11} rx={5} fill={dark ? C.shoeDk : C.shoe} />;
}

/** One leg (thigh → shin → foot). `n` picks near vs far colour/offset. */
function Leg({ suffix, near, angles }: { suffix: "N" | "F"; near: boolean; angles?: Angles }) {
  const col = near ? C.jeans : C.jeansDk;
  const dx = near ? 3 : -3;
  return (
    <g transform={`translate(${dx} ${S.hip})`}>
      <Joint id={`thigh${suffix}`} a={angles?.[`thigh${suffix}`]}>
        <Seg len={S.thigh} w={S.thighW} color={col} />
        <g transform={`translate(0 ${S.thigh})`}>
          <Joint id={`shin${suffix}`} a={angles?.[`shin${suffix}`]}>
            <Seg len={S.shin} w={S.shinW} color={col} />
            <g transform={`translate(0 ${S.shin})`}>
              <Shoe dark={!near} />
            </g>
          </Joint>
        </g>
      </Joint>
    </g>
  );
}

/** One arm (upper → fore → hand). A black-tee sleeve cap, bare skin below. */
function Arm({ suffix, near, angles }: { suffix: "N" | "F"; near: boolean; angles?: Angles }) {
  const sk = near ? C.skin : C.skinDk;
  const dx = near ? 4 : -4;
  return (
    <g transform={`translate(${dx} ${S.shoulder})`}>
      <Joint id={`upper${suffix}`} a={angles?.[`upper${suffix}`]}>
        <circle cx={0} cy={0} r={S.upperW / 2 + 1} fill={C.shirt} />
        <Seg len={S.upper} w={S.upperW} color={sk} />
        <g transform={`translate(0 ${S.upper})`}>
          <Joint id={`fore${suffix}`} a={angles?.[`fore${suffix}`]}>
            <Seg len={S.fore} w={S.foreW} color={sk} />
            <circle cx={0} cy={S.fore} r={S.foreW / 2 + 0.5} fill={sk} />
          </Joint>
        </g>
      </Joint>
    </g>
  );
}

/** Torso + neck + head + hair, drawn facing -x (left). */
function Trunk({ angles }: { angles?: Angles }) {
  const top = S.shoulder - S.hip; // local y of the shoulders (negative = up)
  const cx = -1; // head barely forward
  const cy = top - 11 - S.headR; // head centre sits on an upright neck above the shoulders
  return (
    <g transform={`translate(0 ${S.hip})`}>
      <Joint id="torso" a={angles?.torso}>
        {/* broad shoulders, then the torso capsule down to the hips */}
        <line x1={-9} y1={top + 2} x2={9} y2={top + 2} stroke={C.shirt} strokeWidth={S.torsoW * 0.72} strokeLinecap="round" />
        <line x1={0} y1={0} x2={0} y2={top} stroke={C.shirt} strokeWidth={S.torsoW} strokeLinecap="round" />
        {/* upright neck */}
        <line x1={0} y1={top} x2={cx} y2={cy + S.headR - 1} stroke={C.skin} strokeWidth={10} strokeLinecap="round" />
        {/* head + a hair cap over the crown and back (+x) */}
        <circle cx={cx} cy={cy} r={S.headR} fill={C.skin} />
        <path d={`M${cx - S.headR} ${cy + 1} a ${S.headR} ${S.headR} 0 1 1 ${2 * S.headR} 0 q -3 -7 -${S.headR - 1} -6 q -9 1 -9 6 Z`} fill={C.hair} />
        {/* nose hint on the face side (-x) */}
        <circle cx={cx - S.headR + 1} cy={cy + 2} r={1.6} fill={C.skinDk} />
      </Joint>
    </g>
  );
}

/** The whole figure, facing left. With `angles`, poses are baked (dev harness);
 *  without, joints render at identity for the live GSAP controller. */
export function PersonFigure({ angles }: { angles?: Angles }) {
  return (
    <g>
      {/* far side first (behind), then trunk, then near side */}
      <Leg suffix="F" near={false} angles={angles} />
      <Arm suffix="F" near={false} angles={angles} />
      <Trunk angles={angles} />
      <Leg suffix="N" near angles={angles} />
      <Arm suffix="N" near angles={angles} />
    </g>
  );
}

/* --------------------------------- poses ---------------------------------- */

export const POSES: Record<"stand" | "sit" | "fix", Angles> = {
  stand: { torso: 0, thighN: 3, shinN: 2, thighF: -3, shinF: 2, upperN: 5, foreN: 8, upperF: -4, foreF: 8 },
  // thighs horizontal-forward (-x), shins down, arms reaching onto the desk
  sit: { torso: -8, thighN: -96, shinN: 92, thighF: -90, shinF: 86, upperN: -58, foreN: -72, upperF: -52, foreF: -66 },
  // standing; near arm raised forward-up into the rack
  fix: { torso: -5, thighN: 5, shinN: 2, thighF: -5, shinF: 2, upperN: -124, foreN: -92, upperF: 8, foreF: 10 },
};

/** Walk-cycle joint angles at phase p ∈ [0,1). */
export function walkAngles(p: number): Angles {
  const w = 2 * Math.PI * p;
  const s = Math.sin(w);
  const thigh = 24;
  const arm = 15;
  // near leg forward (foot toward -x) on negative rotation; far leg opposite
  const thighN = -thigh * s;
  const thighF = thigh * s;
  // knee flexes through the swing (just after the leg passes under the hip)
  const kneeN = 38 * Math.max(0, Math.sin(w - Math.PI * 0.2));
  const kneeF = 38 * Math.max(0, Math.sin(w + Math.PI - Math.PI * 0.2));
  return {
    torso: 1.5 * Math.abs(s),
    thighN,
    shinN: kneeN,
    thighF,
    shinF: kneeF,
    upperN: arm * s + 4,
    foreN: 16,
    upperF: -arm * s + 4,
    foreF: 16,
  };
}

/* --------------------------------- blocking -------------------------------- */

const SPOTS = {
  idleA: [648, 656] as const,
  idleB: [726, 636] as const,
  chair: [660, 588] as const,
  rack: [548, 700] as const,
} as const;

const CHAIR_ROLL = { x: r2(26 * 1.14315), y: r2(-26 * 0.66) };
const STRIDE = 42; // screen units of travel per half walk cycle (tunes foot-plant)

const at = (spot: readonly [number, number]) => {
  const [sx, sy] = iso(spot[0], spot[1], 0);
  return { x: r2(sx), y: r2(sy) };
};

/** Face right when the next move heads screen-right (+x of the iso delta). */
function facesRight(from: readonly [number, number], to: readonly [number, number]): boolean {
  return at(to).x > at(from).x;
}

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* -------------------------------- controller ------------------------------- */

/**
 * DISABLED (2026-10-07): Jaylen's call after seeing it rendered correctly —
 * didn't like it regardless of correctness. Not a bug; a design decision.
 * The earlier mobile-Safari crash (RainField resize loop) and the sitewide
 * Tailwind outage (postcss.config.mjs not loading) are both still fixed and
 * unrelated to this flag. Leave false unless he asks for the figure back.
 */
const FIGURE_ENABLED = false;

export function RoomPerson({ active = true, paused = false }: { active?: boolean; paused?: boolean }) {
  const rootRef = useRef<SVGGElement | null>(null);
  const figRef = useRef<SVGGElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [flip, setFlip] = useState(false); // false = facing left

  // Set every joint toward a target pose (dur 0 = snap, used per walk frame).
  const setAngles = (A: Angles, dur: number) => {
    const root = rootRef.current;
    if (!root) return;
    for (const k of JOINTS) {
      const el = root.querySelector<SVGGElement>(`[data-joint="${k}"]`);
      if (el) gsap.to(el, { rotation: A[k] ?? 0, svgOrigin: "0 0", duration: dur, ease: "sine.inOut", overwrite: "auto" });
    }
  };

  // Initial placement + static pose.
  useEffect(() => {
    if (!rootRef.current) return;
    gsap.set(rootRef.current, at(reduced() ? SPOTS.chair : SPOTS.idleA));
    setAngles(reduced() ? POSES.sit : POSES.stand, 0);
    if (reduced()) {
      setFlip(false);
      const chair = document.querySelector<SVGGElement>("#hero [data-chair]");
      if (chair) gsap.set(chair, { x: CHAIR_ROLL.x, y: CHAIR_ROLL.y });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Behaviour timeline.
  useEffect(() => {
    if (reduced() || !rootRef.current) return;
    const root = rootRef.current;
    const chairEl = document.querySelector<SVGGElement>("#hero [data-chair]");
    const phase = { v: 0 };

    const ctx = gsap.context(() => {
      let cursor: readonly [number, number] = SPOTS.idleA;
      const tl = gsap.timeline({ repeat: -1, paused: true });

      const face = (right: boolean) => tl.call(() => setFlip(right));
      const pose = (A: Angles, dur = 0.4) => tl.call(() => setAngles(A, dur));
      const settle = (secs: number) => tl.to({}, { duration: secs });

      const walk = (to: readonly [number, number]) => {
        const a = at(cursor);
        const b = at(to);
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        const right = facesRight(cursor, to);
        cursor = to;
        tl.call(() => setFlip(right));
        const start = { ...phase };
        tl.to(
          { t: 0 },
          {
            t: 1,
            duration: Math.max(0.6, dist / 135),
            ease: "none",
            onStart: () => setAngles(walkAngles(phase.v), 0.12),
            onUpdate: function () {
              const t = (this.targets()[0] as { t: number }).t;
              gsap.set(root, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
              phase.v = (start.v + (t * dist) / STRIDE) % 1;
              const WA = walkAngles(phase.v);
              for (const k of JOINTS) {
                const el = root.querySelector<SVGGElement>(`[data-joint="${k}"]`);
                if (el) gsap.set(el, { rotation: WA[k] ?? 0, svgOrigin: "0 0" });
              }
            },
          },
        );
      };
      const rollChair = (into: boolean) =>
        chairEl ? tl.to(chairEl, { x: into ? CHAIR_ROLL.x : 0, y: into ? CHAIR_ROLL.y : 0, duration: 0.6, ease: "power2.inOut" }) : tl.to({}, { duration: 0.6 });

      settle(gsap.utils.random(1.6, 2.8));
      walk(SPOTS.chair);
      rollChair(true);
      pose(POSES.sit, 0.55);
      settle(gsap.utils.random(5, 9));
      pose(POSES.stand, 0.5);
      rollChair(false);
      walk(SPOTS.rack);
      pose(POSES.fix, 0.5);
      settle(gsap.utils.random(4, 7));
      walk(SPOTS.idleB);
      pose(POSES.stand, 0.4);
      settle(gsap.utils.random(2, 4));
      walk(SPOTS.idleA);
      pose(POSES.stand, 0.4);

      tlRef.current = tl;
    }, rootRef);
    return () => {
      ctx.revert();
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    if (active && !paused) tl.resume();
    else tl.pause();
  }, [active, paused]);

  const open = () => goToSection("about");

  // Disabled: render nothing (rootRef stays null, so every effect above no-ops).
  if (!FIGURE_ENABLED) return null;

  return (
    <svg
      data-cam=""
      viewBox={INITIAL_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ display: active ? undefined : "none" }}
    >
      <g
        ref={rootRef}
        role="button"
        tabIndex={active ? 0 : -1}
        aria-label="About — the person who runs this lab"
        className="lab-person"
        style={{ pointerEvents: active ? "auto" : "none", cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          open();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        }}
      >
        <title>About</title>
        <ellipse cx={0} cy={0} rx={r2(1.2247 * 15 * K)} ry={r2(0.7071 * 15 * K)} fill="rgba(0,0,0,0.33)" />
        <g ref={figRef} transform={`scale(${flip ? -SCALE : SCALE} ${SCALE})`}>
          <PersonFigure />
        </g>
      </g>
    </svg>
  );
}
