/**
 * Framed things on the walls (spec 04 section 9.1 steps 7 and 9): the art
 * print and the network map board on wall A, the four certificates, the
 * poster and the network outlet on wall B. Drawn in wall-local units inside
 * the wall face matrices.
 *
 * The print and the poster are raster art owned by the panels area
 * (ROOM_CONTENT.printArt = /lab/print.webp, ROOM_CONTENT.poster.src =
 * /lab/poster.webp; ROOM_CONTENT.print holds the print's labels); a small
 * vector version sits under each image so the frame never reads empty if the
 * file is missing.
 */

import { CREDENTIALS, ROOM_CONTENT } from "@/content";
import type { WallCert } from "@/content/types";
import { CERT_H, CERT_U, CERT_V, CERT_W, FRAME, MAP, OUTLET, POSTER, PRINT, SHELL } from "../config";
import { WALL_A_LEN, WALL_B_LEN } from "./Shell";

const SHADOW = "rgba(0,0,0,0.45)";

/* ------------------------------------------------------------------------ */
/* Wall A                                                                    */
/* ------------------------------------------------------------------------ */

/** Warm lamplit interior: an arched opening with a patch of evening sky. */
function PrintFallback({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="url(#lab-print-warm)" />
      <path
        d={`M${x + w * 0.36} ${y + h}V${y + h * 0.42}a${w * 0.14} ${w * 0.14} 0 0 1 ${w * 0.28} 0V${y + h}Z`}
        fill="#20160e"
      />
      <path
        d={`M${x + w * 0.4} ${y + h * 0.78}V${y + h * 0.44}a${w * 0.1} ${w * 0.1} 0 0 1 ${w * 0.2} 0V${y + h * 0.78}Z`}
        fill="#6f9cc4"
      />
      <rect x={x + w * 0.4} y={y + h * 0.62} width={w * 0.2} height={h * 0.16} fill="#c9a36a" opacity={0.55} />
      <rect x={x} y={y + h * 0.8} width={w} height={h * 0.2} fill="#2b1c11" />
      <circle cx={x + w * 0.16} cy={y + h * 0.36} r={w * 0.05} fill="#ffd9a0" opacity={0.85} />
      <circle cx={x + w * 0.84} cy={y + h * 0.36} r={w * 0.05} fill="#ffd9a0" opacity={0.85} />
    </g>
  );
}

export function FramedPrint() {
  const { u, v, w, h } = PRINT;
  const px = u + 6;
  const py = v + 6;
  return (
    <g>
      <rect x={u + 1.4} y={v + 1.8} width={w} height={h} fill={SHADOW} />
      <rect x={u} y={v} width={w} height={h} fill={FRAME} />
      <rect x={u + 2.4} y={v + 2.4} width={w - 4.8} height={h - 4.8} fill="#ecebe7" />
      <g clipPath="url(#lab-print-clip)">
        <PrintFallback x={px} y={py} w={w - 12} h={h - 12} />
        <image
          href={ROOM_CONTENT.printArt}
          x={px}
          y={py}
          width={w - 12}
          height={h - 12}
          preserveAspectRatio="xMidYMid slice"
        />
      </g>
    </g>
  );
}

/** Compact summary of the owner's two-switch topology, in board coordinates. */
export const MAP_NODES: [number, number][] = [
  [8, 22], [23, 22], [39, 22], [60, 12],
  [71, 22], [60, 29], [40, 35], [65, 38],
];

export function NetworkMap() {
  const { u, v, w, h } = MAP;
  const n = MAP_NODES;
  const seg = (a: number, b: number) => `M${n[a][0]} ${n[a][1]} L${n[b][0]} ${n[b][1]}`;
  return (
    <g>
      <rect x={u + 1.2} y={v + 1.6} width={w} height={h} fill={SHADOW} />
      <rect x={u} y={v} width={w} height={h} fill={FRAME} />
      <rect x={u + 2} y={v + 2} width={w - 4} height={h - 4} fill="#0f1a24" />
      <g transform={`translate(${u} ${v})`}>
        <text x={5} y={7.4} fontSize={2.8} fill="#e2e8f0" className="lab-mono">
          homelab.map
        </text>
        {/* WAN → firewall → 8-port switch; the 5-port switch is downstream. */}
        <g stroke="#94a3b8" strokeWidth={0.4} fill="none" opacity={0.8}>
          <path d={[seg(0, 1), seg(1, 2)].join(" ")} />
          <path d={[seg(2, 3), seg(2, 4), seg(2, 5), seg(2, 6)].join(" ")} />
          <path d={seg(6, 7)} />
        </g>
        {n.map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r={1.8} fill="#0f1a24" stroke="#e2e8f0" strokeWidth={0.45} />
            <text x={cx} y={cy + 4.6} fontSize={2.1} fill="#cbd5e1" textAnchor="middle" className="lab-mono">
              {ROOM_CONTENT.mapNodes[i]}
            </text>
          </g>
        ))}
      </g>
    </g>
  );
}

export function Baseboard({ len }: { len: number }) {
  return <rect y={SHELL.h - 5} width={len} height={5} fill="#0e1113" />;
}

