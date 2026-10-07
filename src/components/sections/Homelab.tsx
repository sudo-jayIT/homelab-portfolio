"use client";

/**
 * Homelab section (spec 07). Owned by B7. A client component like the
 * original (the CTA needs a click handler); it is still fully server
 * rendered, with the BlurFade wrappers shipping opacity 0.
 *
 *   section#homelab[data-sec="dusk"]
 *     heading (02. Self-hosted / Homelab / lede)
 *     grid 5fr / 7fr at lg:
 *       left:  "The hardware" + rack card (12U front diagram with numbered
 *              callouts + the numbered list in two columns)
 *       right: "What I've built on it" + host line, one row per node
 *              (pve1 to pve4) and per lab-wide piece (Pi 4, edge, storage,
 *              honeypot) with its services as chips, "Locked down" chips,
 *              "Broke it, fixed it" stories (only when there are any), CTA
 *
 * Theme: cards use the glass surface (.hl-card in homelab.css); index rail,
 * callouts and chips follow --sec (mint). The rack drawing and its LEDs keep
 * their own colours.
 */

import { SECTIONS, HOMELAB, HOMELAB_HOSTS, type LabHost } from "@/content";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BlurFade } from "@/components/ui/BlurFade";
import { cn } from "@/lib/cn";
import { seeItInTheRoom } from "@/lib/view-store";
import { H, PART_LOCAL, RackFront, RackFrontLeds, SECTION_LED_PAIRS, W, bandOf } from "@/lib/rack";
import type { RackDeviceId } from "@/components/lab/contracts";

const LABEL = "font-mono text-xs uppercase tracking-[0.2em]";
/** Centre x of the numbered callout bubbles on either side of the rack. */
const CALLOUT_R = W + 10;
const CALLOUT_L = -10;
/** Diagram margins: callouts left and right, handles above, feet below. */
const VIEWBOX = `-17 -12 ${W + 34} ${H + 18}`;

/**
 * Callout side of a listed part: devices sharing a shelf split left and
 * right (the leftmost one goes left), everything else is called out on the
 * right.
 */
function calloutSide(id: RackDeviceId): "left" | "right" {
  const parts = bandOf(id).parts;
  return parts.length > 1 && parts.indexOf(id) < parts.length - 1 ? "left" : "right";
}

/** Carry handles: inverted U above the top band (dark tube plus a thin highlight). */
function Handles() {
  return (
    <>
      {(
        [
          [7, 26],
          [W - 26, W - 7],
        ] as const
      ).map(([x1, x2]) => (
        <g key={x1} fill="none" strokeLinejoin="round">
          <path d={`M${x1} 0 V-8 H${x2} V0`} stroke="#2a2e33" strokeWidth={2.6} />
          <path d={`M${x1} 0 V-8 H${x2} V0`} stroke="rgba(255,255,255,0.18)" strokeWidth={0.5} />
        </g>
      ))}
    </>
  );
}

/** Rubber feet and the floor line the rack stands on. */
function Feet() {
  return (
    <>
      <rect x={-12} y={H + 3} width={W + 24} height={0.5} className="fill-line-strong" />
      {[1, W - 7].map((x) => (
        <rect key={x} x={x} y={H} width={6} height={3} rx={0.6} fill="#2a2e33" />
      ))}
    </>
  );
}

