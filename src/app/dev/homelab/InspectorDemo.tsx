"use client";

/**
 * /dev/homelab inspector demo (B7). A stand-in for the room engine: a
 * full-viewport "hero" with a CSS-3D rack drawn at true isometric angles as
 * the scene, a dim overlay, and the real RackInspector driven through its
 * ref exactly as the engine does (enter after mount, leave then unmount).
 * `?inspect=<part>` opens a part on load (for screenshots).
 */

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { RACK_PART_IDS, LED, type RackInspectorHandle, type RackPartId, type ScenePose } from "@/components/lab/contracts";
import { RackInspector } from "@/components/lab/RackInspector";
import { RackModel } from "@/components/lab/Box3D";
import { D, H, PART_LOCAL, PARTS, W } from "@/lib/rack";

const RX = (-35.264 * Math.PI) / 180;
const RY = (-45 * Math.PI) / 180;
const K_RACK = 460 / Math.max(W, H, D);
/** Scene scale of the stand-in rack. */
const SCENE_S = 0.42;

/** Screen offset of a model-space point (px) under rotateX(RX) rotateY(RY), orthographic. */
function project(x: number, y: number, z: number): [number, number] {
  const x1 = x * Math.cos(RY) + z * Math.sin(RY);
  const z1 = -x * Math.sin(RY) + z * Math.cos(RY);
  const y2 = y * Math.cos(RX) - z1 * Math.sin(RX);
  return [x1, y2];
}

/** Hidden glow gradients (the room art defines these on "/"). */
function GlowDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        {Object.entries(LED).map(([name, color]) => (
          <radialGradient key={name} id={`lab-glow-${name}`}>
            <stop offset="0%" stopColor={color} stopOpacity={0.7} />
            <stop offset="35%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </radialGradient>
        ))}
      </defs>
    </svg>
  );
}

export function InspectorDemo({ open: initialOpen }: { open: RackPartId | null }) {
  const [open, setOpen] = useState<RackPartId | null>(initialOpen);
  const heroRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const inspector = useRef<RackInspectorHandle>(null);
  const busy = useRef(false);

  const poseOf = (id: RackPartId): ScenePose => {
    const hero = heroRef.current?.getBoundingClientRect();
    const scene = sceneRef.current?.getBoundingClientRect();
    const L = PART_LOCAL[id];
    const cx = ((L.u[0] + L.u[1]) / 2 - W / 2) * K_RACK;
    const cy = ((L.v[0] + L.v[1]) / 2 - H / 2) * K_RACK;
    const cz = (D / 2 - (L.d[0] + L.d[1]) / 2) * K_RACK;
    const [px, py] = project(cx, cy, cz);
    const ox = scene && hero ? scene.left - hero.left : 0;
    const oy = scene && hero ? scene.top - hero.top : 0;
    return { x: ox + px * SCENE_S, y: oy + py * SCENE_S, px: K_RACK * SCENE_S * Math.sqrt(2 / 3) };
  };

  useLayoutEffect(() => {
    if (!open) return;
    busy.current = true;
    gsap.to(dimRef.current, { autoAlpha: 1, duration: 0.5, delay: 0.35 });
    const id = window.setTimeout(() => {
      inspector.current?.enter();
      window.setTimeout(() => (busy.current = false), 1050);
    }, 400);
    return () => window.clearTimeout(id);
  }, [open]);

  const close = () => {
    if (busy.current || !open) return;
    busy.current = true;
    gsap.to(dimRef.current, { autoAlpha: 0, duration: 0.5, delay: 0.25 });
    inspector.current?.leave(() => {
      busy.current = false;
      setOpen(null);
    });
  };

  return (
    <div
      ref={heroRef}
      onKeyDown={(e) => e.key === "Escape" && close()}
      className="relative h-[100svh] overflow-clip bg-background"
    >
      <GlowDefs />
      <div
        ref={sceneRef}
        aria-hidden
        className="absolute left-[38%] top-[52%] [transform-style:preserve-3d]"
        style={{ transform: `scale3d(${SCENE_S}, ${SCENE_S}, ${SCENE_S}) rotateX(-35.264deg) rotateY(-45deg)` }}
      >
        <RackModel m={K_RACK} />
      </div>
      <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
        {RACK_PART_IDS.map((id) => (
          <button key={id} type="button" className="key key-xs" onClick={() => !open && setOpen(id)}>
            {PARTS[id].tab}
          </button>
        ))}
      </div>
      <div ref={dimRef} onClick={close} className="invisible absolute inset-0 z-30 bg-[rgba(2,4,3,0.8)] opacity-0" />
      {open ? (
        <RackInspector
          key={open}
          ref={inspector}
          initial={open}
          poseOf={poseOf}
          onClose={close}
          onGo={(next) => {
            close();
            console.info("[dev/homelab] chain to", next);
          }}
        />
      ) : null}
    </div>
  );
}
