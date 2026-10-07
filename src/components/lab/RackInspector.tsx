"use client";

/**
 * Rack inspector (spec 05 sections 2.5 and 4.6). Owned by B7.
 *
 * Mounted by the room engine (B4) for the rack and its ten devices. A CSS-3D
 * model lifts off the drawn part in the scene (true isometric angles, scaled
 * to the scene pixels) and settles on a stage (left of a 22rem dialog on
 * md+, a top band above a bottom sheet on phones), then wobbles gently.
 * Drag the stage to rotate (pointer capture). Tabs swap the part; on phones
 * the tab row scrolls sideways and keeps the active tab in view.
 *
 * Imperative API through the React 19 ref prop:
 *   enter()      scene pose -> stage pose, 1s power3.inOut; dialog fades in at 0.6s
 *   leave(done)  dialog out, stage pose -> scene pose, 0.75s power3.inOut, then done()
 * The engine handles Esc, the dim overlay and the camera; it calls enter()
 * 0.4s into its open timeline and leave() at the start of its close timeline.
 *
 * Content: each part's specs, then what runs on it (HOMELAB_HOSTS rows whose
 * part is this one; an idle node says so). The Proxmox nodes add the "open
 * the homelab map" link.
 *
 * Theme (docs/theme/b.md 3.11): dialog on --card with hairlines, a mint stage
 * glow at 6%, mint kicker and keycap tabs. The CSS-3D models and their LEDs
 * keep the rack hardware's own colours.
 */

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import type { RackInspectorProps, RackPartId } from "@/components/lab/contracts";
import { hostsOn } from "@/content";
import { PART_ORDER, PARTS, SLOT_BANDS, partSize, unitLabel } from "@/lib/rack";
import { PartModel } from "./Box3D";

/** Parts that link to the homelab map (the Proxmox nodes). */
const CLUSTER: readonly RackPartId[] = ["pve1", "pve2", "pve3", "pve4"];

/** Mono section label inside the dialog. */
const LABEL = "text-[10px] uppercase tracking-[0.22em] text-gray-2";

/** True isometric angles: the CSS model lines up with the drawn part. */
const ISO = { rx: -35.264, ry: -45 } as const;
const SQRT_2_3 = Math.sqrt(2 / 3);

interface Pose {
  x: number;
  y: number;
  s: number;
  rx: number;
  ry: number;
}

type Mode = "lift" | "idle" | "drag";

/** Model pixels per local unit: the longest side of the part is 460px at scale 1. */
function unitPx(id: RackPartId): number {
  const { w, h, d } = partSize(id);
  return 460 / Math.max(w, h, d);
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function linkHost(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return "the store";
  }
}

