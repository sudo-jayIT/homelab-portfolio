/**
 * About (spec 09 sections 2.2, 3.4, 4.4). Server component. A 280px | 1fr grid:
 * a 3:4 portrait card on the left (bottom gradient, two-line caption, 1.02 zoom
 * on hover), and on the right ONE BlurFade holding the bio, the chip groups,
 * a compact education block and the framed credential cards. Credentials
 * flagged `featured` with a card image get a frame; the rest appear as chips
 * and on the room wall. A frame links to a PDF only when the credential has
 * one, and shows verification only when it has verify data.
 * All hover effects are pure CSS (Tailwind hover: is gated by (hover: hover)).
 */

import Image from "next/image";
import { BadgeCheck, ExternalLink, Hourglass } from "lucide-react";
import {
  ABOUT,
  CREDENTIALS,
  SECTIONS,
  credentialDate,
  credentialStatus,
  type Credential,
} from "@/content";
import { BlurFade } from "@/components/ui/BlurFade";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";

type FramedCredential = Credential & Required<Pick<Credential, "thumb">>;

const isFramed = (c: Credential): c is FramedCredential => Boolean(c.featured && c.thumb);

const LINK = "inline-flex items-center gap-1.5 text-sm text-sec transition-colors hover:text-title";
const LABEL = "text-gray-2 text-xs uppercase tracking-widest mb-3 font-mono";
/* The frame, lamp bar and cream mat stay neutral (docs/theme/b.md 3.12); only the lamp wash turns cool. */
const FRAME = "relative block bg-[#0c0d0e] p-2.5 shadow-[4px_6px_0_rgba(0,0,0,0.45)]";
const FRAME_LINK = `${FRAME} transition-transform duration-300 hover:-translate-y-1`;

/** A credential card hung like a gallery print: cool lamp wash, lamp bar, black frame, cream mat. */
function CredentialFrame({ cred }: { cred: FramedCredential }) {
  const inProgress = cred.status === "in-progress";
  const art = (
    <span className="block bg-[#e9e6de] p-2">
      <Image
        src={cred.thumb}
        width={640}
        height={494}
        sizes="(max-width: 1024px) 90vw, 22rem"
        alt={`${cred.full} credential card`}
        className="h-auto w-full"
      />
    </span>
  );
  return (
    <figure>
      <div className="relative">
        <span
          aria-hidden
          className="absolute -inset-x-6 -top-8 bottom-1/3 bg-[radial-gradient(60%_70%_at_50%_0%,rgba(214,255,233,0.10),transparent_70%)]"
        />
        <span
          aria-hidden
          className="absolute left-[35%] -top-3 h-1.5 w-[30%] rounded-full bg-[#2b2f33] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
        />
        {cred.file ? (
          <a
            href={cred.file}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${cred.name} certificate (PDF)`}
            className={FRAME_LINK}
          >
            {art}
          </a>
        ) : (
          <div className={FRAME}>{art}</div>
        )}
      </div>
      <figcaption className="mt-5 min-w-0">
        <p className="mb-1.5 flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.2em] text-sec">
          {inProgress ? <Hourglass aria-hidden className="h-3.5 w-3.5" /> : <BadgeCheck aria-hidden className="h-3.5 w-3.5" />}
          {credentialStatus(cred)}
        </p>
        <p className="font-semibold leading-snug text-title">{cred.full}</p>
        <p className="mt-1 text-sm text-white/60">
          {cred.issuerFull} · {credentialDate(cred)}
        </p>
        {cred.file || cred.verify ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {cred.file ? (
              <a href={cred.file} target="_blank" rel="noopener noreferrer" className={LINK}>
                Certificate <ExternalLink aria-hidden size={13} />
              </a>
            ) : null}
            {cred.verify ? (
              <a href={cred.verify.url} target="_blank" rel="noopener noreferrer" className={LINK}>
                Verify with {cred.issuer} <ExternalLink aria-hidden size={13} />
              </a>
            ) : null}
          </div>
        ) : null}
        {cred.verify ? (
          <p className="mt-2 truncate font-mono text-[11px] text-gray-2" title={cred.verify.code}>
            code {cred.verify.code}
          </p>
        ) : null}
      </figcaption>
    </figure>
  );
}

/** Schools as compact rows (degree left, date and place right), then the coursework line. */
function Education() {
  const { education, coursework } = ABOUT;
  if (!education.length) return null;
  return (
    <div>
      <p className={LABEL}>Education</p>
      <ul className="glass-card divide-y divide-line rounded-xl border border-line-strong">
        {education.map((e) => (
          <li key={e.school} className="grid gap-x-6 gap-y-1.5 p-4 sm:grid-cols-[1fr_auto] sm:p-5">
            <div className="min-w-0">
              <p className="font-semibold leading-snug text-title">{e.school}</p>
              <p className="mt-0.5 text-sm text-white/65">{e.degree}</p>
              {e.details.length ? (
                <p className="mt-1.5 font-mono text-[11px] text-gray-2">{e.details.join(" · ")}</p>
              ) : null}
            </div>
            <div className="font-mono text-xs sm:text-right">
              <p className="text-sec">{e.when}</p>
              <p className="mt-0.5 text-gray-2">{e.location}</p>
            </div>
          </li>
        ))}
      </ul>
      {coursework.length ? (
        <p className="mt-3 text-xs leading-relaxed text-gray-2">
          <span className="mr-2 font-mono uppercase tracking-widest text-gray-2">Coursework</span>
          {coursework.join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

export function About() {
  const meta = SECTIONS.about;
  const { portrait, bio, skillGroups } = ABOUT;
  const framed = CREDENTIALS.filter(isFramed);
  return (
    <section
      id={meta.id}
      data-sec={meta.accent}
      className={cn("py-24 md:py-32 px-6", meta.borderTop && "border-t border-line")}
    >
      <div className="max-w-6xl mx-auto">
        <SectionHeading index={meta.index} kicker={meta.kicker} title={meta.title} />
        <div className="grid md:grid-cols-[280px_1fr] gap-12 items-start">
          <BlurFade delay={0.1}>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-line-strong bg-raised group">
              <Image
                src={portrait.src}
                alt={portrait.alt}
                fill
                sizes="(max-width: 768px) 100vw, 280px"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-title text-sm font-medium">{portrait.name}</p>
                <p className="text-white/60 text-xs font-mono mt-0.5">{portrait.location}</p>
              </div>
            </div>
          </BlurFade>
          <BlurFade delay={0.2}>
            <div className="space-y-8">
              <div className="space-y-5 text-white/70 leading-relaxed text-[1.05rem] max-w-2xl">
                {bio.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 pt-4">
                {skillGroups.map((group) => (
                  <div key={group.label}>
                    <p className={LABEL}>{group.label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((item) => (
                        <span
                          key={item}
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-lg border",
                            group.tone === "accent"
                              ? "bg-sec/10 border-sec/25 text-sec"
                              : "bg-white/[0.04] border-line-strong text-gray-1",
                          )}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <Education />
              {framed.length ? (
                <div className="grid gap-x-8 gap-y-12 pt-8 lg:grid-cols-2">
                  {framed.map((cred) => (
                    <CredentialFrame key={cred.id} cred={cred} />
                  ))}
                </div>
              ) : null}
            </div>
          </BlurFade>
        </div>
      </div>
    </section>
  );
}
