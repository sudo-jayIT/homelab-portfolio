"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { HOTSPOTS, TIP_ANCHORS } from "@/components/lab/art/hotspots";
import { useAmbient } from "@/components/lab/art/useAmbient";
import { MARKED } from "@/components/lab/contracts";

interface Props {
  base: ReactNode;
  lights: ReactNode;
  viewBox: string;
  initialLit: boolean;
  showUi: boolean;
  showHot: boolean;
  ambient: boolean;
}

/** Mirror of the engine's lightUp / powerDown end states, applied to the DOM. */
function applyLit(root: HTMLElement, lit: boolean) {
  const set = (sel: string, v: number) =>
    root.querySelectorAll<SVGElement>(sel).forEach((el) => {
      el.style.opacity = String(v);
    });
  set("[data-base]", lit ? 1 : 0.42);
  set('[data-lights]:not([data-lights="myrack"]), [data-unit], [data-pool], [data-cable]', lit ? 1 : 0);
}

export function RoomArtPreview({ base, lights, viewBox, initialLit, showUi, showHot, ambient }: Props) {
  const ref = useRef<HTMLElement>(null);
  const loops = useAmbient(ref);
  const [lit, setLit] = useState(initialLit);
  const [hot, setHot] = useState(showHot);
  const [running, setRunning] = useState(ambient);
  const [music, setMusic] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    applyLit(ref.current, lit);
    if (lit && running) loops.start();
    else loops.pause();
  }, [lit, running, loops]);

  useEffect(() => {
    const html = document.documentElement;
    if (music) html.setAttribute("data-lab-music", "");
    else html.removeAttribute("data-lab-music");
    return () => html.removeAttribute("data-lab-music");
  }, [music]);

  const key = (on: boolean) =>
    `key key-xs ${on ? "key-light" : ""}`;

  return (
    <section ref={ref} id="room-art-preview" className="fixed inset-0 overflow-hidden bg-background">
      <div className="pointer-events-none absolute -inset-4 [will-change:transform] md:-inset-6">
        {base}
        {lights}
        {hot ? (
          <svg viewBox={viewBox} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" aria-hidden>
            {HOTSPOTS.map((h) => (
              <polygon
                key={h.id}
                points={h.points}
                fill="rgba(61,252,154,0.07)"
                stroke="rgba(61,252,154,0.8)"
                strokeWidth={0.8}
                strokeLinejoin="round"
              />
            ))}
            {HOTSPOTS.map((h) => (
              <circle key={`t${h.id}`} cx={TIP_ANCHORS[h.id].top[0]} cy={TIP_ANCHORS[h.id].top[1]} r={1.6} fill="#22d3ee" />
            ))}
            {MARKED.map((id) => {
              const m = HOTSPOTS.find((h) => h.id === id)?.marker;
              return m ? (
                <g key={`m${id}`} transform={`translate(${m[0]} ${m[1]})`}>
                  <circle r={6.5} fill="rgba(5,8,7,0.62)" stroke="rgba(61,252,154,0.5)" strokeWidth={0.9} />
                  <circle r={2.6} fill="#3dfc9a" />
                </g>
              ) : null;
            })}
          </svg>
        ) : null}
      </div>
      {showUi ? (
        <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2 font-mono">
          <button type="button" className={key(lit)} onClick={() => setLit((v) => !v)}>
            {lit ? "lit" : "dark"}
          </button>
          <button type="button" className={key(running)} onClick={() => setRunning((v) => !v)}>
            ambient {running ? "on" : "off"}
          </button>
          <button type="button" className={key(hot)} onClick={() => setHot((v) => !v)}>
            hotspots
          </button>
          <button type="button" className={key(music)} onClick={() => setMusic((v) => !v)}>
            ♪ notes
          </button>
        </div>
      ) : null}
    </section>
  );
}
