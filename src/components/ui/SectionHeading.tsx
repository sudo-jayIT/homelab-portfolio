import type { ReactNode } from "react";
import { BlurFade } from "./BlurFade";

interface SectionHeadingProps {
  /** Two-digit index, rendered as "{index}." in a dimmed span. */
  index: string;
  /** 1 to 2 words, rendered uppercase in the section accent. */
  kicker: string;
  /** Rendered as h2.display.sec-title. */
  title: string;
  /** Optional lede paragraph (ReactNode so a section can mix in inline markup). */
  lede?: ReactNode;
}

/**
 * Shared section heading (spec 02 section 2.7, specs 06/08/09): mono eyebrow in
 * --sec, huge condensed title, optional lede. Server component wrapping BlurFade
 * (delay 0). Render inside a section that sets data-sec.
 */
export function SectionHeading({ index, kicker, title, lede }: SectionHeadingProps) {
  return (
    <BlurFade className="mb-12 md:mb-16">
      <p className="text-sec text-xs font-mono tracking-[0.2em] uppercase mb-3">
        <span className="opacity-70 mr-2">{index}.</span>
        {kicker}
      </p>
      <h2 className="display sec-title">{title}</h2>
      {lede ? <p className="text-white/65 text-lg mt-5 max-w-lg">{lede}</p> : null}
    </BlurFade>
  );
}
