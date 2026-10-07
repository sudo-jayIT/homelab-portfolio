/**
 * Landing name lockup (spec 03 section 3.4). Server component.
 *
 * h1.display.name-block holds a visually hidden full name for assistive tech
 * and one aria-hidden .name-line per content line. Every letter is its own
 * span carrying --i, a running index across all lines that staggers the
 * name-in entrance (150ms + 45ms * i, rules in base.css). Each line sets its
 * own font-stretch from content so the word fills the block width; the
 * line's `justify-content: space-between` spreads the small remainder.
 */

import type { CSSProperties } from "react";
import type { LandingHeroContent } from "@/content/types";

type NameContent = LandingHeroContent["name"];

/** Spaces become no-break spaces so a multi-word line keeps its gap as a flex item. */
const glyph = (ch: string) => (ch === " " ? " " : ch);

export function HeroName({ name }: { name: NameContent }) {
  const letters = name.lines.map((line) => Array.from(line.text));
  const offsets = letters.map((_, n) => letters.slice(0, n).reduce((sum, l) => sum + l.length, 0));

  return (
    <h1 className="display name-block">
      <span className="sr-only">{name.full}</span>
      {name.lines.map((line, n) => (
        <span
          key={`${n}-${line.text}`}
          aria-hidden="true"
          className="name-line"
          style={{ fontStretch: `${line.fontStretch}%` }}
        >
          {letters[n].map((ch, k) => (
            <span key={k} style={{ "--i": offsets[n] + k } as CSSProperties}>
              {glyph(ch)}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
