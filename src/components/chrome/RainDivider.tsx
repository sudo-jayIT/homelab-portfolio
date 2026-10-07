/**
 * Divider above the footer (docs/theme/b.md section 4), in the old skyline's
 * slot: the rain "settles" into two bands of static glyph rows, a 1px mint
 * floor line and a blinking block cursor. Same height and motion system as
 * the skyline: the root carries data-sky-vars (SkyMotion writes --px/--py),
 * each band is a .par-x layer with its own pointer depth (--d 7 far, 17
 * near), and the cursor uses sky-blink.
 *
 * Server component with deterministic, seeded rows. Each row is split into
 * three strings (dim, mid, bright) that share one monospace grid, so per-glyph
 * brightness costs three text nodes per row instead of one span per glyph.
 * The root must not get a React style prop (SkyMotion owns its variables).
 */

import type { CSSProperties } from "react";
import { RAIN_GLYPHS } from "@/components/sky/rain";
import { mulberry32 } from "@/lib/rng";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** One entry per row: the dim, mid and bright strings (spaces elsewhere). */
type Band = [string, string, string][];

/**
 * Rows get denser toward the bottom, as if the rain were collecting there.
 * Wide enough for a 2560px viewport at the near band's glyph width.
 */
function band(seed: number, count: number, width: number, minFill: number, maxFill: number): Band {
  const r = mulberry32(seed);
  const glyphs = Array.from(RAIN_GLYPHS);
  const rows: Band = [];
  for (let row = 0; row < count; row++) {
    const fill = minFill + ((maxFill - minFill) * row) / Math.max(1, count - 1);
    const levels: string[][] = [[], [], []];
    for (let i = 0; i < width; i++) {
      const lit = r() < fill;
      const g = glyphs[Math.floor(r() * glyphs.length)];
      const pick = r();
      const level = !lit ? -1 : pick < 0.62 ? 0 : pick < 0.92 ? 1 : 2;
      for (let l = 0; l < 3; l++) levels[l].push(l === level ? g : " ");
    }
    rows.push([levels[0].join(""), levels[1].join(""), levels[2].join("")]);
  }
  return rows;
}

const FAR = band(0x0b17, 3, 300, 0.04, 0.14);
const NEAR = band(0x0b29, 2, 240, 0.12, 0.3);

const LAYER = "par-x absolute -left-8 bottom-0 h-full w-[calc(100%+4rem)] overflow-hidden whitespace-pre font-mono";

function Rows({ data, levels, inset }: { data: Band; levels: [string, string, string]; inset: string }) {
  return (
    <>
      {levels.map((cls, l) => (
        <div key={cls} className={`absolute inset-x-0 ${inset} ${cls}`}>
          {data.map((row, i) => (
            <div key={i}>{row[l]}</div>
          ))}
        </div>
      ))}
    </>
  );
}

export function RainDivider() {
  return (
    <div aria-hidden data-sky-vars="" className="sky-divider pointer-events-none relative h-32 select-none md:h-44">
      <div className={`${LAYER} text-[11px] leading-[16px]`} style={{ "--d": 7, "--s": 0 } as Vars}>
        <Rows data={FAR} levels={["sky-glyph-dim", "sky-glyph-mid", "sky-glyph-hi"]} inset="bottom-14" />
      </div>
      <div className={`${LAYER} text-[13px] leading-[19px]`} style={{ "--d": 17, "--s": 0 } as Vars}>
        <Rows data={NEAR} levels={["sky-glyph-mid", "sky-glyph-hi", "sky-glyph-head"]} inset="bottom-3" />
      </div>
      <span className="sky-cursor sky-blink absolute bottom-4 right-[18%] h-[15px] w-[8px]" />
      <div className="sky-floor absolute inset-x-0 bottom-0 h-px" />
    </div>
  );
}
