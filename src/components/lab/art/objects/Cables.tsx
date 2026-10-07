/**
 * The two floor cables (spec 04 sections 4.3 and 9.1 steps 12 and 26): dark
 * cable beds in the base layer, glowing cables, travelling packets, the
 * blocked packet and the firewall alert in the lights layer. The lit cable
 * paths carry the ids the engine's DrawSVG and the ambient MotionPath target.
 */

import { CABLE_PATH_ID, LED, type CableId } from "@/components/lab/contracts";
import { iso, pathD, r2 } from "@/lib/iso";
import type { Vec3 } from "@/components/lab/contracts";
import { BLOCKED_AT, CABLES, PACKETS, PACKET_CORE } from "../config";

const IDS = Object.keys(CABLES) as CableId[];

/** Base layer: unlit beds, painted straight onto the SVG (always full opacity). */
export function CableBeds() {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {IDS.map((id) => {
        const d = pathD(CABLES[id].pts);
        return (
          <g key={id}>
            <path d={d} stroke="#0c1211" strokeWidth={3.2} />
            <path d={d} stroke="rgba(160,255,230,0.07)" strokeWidth={1} />
          </g>
        );
      })}
    </g>
  );
}

/** Lit cable groups ([data-cable]); the inner core path has the shared id. */
export function LitCables({ lit }: { lit: boolean }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {IDS.map((id) => {
        const { pts, color } = CABLES[id];
        const d = pathD(pts);
        return (
          <g key={id} data-cable={id} opacity={lit ? 1 : 0}>
            <path d={d} stroke={LED[color]} strokeOpacity={0.12} strokeWidth={5} />
            <path id={CABLE_PATH_ID[id]} d={d} stroke={LED[color]} strokeOpacity={0.55} strokeWidth={1.1} />
          </g>
        );
      })}
    </g>
  );
}

function Dot({ color, core }: { color: string; core: string }) {
  return (
    <>
      <circle r={9} fill={`url(#lab-glow-${color})`} />
      <circle r={2} fill={core} />
    </>
  );
}

/** Packet groups for the ambient loops (hidden until MotionPath runs them). */
export function Packets() {
  return (
    <>
      {PACKETS.map((p) => (
        <g
          key={`${p.cable}${p.dir}`}
          data-pkt=""
          data-pkt-cable={p.cable}
          data-pkt-dir={p.dir}
          data-pkt-color={p.color}
          opacity={0}
        >
          <Dot color={p.color} core={PACKET_CORE} />
        </g>
      ))}
      <g data-blocked-pkt="" opacity={0}>
        <Dot color="red" core={LED.red} />
      </g>
    </>
  );
}

/** Point at a fraction of a world polyline's projected length. */
function pointAlong(points: readonly Vec3[], t: number): [number, number] {
  const scr = points.map(([x, y, z]) => iso(x, y, z));
  const seg = scr.slice(1).map((p, i) => Math.hypot(p[0] - scr[i][0], p[1] - scr[i][1]));
  let left = t * seg.reduce((a, b) => a + b, 0);
  for (let i = 0; i < seg.length; i++) {
    if (left <= seg[i] || i === seg.length - 1) {
      const k = seg[i] ? Math.min(1, left / seg[i]) : 0;
      return [r2(scr[i][0] + (scr[i + 1][0] - scr[i][0]) * k), r2(scr[i][1] + (scr[i + 1][1] - scr[i][1]) * k)];
    }
    left -= seg[i];
  }
  return [r2(scr[0][0]), r2(scr[0][1])];
}

/** Static packets frozen mid-flight, only for the landing still render. */
export function StillPackets() {
  return (
    <>
      {PACKETS.filter((p) => p.still >= 0).map((p) => {
        const [x, y] = pointAlong(CABLES[p.cable].pts, p.still);
        return (
          <g key={`s${p.cable}${p.dir}`} transform={`translate(${x} ${y})`}>
            <Dot color={p.color} core={PACKET_CORE} />
          </g>
        );
      })}
    </>
  );
}

/** Burst ring and "blocked · opnsense" label (the lab's edge firewall) where the red packet dies (unmasked). */
export function FirewallAlert() {
  const [ax, ay] = iso(...BLOCKED_AT).map(r2);
  return (
    <>
      <circle data-fw-burst="" cx={ax} cy={ay} r={2} fill="none" stroke={LED.red} strokeWidth={1} opacity={0} />
      <g data-fw-alert="" opacity={0}>
        <polyline
          points={`${ax},${r2(ay - 2)} ${r2(ax - 8)},${r2(ay - 26)}`}
          fill="none"
          stroke={LED.red}
          strokeOpacity={0.6}
          strokeWidth={0.8}
        />
        <rect
          x={r2(ax - 104)}
          y={r2(ay - 41)}
          width={108}
          height={15}
          rx={3}
          fill="rgba(20,6,8,0.92)"
          stroke={LED.red}
          strokeOpacity={0.6}
          strokeWidth={0.8}
        />
        <text x={r2(ax - 50)} y={r2(ay - 30.6)} fontSize={8.6} fill="#fecdd3" textAnchor="middle" className="lab-mono">
          blocked · opnsense
        </text>
      </g>
    </>
  );
}
