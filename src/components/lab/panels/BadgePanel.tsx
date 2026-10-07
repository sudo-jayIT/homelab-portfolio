"use client";

/**
 * Work badge (`badge`), spec 05 section 3.4: a lanyard ID card per employer.
 * One tab key per experience entry; ArrowLeft/ArrowRight cycle (wrapping).
 */

import Image from "next/image";
import { useCallback, useState } from "react";
import type { PanelProps } from "@/components/lab/contracts";
import { ABOUT, EXPERIENCE, SITE } from "@/content";
import { FocusShell, KEY, KEY_LIGHT, useCycleKeys, wrap } from "./FocusShell";

const BARCODE =
  "bg-[repeating-linear-gradient(90deg,#0f172a_0_2px,transparent_2px_4px,#0f172a_4px_5px,transparent_5px_8px,#0f172a_8px_11px,transparent_11px_13px)]";

export function BadgePanel({ onClose }: PanelProps) {
  const [cur, setCur] = useState(0);
  const job = EXPERIENCE[cur];
  const prev = useCallback(() => setCur((i) => wrap(i - 1, EXPERIENCE.length)), []);
  const next = useCallback(() => setCur((i) => wrap(i + 1, EXPERIENCE.length)), []);
  useCycleKeys(prev, next);

  return (
    <FocusShell
      label="Experience"
      onClose={onClose}
      actions={EXPERIENCE.map((e, i) => (
        <button
          key={e.company}
          type="button"
          onClick={() => setCur(i)}
          aria-pressed={i === cur}
          className={i === cur ? KEY_LIGHT : KEY}
        >
          {e.badge.tab}
        </button>
      ))}
    >
      <div className="w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-[#f1f5f9] text-slate-900 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95)]">
        <div className="flex justify-center bg-[#e2e8f0] py-2">
          <span className="h-2 w-14 rounded-full bg-[#94a3b8]/70" />
        </div>
        <div className="px-5 py-3 text-white transition-colors" style={{ background: job.badge.band }}>
          <p className="font-mono text-[10px] tracking-[0.28em]">{job.badge.org}</p>
          <p className="mt-0.5 text-[11px] opacity-75">{job.type}</p>
        </div>
        <div className="flex gap-4 px-5 pt-4">
          <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-slate-300">
            <Image
              src={ABOUT.portrait.src}
              alt={SITE.name}
              fill
              sizes="5rem"
              className="object-cover object-[50%_32%]"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold tracking-wide">{SITE.name.toUpperCase()}</p>
            <p className="mt-1 text-sm font-medium leading-snug">{job.role}</p>
            <p className="mt-1 text-xs text-slate-500">
              {job.company} · {job.location}
            </p>
            <p className="mt-1 font-mono text-[11px] text-slate-600">{job.period}</p>
          </div>
        </div>
        <ul className="space-y-2 px-5 py-4 text-[13px] leading-relaxed text-slate-700">
          {job.bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="text-slate-400">›</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className={`mx-5 mb-5 h-8 opacity-80 ${BARCODE}`} />
      </div>
    </FocusShell>
  );
}
