/**
 * Contact (spec 09 sections 2.4, 3.6, 4.4). Server component: a max-w-4xl
 * section with a 1/2-column grid of four quiet glass link cards (GitHub,
 * LinkedIn, Email, Resume; .glass-card in work.css) that light up in the
 * section accent on hover. Each card
 * reveals with its own BlurFade (delay i * 0.07). There is no copy-to-clipboard;
 * every card is a plain link, and the mailto card has rel but no target.
 *
 * The profile glyphs come from the shared original set in
 * components/ui/BrandGlyphs (also used by the footer). Links with an empty href
 * are skipped (see contact.ts).
 */

import { CONTACT, SECTIONS, contactLinksIn } from "@/content";
import { BlurFade } from "@/components/ui/BlurFade";
import { CONTACT_GLYPH } from "@/components/ui/BrandGlyphs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";

export function Contact() {
  const meta = SECTIONS.contact;
  return (
    <section
      id={meta.id}
      data-sec={meta.accent}
      className={cn("py-24 md:py-32 px-6", meta.borderTop && "border-t border-line")}
    >
      <div className="max-w-4xl mx-auto">
        <SectionHeading index={meta.index} kicker={meta.kicker} title={meta.title} lede={CONTACT.lede} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contactLinksIn(CONTACT.gridOrder).map((link, i) => {
            const Icon = CONTACT_GLYPH[link.key];
            return (
              <BlurFade key={link.label} delay={i * 0.07}>
                <a
                  href={link.href}
                  {...(link.external ? { target: "_blank" } : {})}
                  rel="noopener noreferrer"
                  className="glass-card flex items-center gap-4 p-5 rounded-xl border border-line-strong hover:border-sec/40 hover:bg-[color-mix(in_srgb,var(--sec)_5%,var(--card-glass))] transition-all duration-200 group"
                >
                  <div className="p-2.5 rounded-lg bg-white/[0.04] group-hover:bg-sec/10 transition-colors shrink-0">
                    <Icon className="w-5 h-5 text-sec/80 group-hover:text-sec transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-2 text-xs font-mono mb-0.5">{link.label}</p>
                    <p className="text-foreground font-medium text-sm truncate">{link.handle}</p>
                  </div>
                </a>
              </BlurFade>
            );
          })}
        </div>
      </div>
    </section>
  );
}
