"use client";

/**
 * Dev-only tuning readout for the landing name (spec 03 section 3.4).
 *
 * Clones the live h1.name-block off screen at the same width, then for every
 * line measures the word's natural advance width (sum of letter boxes; the
 * line uses space-between) across the Archivo wdth range. Recommends the
 * largest font-stretch whose word width stays a hair (0.1%) under the block
 * width, and, when even 62% overflows, the font-size scale that would make it
 * fit. Copy the recommended values into src/content/hero.ts.
 */

import { useEffect, useState } from "react";

interface Fit {
  text: string;
  current: number;
  fillAtCurrent: number;
  best: number;
  fillAtBest: number;
  scale: number | null;
}

const MIN = 62;
const MAX = 125;
/** A hair under the block: leaves sub-pixel layout rounding some room at every size. */
const TARGET = 0.999;

function measure(): Fit[] | null {
  const block = document.querySelector<HTMLElement>("h1.name-block");
  if (!block) return null;
  const width = block.getBoundingClientRect().width;
  const clone = block.cloneNode(true) as HTMLElement;
  clone.style.cssText = `position:absolute;left:-10000px;top:0;width:${width}px;visibility:hidden`;
  document.body.appendChild(clone);
  try {
    return Array.from(clone.querySelectorAll<HTMLElement>(".name-line")).map((line) => {
      const letters = Array.from(line.children) as HTMLElement[];
      letters.forEach((l) => (l.style.animation = "none"));
      const blockW = line.getBoundingClientRect().width;
      const current = parseFloat(line.style.fontStretch) || MIN;
      const wordAt = (s: number) => {
        line.style.fontStretch = `${s}%`;
        return letters.reduce((sum, l) => sum + l.getBoundingClientRect().width, 0);
      };
      const fillAtCurrent = wordAt(current) / blockW;
      let best = MIN;
      for (let s = MIN; s <= MAX; s += 1) if (wordAt(s) <= blockW * TARGET) best = s;
      const fillAtBest = wordAt(best) / blockW;
      const scale = fillAtBest > TARGET ? Math.floor((TARGET / fillAtBest) * 1000) / 1000 : null;
      return { text: line.textContent ?? "", current, fillAtCurrent, best, fillAtBest, scale };
    });
  } finally {
    clone.remove();
  }
}

export function NameFit() {
  const [fits, setFits] = useState<Fit[] | null>(null);

  useEffect(() => {
    let live = true;
    document.fonts.ready.then(() => {
      if (live) setFits(measure());
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <div data-name-fit="" className="mx-auto max-w-3xl px-6 pb-24 font-mono text-xs text-white/60">
      <p className="mb-3 uppercase tracking-[0.2em] text-putty">name fit (dev)</p>
      {fits ? (
        <table className="w-full text-left">
          <thead className="text-white/40">
            <tr>
              <th className="py-1 font-normal">line</th>
              <th className="font-normal">current</th>
              <th className="font-normal">fill</th>
              <th className="font-normal">recommended</th>
              <th className="font-normal">fill</th>
              <th className="font-normal">scale if 62% overflows</th>
            </tr>
          </thead>
          <tbody>
            {fits.map((f, i) => (
              <tr key={i} data-fit-line={i} data-best={f.best} data-fill={f.fillAtBest.toFixed(4)}>
                <td className="py-1 text-white">{f.text}</td>
                <td>{f.current}%</td>
                <td>{(f.fillAtCurrent * 100).toFixed(1)}%</td>
                <td className={f.best === f.current ? "text-white" : "text-warn"}>{f.best}%</td>
                <td>{(f.fillAtBest * 100).toFixed(1)}%</td>
                <td>{f.scale ?? "n/a"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>measuring…</p>
      )}
    </div>
  );
}
