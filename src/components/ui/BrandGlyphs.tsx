/**
 * The one shared set of profile glyphs, used by the Contact cards and the
 * footer's Connect list (spec 09 section 2.4, spec 02 section 2.6). 24-unit box, fill currentColor, decorative: the
 * link text always names the service.
 *
 * They fill the slots where the original shows brand icons, at the same size
 * and visual weight, but every drawing is an original generic symbol built
 * from primitives. No official brand mark (logo, monogram or app glyph) is
 * reproduced, so do not swap in paths from a brand icon set.
 *
 * Works in server and client components (useId is available in both); the id
 * keeps each instance's mask unique when a glyph appears several times.
 */

import { useId, type ReactNode, type SVGProps } from "react";
import { Mail } from "lucide-react";
import type { ContactKey } from "@/content/types";

export type GlyphProps = SVGProps<SVGSVGElement>;

function Glyph({ children, ...props }: GlyphProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false" {...props}>
      {children}
    </svg>
  );
}

/**
 * Code profile: a solid disk with a branch (three commit rings and one fork)
 * knocked out.
 */
export function CodeGlyph(props: GlyphProps) {
  const id = `glyph-branch${useId()}`;
  return (
    <Glyph {...props}>
      <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="#fff" />
        <g fill="none" stroke="#000" strokeWidth={1.8} strokeLinecap="round">
          <circle cx="8.7" cy="6.6" r="1.9" />
          <circle cx="8.7" cy="17.4" r="1.9" />
          <circle cx="15.6" cy="9.4" r="1.9" />
          <path d="M8.7 8.5v7M15.6 11.3c0 2.5-1.9 3.3-4 3.8-1.2.3-2.2.6-2.7 1.1" />
        </g>
      </mask>
      <circle cx="12" cy="12" r="11.5" mask={`url(#${id})`} />
    </Glyph>
  );
}

/** Professional profile: a rounded square with a head and shoulders cut out. */
export function ProfileGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d={[
          "M2.6.5h18.8a2.1 2.1 0 0 1 2.1 2.1v18.8a2.1 2.1 0 0 1-2.1 2.1H2.6a2.1 2.1 0 0 1-2.1-2.1V2.6A2.1 2.1 0 0 1 2.6.5Z",
          "M12 4.9a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 1 0 0-7.2Z",
          "M5.5 19.5c0-3.9 2.9-6 6.5-6s6.5 2.1 6.5 6Z",
        ].join("")}
      />
    </Glyph>
  );
}

/**
 * Resume: a solid sheet with a folded corner and three text lines knocked out.
 */
export function ResumeGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d={[
          "M5.5 1h9.2L20.5 6.8V20.5A2.5 2.5 0 0 1 18 23H5.5A2.5 2.5 0 0 1 3 20.5v-17A2.5 2.5 0 0 1 5.5 1Z",
          "M14 2.6V6a1.3 1.3 0 0 0 1.3 1.3h3.6Z",
          "M7 10.2h10v1.6H7Z",
          "M7 13.6h10v1.6H7Z",
          "M7 17h6v1.6H7Z",
        ].join("")}
      />
    </Glyph>
  );
}

/** Email uses lucide's Mail (stroke 2), as the original does. */
export function MailGlyph(props: GlyphProps) {
  return <Mail aria-hidden {...props} />;
}

/** One glyph per contact key, shared by the Contact grid and the footer. */
export const CONTACT_GLYPH: Record<ContactKey, (props: GlyphProps) => ReactNode> = {
  github: CodeGlyph,
  linkedin: ProfileGlyph,
  resume: ResumeGlyph,
  email: MailGlyph,
};