export function RackInspector({ initial, poseOf, onClose, onGo, ref }: RackInspectorProps) {
  const [part, setPart] = useState<RackPartId>(initial);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const partRef = useRef<RackPartId>(initial);
  const pose = useRef<Pose>({ x: 0, y: 0, s: 0.01, rx: ISO.rx, ry: ISO.ry });
  const base = useRef({ rx: -16, ry: -32 });
  const mode = useRef<Mode>("lift");
  const idleT = useRef(0);
  /** Part whose model is on stage; the swap effect only runs when it changes (StrictMode safe). */
  const shownPart = useRef<RackPartId>(initial);
  /** Tab-swap tweens in flight; enter() and leave() cancel them. */
  const swap = useRef<(gsap.core.Tween | gsap.core.Timeline)[]>([]);
  const leaving = useRef(false);
  const drag = useRef<{ x: number; y: number } | null>(null);
  // Read once (like the engine); this component only mounts on the client after a pick.
  const reduced = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const poseOfRef = useRef(poseOf);
  const tweens = useRef(new Set<gsap.core.Tween | gsap.core.Timeline>());

  useEffect(() => {
    poseOfRef.current = poseOf;
  }, [poseOf]);

  const track = <T extends gsap.core.Tween | gsap.core.Timeline>(t: T): T => {
    tweens.current.add(t);
    return t;
  };

  const cancelSwap = () => {
    swap.current.forEach((t) => t.kill());
    swap.current = [];
  };

  /** Write the model transform. */
  const apply = () => {
    const el = modelRef.current;
    if (!el) return;
    const { x, y, s, rx, ry } = pose.current;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale3d(${s}, ${s}, ${s}) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };

  /** Centre of the stage and the scale that fits the part's diagonal into it. */
  const stagePose = (id: RackPartId) => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return { x: 0, y: 0, s: 1 };
    const sr = stage.getBoundingClientRect();
    const rr = root.getBoundingClientRect();
    const { w, h, d } = partSize(id);
    const k = unitPx(id);
    const diag = Math.hypot(w, h, d) * k;
    return {
      x: sr.left - rr.left + sr.width / 2,
      y: sr.top - rr.top + sr.height / 2,
      s: Math.min(1.1, (0.92 * Math.min(sr.width, sr.height)) / diag, (0.86 * sr.width) / (Math.max(w, d) * k * 1.2)),
    };
  };

  /** Where the part sits in the scene, at the scale of the drawing. */
  const scenePose = (id: RackPartId) => {
    const p = poseOfRef.current(id);
    return { x: p.x, y: p.y, s: p.px / (unitPx(id) * SQRT_2_3) };
  };

  useImperativeHandle(
    ref,
    () => ({
      enter() {
        const id = partRef.current;
        const f = reduced.current ? 0 : 1;
        const fade = fadeRef.current;
        const dialog = dialogRef.current;
        cancelSwap();
        leaving.current = false;
        mode.current = "lift";
        const prog = { t: 0 };
        gsap.set(fade, { opacity: 0 });
        gsap.set(dialog, { autoAlpha: 0 });
        track(
          gsap
            .timeline()
            .to(prog, {
              t: 1,
              duration: 1 * f,
              ease: "power3.inOut",
              onUpdate: () => {
                const from = scenePose(id);
                const to = stagePose(id);
                pose.current = {
                  x: lerp(from.x, to.x, prog.t),
                  y: lerp(from.y, to.y, prog.t),
                  s: lerp(from.s, to.s, prog.t),
                  rx: lerp(ISO.rx, base.current.rx, prog.t),
                  ry: lerp(ISO.ry, base.current.ry, prog.t),
                };
                apply();
              },
              onComplete: () => {
                mode.current = "idle";
                idleT.current = 0;
              },
            })
            .to(fade, { opacity: 1, duration: 0.2 * f }, 0)
            .fromTo(
              dialog,
              { autoAlpha: 0, y: 16 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.45 * f,
                ease: "power3.out",
                onComplete: () => {
                  // Keyboard users (a hotspot opened with Enter/Space shows
                  // :focus-visible) land on the dialog; mouse and touch users
                  // keep their focus untouched, so nothing visible changes.
                  const active = document.activeElement;
                  const keyboard = !!active && active !== document.body && active.matches(":focus-visible");
                  if (keyboard) closeRef.current?.focus({ preventScroll: true });
                },
              },
              0.6 * f,
            ),
        );
      },
      leave(done: () => void) {
        const id = partRef.current;
        const f = reduced.current ? 0 : 1;
        cancelSwap();
        leaving.current = true;
        mode.current = "lift";
        drag.current = null;
        const from = { ...pose.current };
        // Normalise so the model never spins the long way back.
        const ry = ISO.ry + 360 * Math.round((from.ry - ISO.ry) / 360);
        const prog = { t: 0 };
        track(gsap.to(dialogRef.current, { autoAlpha: 0, y: 12, duration: 0.2 * f }));
        track(
          gsap
            .timeline({ onComplete: done })
            .to(prog, {
              t: 1,
              duration: 0.75 * f,
              ease: "power3.inOut",
              onUpdate: () => {
                const to = scenePose(id);
                pose.current = {
                  x: lerp(from.x, to.x, prog.t),
                  y: lerp(from.y, to.y, prog.t),
                  s: lerp(from.s, to.s, prog.t),
                  rx: lerp(from.rx, ISO.rx, prog.t),
                  ry: lerp(from.ry, ry, prog.t),
                };
                apply();
              },
            })
            .to(fadeRef.current, { opacity: 0, duration: 0.25 * f }, 0.5 * f),
        );
      },
    }),
    // The handle only touches refs; stage and scene poses are measured live.
    [],
  );

  // Idle wobble and re-centring run on the GSAP ticker; under reduced motion
  // the model holds its resting angles and only follows the stage.
  useEffect(() => {
    const tick = (_time: number, deltaMs: number) => {
      if (mode.current !== "idle") return;
      idleT.current += deltaMs / 1000;
      const T = reduced.current ? 0 : idleT.current;
      pose.current = {
        ...stagePose(partRef.current),
        rx: base.current.rx + 2.5 * Math.sin(0.6 * T),
        ry: base.current.ry + 16 * Math.sin(0.32 * T),
      };
      apply();
    };
    gsap.ticker.add(tick);
    const live = tweens.current;
    return () => {
      gsap.ticker.remove(tick);
      live.forEach((t) => t.kill());
      live.clear();
    };
  }, []);

  // Part swap (tabs): pop the new model in at the stage, 90% to 100% scale.
  useLayoutEffect(() => {
    partRef.current = part;
    if (part === shownPart.current || leaving.current) return;
    shownPart.current = part;
    const f = reduced.current ? 0 : 1;
    const target = stagePose(part);
    pose.current = { ...target, s: 0.9 * target.s, rx: base.current.rx, ry: base.current.ry };
    apply();
    mode.current = "lift";
    cancelSwap();
    swap.current = [
      track(gsap.fromTo(fadeRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 * f })),
      track(
        gsap.to(pose.current, {
          s: target.s,
          duration: 0.45 * f,
          ease: "power3.out",
          onUpdate: apply,
          onComplete: () => {
            mode.current = "idle";
            idleT.current = 0;
          },
        }),
      ),
    ];
  }, [part]);

  // Keep the active tab visible in the sideways-scrolling tab row (phones).
  useLayoutEffect(() => {
    const row = tabsRef.current;
    const tab = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!row || !tab || row.scrollWidth <= row.clientWidth) return;
    row.scrollLeft = tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2;
  }, [part]);

  const pickTab = (id: RackPartId) => {
    if (id === partRef.current || mode.current !== "idle") return;
    mode.current = "lift";
    const f = reduced.current ? 0 : 1;
    cancelSwap();
    swap.current = [
      track(
        gsap.to(fadeRef.current, {
          opacity: 0,
          duration: 0.16 * f,
          onComplete: () => {
            if (!leaving.current) setPart(id);
          },
        }),
      ),
    ];
  };

  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    mode.current = "idle";
    idleT.current = 0;
  };

  const info = PARTS[part];
  const index = PART_ORDER.indexOf(part);
  const hosts = part === "rack" ? [] : hostsOn(part);
  const stageBox = "absolute inset-x-0 top-12 h-[46%] md:inset-y-0 md:left-0 md:right-[25rem] md:top-0 md:h-auto";

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-40">
      <div
        ref={stageRef}
        data-stage=""
        onPointerDown={(e) => {
          if (mode.current === "lift") return;
          drag.current = { x: e.clientX, y: e.clientY };
          mode.current = "drag";
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const dx = e.clientX - drag.current.x;
          const dy = e.clientY - drag.current.y;
          drag.current = { x: e.clientX, y: e.clientY };
          base.current = { rx: clamp(base.current.rx - 0.35 * dy, -80, 30), ry: base.current.ry + 0.5 * dx };
          pose.current = { ...pose.current, rx: base.current.rx, ry: base.current.ry };
          apply();
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`pointer-events-auto cursor-grab touch-none active:cursor-grabbing ${stageBox}`}
      />
      <div ref={fadeRef} className="absolute inset-0 opacity-0">
        <div
          aria-hidden
          className={`${stageBox} bg-[radial-gradient(ellipse_45%_40%_at_50%_55%,rgba(61,252,154,0.06),transparent_70%)]`}
        />
        <div ref={modelRef} aria-hidden className="absolute left-0 top-0 [transform-style:preserve-3d]">
          <PartModel key={part} id={part} m={unitPx(part)} />
        </div>
      </div>
      <div className="absolute inset-x-3 bottom-3 flex md:inset-x-auto md:inset-y-0 md:right-6 md:items-center">
        <div
          ref={dialogRef}
          role="dialog"
          aria-label={info.title}
          className="pointer-events-auto invisible max-h-[46svh] w-full overflow-y-auto rounded-xl border border-line-strong bg-card/95 p-5 font-mono shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)] md:max-h-[calc(100svh-6rem)] md:w-[22rem]"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-mint/80">
              {info.kicker}{" "}
              <span className="text-gray-3">
                · {unitLabel(part)} · {index + 1}/{PART_ORDER.length}
              </span>
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mt-1 text-gray-2 transition-colors hover:text-mint"
            >
              ✕
            </button>
          </div>
          <h3 className="mt-2 font-sans text-lg font-semibold leading-snug text-white">{info.title}</h3>
          <ul className="mt-2.5 space-y-1 text-[12px] text-white/65">
            {info.specs.map((s) => (
              <li key={s}>
                <span className="text-mint/70">›</span> {s}
              </li>
            ))}
          </ul>
          {part === "rack" ? (
            <div className="mt-4 border-t border-line pt-3">
              <p className={LABEL}>top to bottom</p>
              <ul className="mt-2 space-y-1 text-[12px] text-white/60">
                {SLOT_BANDS.flatMap((b) => b.parts).map((id) => (
                  <li key={id} className="flex gap-2">
                    <span className="w-14 shrink-0 text-gray-3">{unitLabel(id)}</span>
                    <button
                      type="button"
                      onClick={() => pickTab(id)}
                      className="min-w-0 text-left text-white/75 underline decoration-white/15 underline-offset-4 hover:text-white"
                    >
                      {PARTS[id].title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {hosts.length > 0 || CLUSTER.includes(part) ? (
            <div className="mt-4 border-t border-line pt-3">
              {hosts.map((h) => (
                <div key={h.id} className="mt-1 first:mt-0">
                  <p className={LABEL}>running on {info.tab}</p>
                  {h.services.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {h.services.map((s) => (
                        <li key={s} className="hl-chip">
                          {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-[12px] leading-relaxed text-white/60">
                      {h.idle ? "nothing assigned yet · spare capacity" : h.note}
                    </p>
                  )}
                </div>
              ))}
              {CLUSTER.includes(part) ? (
                <button
                  type="button"
                  onClick={() => onGo("map")}
                  className="mt-3 text-[12px] text-mint underline decoration-mint/40 underline-offset-4 hover:text-white"
                >
                  open the homelab map →
                </button>
              ) : null}
            </div>
          ) : null}
          {info.href || info.extra ? (
            <div className="mt-4 flex flex-col gap-2">
              {info.href ? (
                <a href={info.href} target="_blank" rel="noopener noreferrer" className="key key-sm key-light w-full">
                  View on {linkHost(info.href)} ↗
                </a>
              ) : null}
              {info.extra ? (
                <a
                  href={info.extra.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-gray-2 underline decoration-white/20 underline-offset-4 hover:text-white/80"
                >
                  {info.extra.label} ↗
                </a>
              ) : null}
            </div>
          ) : null}
          <div
            ref={tabsRef}
            className="no-scrollbar -mx-5 mt-4 flex gap-x-2 overflow-x-auto border-t border-line px-5 pb-1 pt-4 md:mx-0 md:flex-wrap md:gap-y-2.5 md:overflow-visible md:px-0 md:pb-0"
          >
            {PART_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => pickTab(id)}
                aria-pressed={id === part}
                className={`key key-xs shrink-0 ${id === part ? "key-light" : ""}`}
              >
                {PARTS[id].tab}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-gray-3">drag to rotate · esc to go back</p>
        </div>
      </div>
    </div>
  );
}