/** Code-drawn front view of the 12U rack with numbered callouts (spec 07 section 3.4). */
function RackDiagram() {
  return (
    <svg
      viewBox={VIEWBOX}
      role="img"
      aria-label={HOMELAB.diagramLabel}
      className="mx-auto block h-auto w-full max-w-[23rem]"
    >
      <Handles />
      <RackFront />
      <RackFrontLeds pairs={SECTION_LED_PAIRS} halo="flat" glow={3} />
      <Feet />
      {/* callouts, one per listed part, in list order */}
      {HOMELAB.list.map((id, i) => {
        const { u, v } = PART_LOCAL[id];
        const cy = (v[0] + v[1]) / 2;
        const left = calloutSide(id) === "left";
        const ax = left ? u[0] - 1 : u[1] + 1;
        const bx = left ? CALLOUT_L : CALLOUT_R;
        return (
          <g key={id}>
            <path d={`M${ax} ${cy} H${left ? bx + 3.4 : bx - 3.4}`} className="stroke-sec" strokeWidth={0.45} fill="none" />
            <circle cx={ax} cy={cy} r={0.9} className="fill-sec" />
            <circle cx={bx} cy={cy} r={3.4} className="fill-card stroke-sec" strokeWidth={0.6} />
            <text
              x={bx}
              y={cy + 1.25}
              fontSize={3.6}
              fontWeight={700}
              textAnchor="middle"
              className="lab-mono fill-sec"
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * One row of "What I've built on it": index rail (number plus a pulsing dot,
 * a hollow one while the node is idle), Archivo name with a mono role tag,
 * the description line and the services as small mono chips.
 */
function HostRow({ host, index }: { host: LabHost; index: number }) {
  const { name, tag, note, services, idle } = host;
  return (
    <li className="grid grid-cols-[2.75rem_minmax(0,1fr)] md:grid-cols-[3.25rem_minmax(0,1fr)]">
      <div className="flex flex-col items-center gap-2.5 border-r border-line bg-mint/[0.025] pt-5 font-mono text-[10px] text-white/40">
        {String(index + 1).padStart(2, "0")}
        {idle ? (
          <span aria-hidden className="h-1.5 w-1.5 rounded-full border border-white/30" />
        ) : (
          <span
            aria-hidden
            className="lab-led-pulse h-1.5 w-1.5 rounded-full bg-mint"
            style={{ animationDelay: `${(-0.7 * index).toFixed(1)}s` }}
          />
        )}
      </div>
      <div className="p-5 md:px-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="display text-[1.55rem] text-white">{name}</h3>
          <p className={cn("font-mono text-[10px] uppercase tracking-[0.2em]", idle ? "text-gray-2" : "text-sec/80")}>
            {tag}
          </p>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/65">{note}</p>
        {services.length > 0 ? (
          <ul aria-label={`Running on ${name}`} className="mt-3 flex flex-wrap gap-1.5">
            {services.map((s) => (
              <li key={s} className="hl-chip">
                {s}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

export function Homelab() {
  const meta = SECTIONS.homelab;
  const stories = HOMELAB.stories.length > 0;
  return (
    <section
      id={meta.id}
      data-sec={meta.accent}
      className={cn("py-24 md:py-32 px-6", meta.borderTop && "border-t border-line")}
    >
      <div className="max-w-6xl mx-auto">
        <SectionHeading index={meta.index} kicker={meta.kicker} title={meta.title} lede={HOMELAB.lede} />
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
          {/* left column: the hardware */}
          <BlurFade delay={0.05}>
            <p className={cn(LABEL, "mb-5 text-sec")}>The hardware</p>
            <div className="hl-card relative rounded-2xl border p-5 md:p-6">
              <div className="mb-4 flex items-baseline justify-between gap-3 font-mono text-[11px] text-gray-2">
                <span>{HOMELAB.rackTitle}</span>
                <span className="shrink-0 uppercase tracking-[0.2em]">front</span>
              </div>
              <RackDiagram />
              <ol className="mt-5 grid gap-x-6 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {HOMELAB.list.map((id, i) => {
                  const part = HOMELAB.parts[id];
                  const spec = part.specs[HOMELAB.specIndex[id] ?? 0];
                  return (
                    <li key={id} className="flex gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-sec/60 font-mono text-[10px] font-bold text-sec">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug text-white">{part.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-2">
                          <span className="text-sec/80">{part.kicker}</span>
                          {" · "}
                          {spec}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </BlurFade>

          {/* right column: what runs on it */}
          <BlurFade delay={0.15}>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <p className={cn(LABEL, "text-sec")}>What I&apos;ve built on it</p>
              <p className="font-mono text-[11px] text-gray-2">
                <span className="whitespace-nowrap">{HOMELAB.host}</span> ·{" "}
                <span className="whitespace-nowrap">{HOMELAB.os}</span>
              </p>
            </div>
            <ol className="hl-card divide-y divide-line overflow-hidden rounded-2xl border">
              {HOMELAB_HOSTS.map((h, i) => (
                <HostRow key={h.id} host={h} index={i} />
              ))}
            </ol>
            <div className={cn("mt-9 grid gap-9", stories && "md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]")}>
              <div>
                <p className={cn(LABEL, "mb-3 text-gray-2")}>Locked down</p>
                <ul className="flex flex-wrap gap-1.5">
                  {HOMELAB.hardening.map((h) => (
                    <li key={h} className="rounded-lg border border-sec/25 bg-sec/10 px-2.5 py-1 text-xs text-sec">
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
              {stories ? (
                <div>
                  <p className={cn(LABEL, "mb-3 text-gray-2")}>Broke it, fixed it</p>
                  <ul className="space-y-2.5">
                    {HOMELAB.stories.map((s) => (
                      <li key={s} className="flex gap-3 text-sm leading-relaxed text-white/65">
                        <span className="shrink-0 text-sec/70">›</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={seeItInTheRoom}
              className="mt-10 font-mono text-[11px] uppercase tracking-[0.22em] text-gray-2 transition-colors hover:text-mint"
            >
              see it in the room →
            </button>
          </BlurFade>
        </div>
      </div>
    </section>
  );
}
