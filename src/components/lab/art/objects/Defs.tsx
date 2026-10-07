/**
 * Document-global gradients, patterns, clips and the occlusion mask
 * (spec 04 section 3.3). Base defs live in SVG #1, light defs in SVG #2.
 */

import { ART_IDS, LED, type LedColor } from "@/components/lab/contracts";
import { iso, pts, r2 } from "@/lib/iso";
import { OCCLUDERS, POSTER, PRINT, RACK, SPOT, WINDOW } from "../config";

const LED_COLORS = Object.keys(LED) as LedColor[];

export function BaseDefs() {
  return (
    <defs>
      <radialGradient id={ART_IDS.shadow}>
        <stop offset="0%" stopColor="#000" stopOpacity={0.75} />
        <stop offset="100%" stopColor="#000" stopOpacity={0} />
      </radialGradient>
      <radialGradient id={ART_IDS.halo}>
        <stop offset="0%" stopColor="#12302b" stopOpacity={0.55} />
        <stop offset="60%" stopColor="#0b1a18" stopOpacity={0.25} />
        <stop offset="100%" stopColor="#050706" stopOpacity={0} />
      </radialGradient>
      <radialGradient id={ART_IDS.lens} cx="40%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#3b4a6b" />
        <stop offset="55%" stopColor="#141b2b" />
        <stop offset="100%" stopColor="#05070b" />
      </radialGradient>
      <linearGradient id={ART_IDS.sky} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#080c1a" />
        <stop offset="55%" stopColor="#141a33" />
        <stop offset="100%" stopColor="#3a2a44" />
      </linearGradient>
      <pattern id={ART_IDS.perf} width={3} height={3} patternUnits="userSpaceOnUse">
        <rect width={1.3} height={1.3} fill="#0a0b0c" />
      </pattern>
      <clipPath id="lab-win-clip">
        <rect width={WINDOW.w} height={WINDOW.h} />
      </clipPath>
      <clipPath id="lab-print-clip">
        <rect x={PRINT.u + 6} y={PRINT.v + 6} width={PRINT.w - 12} height={PRINT.h - 12} />
      </clipPath>
      <clipPath id="lab-poster-clip">
        <rect x={POSTER.u + 1.8} y={POSTER.v + 1.8} width={60.4} height={60.4} />
      </clipPath>
      {/* Fallback art gradients (shown only while the raster wall art is missing). */}
      <linearGradient id="lab-print-warm" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2a1a10" />
        <stop offset="60%" stopColor="#8a5a2c" />
        <stop offset="100%" stopColor="#3b2414" />
      </linearGradient>
      <linearGradient id="lab-poster-sea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0f1d33" />
        <stop offset="58%" stopColor="#1f3a57" />
        <stop offset="100%" stopColor="#0b1626" />
      </linearGradient>
    </defs>
  );
}

export function LightDefs() {
  const lens = iso(...SPOT.lens);
  const cabTop = iso(RACK.x + RACK.w / 2, RACK.y + RACK.d / 2, RACK.z);
  return (
    <defs>
      {LED_COLORS.map((c) => (
        <radialGradient key={`g-${c}`} id={ART_IDS.glow(c)}>
          <stop offset="0%" stopColor={LED[c]} stopOpacity={0.7} />
          <stop offset="35%" stopColor={LED[c]} stopOpacity={0.22} />
          <stop offset="100%" stopColor={LED[c]} stopOpacity={0} />
        </radialGradient>
      ))}
      {LED_COLORS.map((c) => (
        <radialGradient key={`p-${c}`} id={ART_IDS.pool(c)}>
          <stop offset="0%" stopColor={LED[c]} stopOpacity={0.16} />
          <stop offset="45%" stopColor={LED[c]} stopOpacity={0.05} />
          <stop offset="100%" stopColor={LED[c]} stopOpacity={0} />
        </radialGradient>
      ))}
      <radialGradient id={ART_IDS.crtGlow} cx="50%" cy="45%" r="65%">
        <stop offset="0%" stopColor="#ffb347" stopOpacity={0.16} />
        <stop offset="100%" stopColor="#ffb347" stopOpacity={0} />
      </radialGradient>
      <pattern id={ART_IDS.scan} width={4} height={1.1} patternUnits="userSpaceOnUse">
        <rect width={4} height={0.45} fill="rgba(0,0,0,0.35)" />
      </pattern>
      <linearGradient
        id={ART_IDS.beam}
        gradientUnits="userSpaceOnUse"
        x1={r2(lens[0])}
        y1={r2(lens[1])}
        x2={r2(cabTop[0])}
        y2={r2(cabTop[1])}
      >
        <stop offset="0%" stopColor="#e6f0ff" stopOpacity={0.3} />
        <stop offset="55%" stopColor="#e6f0ff" stopOpacity={0.08} />
        <stop offset="100%" stopColor="#e6f0ff" stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id={ART_IDS.vinylSheen} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fff" stopOpacity={0} />
        <stop offset="44%" stopColor="#fff" stopOpacity={0} />
        <stop offset="50%" stopColor="#fff" stopOpacity={0.13} />
        <stop offset="56%" stopColor="#fff" stopOpacity={0} />
        <stop offset="100%" stopColor="#fff" stopOpacity={0} />
      </linearGradient>
      <mask id={ART_IDS.occlude} maskUnits="userSpaceOnUse" x={-400} y={-400} width={2400} height={1900}>
        <rect x={-400} y={-400} width={2400} height={1900} fill="#fff" />
        {OCCLUDERS.map((hull, i) => (
          <polygon key={i} points={pts(hull)} fill="#000" />
        ))}
      </mask>
    </defs>
  );
}
