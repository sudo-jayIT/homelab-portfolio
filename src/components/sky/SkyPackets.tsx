/**
 * Two drifting packets (docs/theme/b.md section 4), in the old satellites'
 * slot: a 3px head with a 56px fading tail on a straight horizontal run.
 * Each one is a .par layer (pointer parallax, no scroll drift) and carries
 * .sky-moving, so reduced motion hides it. Server component; render inside
 * an element that carries data-sky-vars.
 */

import type { CSSProperties } from "react";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

interface PacketProps {
  dir: "east" | "west";
  top: string;
  duration: string;
  delay: string;
  depth: number;
}

function Packet({ dir, top, duration, delay, depth }: PacketProps) {
  return (
    <div
      className={`sky-moving sky-run-${dir} par absolute left-0`}
      style={{ top, animationDuration: duration, animationDelay: delay, "--d": depth, "--s": 0 } as Vars}
    >
      <span className={`sky-packet sky-packet-${dir} block`} />
    </div>
  );
}

export function SkyPackets() {
  return (
    <>
      <Packet dir="east" top="31%" duration="96s" delay="-28s" depth={30} />
      <Packet dir="west" top="72%" duration="128s" delay="-74s" depth={22} />
    </>
  );
}
