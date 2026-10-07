/**
 * Contact links (spec 09 section 8). Read by the Contact grid, the footer,
 * the terminal (`contact`) and the room phone panel. A link with an empty
 * href is hidden everywhere.
 */

import type { ContactContent, ContactKey, ContactLink } from "./types";
import { SITE } from "./site";

export const CONTACT: ContactContent = {
  // DRAFT: lede and phone pitch, edit freely.
  lede: "Hiring for security or DevSecOps work, or want to trade homelab notes? Say hello.",
  links: [
    { key: "email", label: "Email", handle: SITE.email, href: `mailto:${SITE.email}`, external: false },
    {
      key: "linkedin",
      label: "LinkedIn",
      handle: `in/${SITE.handle}`,
      href: `https://www.linkedin.com/in/${SITE.handle}/`,
      external: true,
    },
    {
      // PLACEHOLDER: GitHub username not provided yet. Set handle and href
      // (or set href to "" to hide the card).
      key: "github",
      label: "GitHub",
      handle: "@your-github-handle",
      href: "https://github.com/",
      external: true,
      placeholder: true,
    },
    { key: "resume", label: "Resume", handle: SITE.resumeFileName, href: SITE.resumeUrl, external: true },
  ],
  gridOrder: ["github", "linkedin", "email", "resume"],
  footerOrder: ["github", "linkedin", "resume", "email"],
  pitch: "Cybersecurity student and DevSecOps intern. Happy to talk security, cloud or homelabs.",
};

/** Links that have a destination, in data order. */
export const CONTACT_LINKS: ContactLink[] = CONTACT.links.filter((l) => l.href);

/** Lookup by key (undefined when the link is missing or hidden). */
export function contactLink(key: ContactKey): ContactLink | undefined {
  return CONTACT_LINKS.find((l) => l.key === key);
}

/** Visible links in the given key order. */
export function contactLinksIn(order: ContactKey[]): ContactLink[] {
  return order.map(contactLink).filter((l): l is ContactLink => Boolean(l));
}
