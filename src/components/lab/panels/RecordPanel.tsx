"use client";

/**
 * Record (`record`), spec 05 section 3.4: the vinyl lifts off the platter and
 * keeps spinning at 33 1/3 rpm (1.8 s per turn). The disc carries [data-spin];
 * the engine sets its animation-delay so it continues the in-scene vinyl's
 * rotation phase. The sheen and rim sit outside the spinning disc.
 */

import type { PanelProps } from "@/components/lab/contracts";
import { ROOM_CONTENT } from "@/content";
import { FocusShell, KEY } from "./FocusShell";

const GROOVES =
  "repeating-radial-gradient(circle at 50% 50%, #0c0c0d 0px, #0c0c0d 1.3px, #161618 1.3px, #161618 2.6px)";
const SHEEN =
  "conic-gradient(from 25deg, transparent 0deg, rgba(255,255,255,0.09) 16deg, transparent 38deg, transparent 180deg, rgba(255,255,255,0.06) 198deg, transparent 222deg, transparent 360deg)";
const RINGS = ["4%", "13%", "21%"];

export function RecordPanel({ onClose, onStopMusic }: PanelProps) {
  const { artist, title } = ROOM_CONTENT.record;
  return (
    <FocusShell
      label={`Record: ${artist} · ${title}`}
      onClose={onClose}
      closeLabel="back to the room"
      topOnPhones
      caption={`${artist} · ${title}`}
      actions={
        onStopMusic ? (
          <button type="button" onClick={onStopMusic} className={KEY}>
            ■ stop the music
          </button>
        ) : undefined
      }
    >
      <div className="relative aspect-square w-[min(72vw,calc(100svh-30rem))] rounded-full shadow-[0_50px_140px_-30px_rgba(0,0,0,1),0_0_120px_-20px_rgba(201,206,211,0.14)] sm:w-[min(86vw,calc(100svh-9.5rem))]">
        <div data-spin="" className="lab-disc-spin absolute inset-0 rounded-full" style={{ background: GROOVES }}>
          {RINGS.map((inset) => (
            <div
              key={inset}
              className="absolute rounded-full border border-black/80 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
              style={{ inset }}
            />
          ))}
          <div className="absolute inset-[33%] overflow-hidden rounded-full bg-[#c2c6cb] text-center">
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[#8f959c]" />
            <p className="absolute inset-x-0 top-[27%] -translate-y-1/2 whitespace-nowrap font-bold leading-none tracking-[0.14em] text-[#15171a] [font-size:clamp(7px,1.7vmin,17px)]">
              {artist}
            </p>
            <p className="absolute inset-x-0 top-[64%] -translate-y-1/2 whitespace-nowrap font-semibold leading-none text-[#101214] [font-size:clamp(9px,1.6vmin,16px)]">
              {title}
            </p>
            <p className="absolute inset-x-0 top-[80%] -translate-y-1/2 whitespace-nowrap font-mono leading-none text-[#101214]/70 [font-size:clamp(6px,1vmin,11px)]">
              33⅓ rpm
            </p>
          </div>
          <div className="absolute left-1/2 top-1/2 h-[2.2%] w-[2.2%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#cfd3d8] shadow-[inset_0_0_2px_rgba(0,0,0,0.6)]" />
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-full" style={{ background: SHEEN }} />
        <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.06)]" />
      </div>
    </FocusShell>
  );
}
