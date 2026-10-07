/**
 * Site footer (spec 02 section 2.6, spec 09 sections 2.6 and 3.8). Server
 * component rendered after <main> inside div[data-classic] (hidden in room
 * view by base.css). The wrapper background (--footer) is the colour the rain
 * divider fades into, so the settled glyph rows appear to rest on the footer.
 *
 *   monogram key + blurb | Navigation (enabled sections) | Connect (contact.ts footerOrder)
 *   bottom bar: "(c) {year} {name}" and a pulsing "Open to opportunities" dot
 *
 * The monogram is a plain link to #hero, like the original. In classic view
 * #hero is display:none, so the click does not scroll (the header then strips
 * the hash). The email link carries rel without a target, as in the original.
 */

import { CONTACT_GLYPH } from "@/components/ui/BrandGlyphs";
import { CONTACT, contactLinksIn } from "@/content/contact";
import { CHROME, FOOTER } from "@/content/site";
import type { ContactKey } from "@/content/types";

/** Footer labels: the code profile shows the bare username; the rest name the service. */
function footerLabel(key: ContactKey, handle: string): string {
  switch (key) {
    case "github":
      return handle.replace(/^@/, "");
    case "linkedin":
      return "LinkedIn";
    case "resume":
      return "Resume";
    case "email":
      return "Email";
  }
}

/** Visible links only (an empty href hides a link), in footer order. */
const CONNECT = contactLinksIn(CONTACT.footerOrder).map((link) => ({
  ...link,
  text: footerLabel(link.key, link.handle),
  Icon: CONTACT_GLYPH[link.key],
}));

const LABEL = "text-gray-2 text-xs uppercase tracking-widest font-mono mb-5";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <div data-classic="" className="relative z-10 bg-footer">
      <footer className="border-t border-line py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <a href="#hero" aria-label="Back to top" className="key key-sm key-icon mb-4 text-[12px] font-bold tracking-tight">
                {CHROME.monogram}
              </a>
              <p className="text-white/60 text-sm leading-relaxed max-w-[220px]">{FOOTER.blurb}</p>
            </div>
            <div>
              <p className={LABEL}>Navigation</p>
              <ul className="space-y-2.5">
                {FOOTER.navLinks.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="text-white/60 hover:text-white text-sm transition-colors">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className={LABEL}>Connect</p>
              <ul className="space-y-3">
                {CONNECT.map(({ key, href, external, text, Icon }) => (
                  <li key={key}>
                    <a
                      href={href}
                      target={external ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-white/60 hover:text-white text-sm transition-colors group"
                    >
                      <Icon className="w-4 h-4 group-hover:text-mint transition-colors shrink-0" />
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-2 text-xs font-mono">
              © {year} {FOOTER.copyrightName}
            </p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
              <p className="text-gray-2 text-xs font-mono">{FOOTER.statusText}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
