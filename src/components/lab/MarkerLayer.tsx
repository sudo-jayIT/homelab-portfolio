"use client";

/**
 * SVG #3: the 8 pulsing hint markers (spec 05 sections 2.2, 3.3, 5.1).
 * The camera writes scale() on every [data-mk] group so markers keep their
 * screen size; the animation delay staggers the pings by 0.43 s.
 */

import { memo } from "react";
import { INITIAL_VIEWBOX, MARKED } from "@/components/lab/contracts";
import { HOTSPOT } from "@/components/lab/art/hotspots";
import { pointsBounds } from "@/lib/iso";

const MARKERS = MARKED.filter((id) => HOTSPOT[id]).map((id) => {
  const h = HOTSPOT[id];
  let at = h.marker;
  if (!at) {
    const b = pointsBounds(h.points);
    at = [b.x + b.w / 2, b.y + b.h / 2];
  }
  return { id, at };
});

function MarkerLayerImpl({ show }: { show: boolean }) {
  return (
    <svg
      data-cam=""
      viewBox={INITIAL_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-1000 ${show ? "opacity-100" : "opacity-0"}`}
    >
      {MARKERS.map((mk, i) => (
        <g key={mk.id} transform={`translate(${mk.at[0].toFixed(1)} ${mk.at[1].toFixed(1)})`}>
          <g data-mk="" className="lab-mk" style={{ animationDelay: `${(0.43 * i).toFixed(2)}s` }}>
            <circle r={6.5} className="lab-mk-ring" />
            <circle r={6.5} className="lab-mk-back" />
            <circle r={2.6} className="lab-mk-dot" />
          </g>
        </g>
      ))}
    </svg>
  );
}

export const MarkerLayer = memo(MarkerLayerImpl);
