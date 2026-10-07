"use client";

/**
 * SVG #4: the clickable hotspot polygons (spec 05 sections 2.2, 3.3, 5.2, 5.6).
 * Transparent polygons with role="button"; the mint outline comes from
 * .lab-hot in lab.css. Tooltips are positioned by the camera (JS), so this
 * layer only reports hover and focus.
 */

import { memo } from "react";
import { INITIAL_VIEWBOX, isLight, type HotspotId, type LightId } from "@/components/lab/contracts";
import { HOTSPOTS } from "@/components/lab/art/hotspots";

export interface HotspotLayerProps {
  /** Live and no focus open: polygons are tabbable and clickable. */
  enabled: boolean;
  /** Click passes the pointer position (tap-to-zoom); keyboard passes none. */
  onPick: (id: HotspotId, pointer?: { x: number; y: number }) => void;
  onHover: (id: HotspotId | null) => void;
  lightStates: Record<LightId, boolean>;
}

function HotspotLayerImpl({ enabled, onPick, onHover, lightStates }: HotspotLayerProps) {
  return (
    <svg
      data-cam=""
      data-hotspots={enabled ? "on" : "off"}
      viewBox={INITIAL_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 h-full w-full"
    >
      {HOTSPOTS.filter((h) => h.id !== "print").map((h) => (
        <polygon
          key={h.id}
          points={h.points}
          data-hot={h.id}
          className="lab-hot"
          role="button"
          tabIndex={enabled ? 0 : -1}
          aria-label={h.title}
          aria-pressed={isLight(h.id) ? lightStates[h.id] : undefined}
          onClick={(e) => {
            e.stopPropagation();
            onPick(h.id, { x: e.clientX, y: e.clientY });
          }}
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse") onHover(h.id);
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") onHover(null);
          }}
          onFocus={() => onHover(h.id)}
          onBlur={() => onHover(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onPick(h.id);
            }
          }}
        >
          {h.tip !== null ? <title>{h.title}</title> : null}
        </polygon>
      ))}
    </svg>
  );
}

export const HotspotLayer = memo(HotspotLayerImpl);
