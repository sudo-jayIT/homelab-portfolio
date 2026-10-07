/**
 * Client Work / Websites for Business (spec 08), off by default (site.ts).
 * Server component: only BlurFade and next/image hydrate.
 *
 * Each client site is one wide card that is a single external link: a faux
 * browser window (traffic-light dots, mono URL pill, 16:10 screenshot) on the
 * left (top on mobile), and the "LIVE SITE" badge, title, meta line,
 * description, tags and a "Visit site" affordance on the right. Hover (CSS
 * only, so never on touch): border tints --sec at 40%, the screenshot scales to
 * 1.03 over 700ms, the CTA gap widens and its arrow nudges up-right.
 */

import Image from "next/image";
import { ArrowUpRight, Globe } from "lucide-react";
import { SECTIONS, WEBSITES, WEBSITES_LEDE, type ClientSite } from "@/content";
import { BlurFade } from "@/components/ui/BlurFade";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";

function BrowserFrame({ site }: { site: ClientSite }) {
  return (
    <div className="rounded-xl overflow-hidden border border-line-strong shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]">
      {/* Window dots stay quiet (one accent): two gray, the last in the section accent. */}
      <div className="flex items-center gap-2 px-3 h-8 bg-white/[0.04] border-b border-line">
        <span className="w-2.5 h-2.5 rounded-full bg-gray-3/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-gray-3/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-sec/80" />
        <span className="ml-2 flex-1 truncate rounded-md bg-black/30 px-2 py-0.5 text-[10px] font-mono text-gray-2">
          {site.displayUrl}
        </span>
      </div>
      <div className="relative aspect-[1400/875] overflow-hidden">
        <Image
          src={site.preview}
          alt={`${site.name} website preview`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </div>
    </div>
  );
}

function SiteCard({ site }: { site: ClientSite }) {
  return (
    <a
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card group relative block rounded-2xl border border-line-strong overflow-hidden transition-colors duration-300 hover:border-sec/40"
    >
      <div className="grid md:grid-cols-2">
        <div className="p-5 md:p-6">
          <BrowserFrame site={site} />
        </div>
        <div className="flex flex-col justify-center p-6 pt-1 md:p-8 md:pl-2">
          <div className="flex items-center gap-2 text-sec text-xs font-mono tracking-[0.18em] uppercase mb-3">
            <Globe className="w-3.5 h-3.5" aria-hidden="true" />
            Live site
            <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
          </div>
          <h3 className="display text-[2.1rem] leading-[0.95] text-title">{site.name}</h3>
          <p className="text-white/60 text-sm font-mono mt-2.5">{site.category}</p>
          <p className="text-white/70 text-[0.95rem] leading-relaxed mt-4">{site.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-5">
            {site.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-white/[0.04] border border-line-strong text-gray-1"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-sec mt-6 group-hover:gap-2.5 transition-all">
            Visit site
            <ArrowUpRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </a>
  );
}

export function Websites() {
  const meta = SECTIONS.websites;
  return (
    <section
      id={meta.id}
      data-sec={meta.accent}
      className={cn("py-24 md:py-32 px-6", meta.borderTop && "border-t border-line")}
    >
      <div className="max-w-6xl mx-auto">
        <SectionHeading index={meta.index} kicker={meta.kicker} title={meta.title} lede={WEBSITES_LEDE} />
        <div className="space-y-10">
          {WEBSITES.map((site, i) => (
            <BlurFade key={site.slug} delay={i * 0.08}>
              <SiteCard site={site} />
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
