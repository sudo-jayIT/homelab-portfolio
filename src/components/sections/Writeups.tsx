/**
 * Write-ups (CTF / lab walkthroughs). Off by default in site.ts until real,
 * solved boxes replace the placeholder samples in writeups.ts. Server
 * component: only BlurFade and MagicCard hydrate.
 *
 * A 2-column grid (1 column below md) of equal-height cards, mirroring the
 * Projects section. Each card leads with the platform eyebrow and a
 * color-coded difficulty badge, then the box name, the attack-path summary and
 * technique chips. A write-up with a link shows an external-link icon and is
 * clickable; a linkless one shows neither, exactly like a linkless Project.
 */

import { ExternalLink } from "lucide-react";
import {
  SECTIONS,
  WRITEUPS,
  WRITEUPS_LEDE,
  type Writeup,
  type WriteupDifficulty,
} from "@/content";
import { cn } from "@/lib/cn";
import { BlurFade } from "@/components/ui/BlurFade";
import { MagicCard } from "@/components/ui/MagicCard";
import { SectionHeading } from "@/components/ui/SectionHeading";

/** Difficulty → dot/text color. Inline hex so it never depends on a configured utility. */
const DIFFICULTY_COLOR: Record<WriteupDifficulty, string> = {
  Easy: "#3ddc97",
  Medium: "#f5c451",
  Hard: "#ff8a5c",
  Insane: "#ff5c7c",
};

function DifficultyBadge({ difficulty }: { difficulty: WriteupDifficulty }) {
  const color = DIFFICULTY_COLOR[difficulty];
  return (
    <span
      className="inline-flex items-center gap-1.5 shrink-0 text-xs px-2.5 py-1 rounded-full border bg-white/[0.04]"
      style={{ color, borderColor: `${color}55` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {difficulty}
    </span>
  );
}

function WriteupCard({ writeup }: { writeup: Writeup }) {
  const { link, name } = writeup;
  return (
    <MagicCard className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sec text-xs font-mono tracking-[0.18em] uppercase">{writeup.platform}</span>
        {writeup.difficulty ? <DifficultyBadge difficulty={writeup.difficulty} /> : null}
      </div>
      <div className="flex items-start mb-3">
        <h3 className="display text-[1.7rem] leading-[0.95] text-title">{name}</h3>
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 shrink-0 text-gray-3 hover:text-sec transition-colors"
            aria-label={`Read the ${name} write-up`}
          >
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        ) : null}
      </div>
      <p className="text-white/60 text-sm leading-relaxed flex-1 mb-5">{writeup.summary}</p>
      <div className="flex flex-wrap gap-1.5">
        {writeup.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-sec/10 text-sec border border-sec/20"
          >
            {tag}
          </span>
        ))}
      </div>
    </MagicCard>
  );
}

export function Writeups() {
  const meta = SECTIONS.writeups;
  return (
    <section
      id={meta.id}
      data-sec={meta.accent}
      className={cn("py-24 md:py-32 px-6", meta.borderTop && "border-t border-line")}
    >
      <div className="max-w-6xl mx-auto">
        <SectionHeading index={meta.index} kicker={meta.kicker} title={meta.title} lede={WRITEUPS_LEDE} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
          {WRITEUPS.map((writeup, i) => (
            <BlurFade key={writeup.slug} delay={i * 0.08} className="h-full">
              <WriteupCard writeup={writeup} />
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
