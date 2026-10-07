/**
 * Background / Experience (spec 08). Server component: only BlurFade
 * hydrates. Each entry is a perforated CSS ticket (.ticket in work.css): a
 * tinted stub (counter, two-line date, employment type, barcode) and a body
 * (role, "company · location", › bullets). Static: no hover, nothing focusable.
 */

import { EXPERIENCE, SECTIONS, type ExperienceEntry } from "@/content";
import { BlurFade } from "@/components/ui/BlurFade";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";

const pad2 = (n: number) => String(n).padStart(2, "0");

/** "{start} to {end}" becomes [start, end]; a period without " to " keeps the whole string as start. */
function splitPeriod(period: string): [string, string] {
  const at = period.indexOf(" to ");
  return at === -1 ? [period, ""] : [period.slice(0, at), period.slice(at + 4)];
}

function Ticket({ entry, index, total }: { entry: ExperienceEntry; index: number; total: number }) {
  const [start, end] = splitPeriod(entry.period);
  return (
    <article className="ticket">
      <div className="ticket-stub flex items-center justify-between gap-4 px-5 md:flex-col md:items-start md:px-6 md:py-7">
        <p className="order-last shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-2 md:order-none">
          <span className="hidden md:inline">No. </span>
          {pad2(index + 1)} / {pad2(total)}
        </p>
        <div className="min-w-0">
          <p className="display whitespace-nowrap text-[clamp(1.15rem,6vw,1.6rem)] text-title md:text-[2rem]">
            <span className="md:block">
              {start} <span className="text-sec">to</span>
            </span>{" "}
            <span className="md:block">{end}</span>
          </p>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-sec md:mt-3">{entry.type}</p>
        </div>
        <span className="ticket-bars hidden w-full md:block" aria-hidden="true" />
      </div>
      <div className="p-5 pt-6 md:p-8">
        <h3 className="display text-[1.75rem] leading-[0.95] text-title md:text-[2.1rem]">{entry.role}</h3>
        <p className="mt-2.5 mb-5 font-mono text-sm text-sec">
          {entry.company} · {entry.location}
        </p>
        <ul className="space-y-2.5">
          {entry.bullets.map((bullet) => (
            <li key={bullet} className="text-white/65 text-sm leading-relaxed flex gap-3">
              <span className="text-sec/70 shrink-0">›</span>
              {bullet}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function Experience() {
  const meta = SECTIONS.experience;
  return (
    <section
      id={meta.id}
      data-sec={meta.accent}
      className={cn("py-24 md:py-32 px-6", meta.borderTop && "border-t border-line")}
    >
      <div className="max-w-6xl mx-auto">
        <SectionHeading index={meta.index} kicker={meta.kicker} title={meta.title} />
        <div className="space-y-6 md:space-y-8">
          {EXPERIENCE.map((entry, i) => (
            <BlurFade key={entry.company} delay={i * 0.1}>
              <Ticket entry={entry} index={i} total={EXPERIENCE.length} />
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