export function WallABaseboard() {
  return <Baseboard len={WALL_A_LEN} />;
}

/* ------------------------------------------------------------------------ */
/* Wall B                                                                    */
/* ------------------------------------------------------------------------ */

function Wordmark({ wall, x, y }: { wall: WallCert; x: number; y: number }) {
  const colors = Array.isArray(wall.wordmarkColor) ? wall.wordmarkColor : null;
  return (
    <text x={x} y={y} fontSize={3.2}>
      {colors ? (
        wall.wordmark.split("").map((ch, i) => (
          <tspan key={i} fill={colors[i % colors.length]}>
            {ch}
          </tspan>
        ))
      ) : (
        <tspan fill={wall.wordmarkColor as string} fontWeight={700}>
          {wall.wordmark}
        </tspan>
      )}
    </text>
  );
}

function Certificate({ u, wall }: { u: number; wall: WallCert }) {
  const v = CERT_V;
  const pw = CERT_W - 4.8;
  const ph = CERT_H - 4.8;
  return (
    <g>
      <rect x={u + 1.2} y={v + 1.6} width={CERT_W} height={CERT_H} fill={SHADOW} />
      <rect x={u} y={v} width={CERT_W} height={CERT_H} fill={FRAME} />
      <rect x={u + 2.4} y={v + 2.4} width={pw} height={ph} fill="#e9e6de" />
      {wall.band ? <rect x={u + 2.4} y={v + 2.4} width={pw} height={7} fill={wall.band} /> : null}
      <Wordmark wall={wall} x={u + 4.6} y={v + 8} />
      <text x={u + 4.6} y={v + 12.6} fontSize={3.3} fill="#1f2328" fontWeight={700}>
        {wall.title}
      </text>
      <rect x={u + 4.6} y={v + 16} width={19} height={0.8} fill="#b5b1a8" />
      <rect x={u + 4.6} y={v + 18.4} width={12} height={0.8} fill="#b5b1a8" />
      <circle cx={u + 28.6} cy={v + 21} r={3} fill={wall.seal} opacity={0.85} />
      <circle cx={u + 28.6} cy={v + 21} r={1.9} fill="none" stroke="#f5f3ee" strokeWidth={0.4} />
    </g>
  );
}

/** The four certificates in wall order, read from the credentials' wall config. */
export function Certificates() {
  return (
    <g>
      {CERT_U.map((u, i) => {
        const cred = CREDENTIALS.find((c) => c.wall.slot === `cert-${i + 1}`) ?? CREDENTIALS[i];
        return cred ? <Certificate key={u} u={u} wall={cred.wall} /> : null;
      })}
    </g>
  );
}

/** Two-colour screenprint: a lighthouse beam sweeping over a night sea. */
function PosterFallback({ x, y, s }: { x: number; y: number; s: number }) {
  const k = s / 60;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <rect width={60} height={60} fill="url(#lab-poster-sea)" />
      <path d="M38 17L-2 4V18Z" fill="#f2d99a" opacity={0.35} />
      <path d="M38 17L62 8V20Z" fill="#f2d99a" opacity={0.18} />
      <circle cx={12} cy={9} r={2.4} fill="#efe6cc" opacity={0.9} />
      <path d="M0 40C8 37 14 41 22 39S36 36 44 39S56 41 60 39V60H0Z" fill="#0b1626" />
      <path d="M33 44L35.4 19H40.6L43 44Z" fill="#efe6cc" />
      <path d="M33.9 35H42.1L42.6 40H33.4ZM34.8 26H41.2L41.6 30H34.4Z" fill="#c2533b" />
      <rect x={34.6} y={15.2} width={6.8} height={3.8} fill="#1b2a3e" />
      <rect x={36} y={16} width={4} height={2.4} fill="#ffe7a8" />
      <path d="M34 15.2L38 11.6L42 15.2Z" fill="#c2533b" />
      <path d="M29 44H47L49 47H27Z" fill="#26384f" />
      <path d="M2 50H18M24 53H44M8 56H30M40 50H58" stroke="#3d5d80" strokeWidth={0.5} />
    </g>
  );
}

export function Poster() {
  const { u, v, w, h } = POSTER;
  return (
    <g>
      <rect x={u + 1.2} y={v + 1.6} width={w} height={h} fill={SHADOW} />
      <rect x={u} y={v} width={w} height={h} fill={FRAME} />
      <g clipPath="url(#lab-poster-clip)">
        <PosterFallback x={u + 1.8} y={v + 1.8} s={60.4} />
        <image
          href={ROOM_CONTENT.poster.src}
          x={u + 1.8}
          y={v + 1.8}
          width={60.4}
          height={60.4}
          preserveAspectRatio="xMidYMid slice"
        />
      </g>
    </g>
  );
}

export function Outlet() {
  const { u, v, w, h } = OUTLET;
  return (
    <g>
      <rect x={u} y={v} width={w} height={h} rx={0.8} fill="#c9ccd0" />
      <rect x={u + 2.3} y={v + 3.4} width={4.4} height={3.6} fill="#1a1c1e" />
    </g>
  );
}

export function WallBBaseboard() {
  return <Baseboard len={WALL_B_LEN} />;
}
