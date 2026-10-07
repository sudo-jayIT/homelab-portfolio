"use client";

/**
 * Projects CRT (`monitor`), spec 05 section 3.4: a beige monitor bezel with an
 * amber DOS-style file browser. The list holds every project, then (only while
 * the websites section is enabled in site.ts) the client sites after a
 * "client work" divider, each shown as an 8.3 file name.
 * ArrowUp/ArrowDown cycle the list (wrapping), Enter opens the selected link:
 * an external URL in a new tab, an in-page "#section" through onNavigate;
 * a file with no link has no open key.
 */

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { PanelProps } from "@/components/lab/contracts";
import { isSectionEnabled, PROJECTS, ROOM_CONTENT, WEBSITES, type SectionId } from "@/content";
import { goToSection } from "@/lib/view-store";
import { FocusShell, KEY, KEY_LIGHT, LinkKey, useCycleKeys, wrap } from "./FocusShell";

interface CrtFile {
  name: string;
  text: string;
  tags: string[];
  href: string;
  preview: string | null;
  client: boolean;
  dos: string;
}

/** Fallback 8.3 name: first 8 alphanumerics, upper case, ".EXE". */
function dosFallback(name: string): string {
  return `${name.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase()}.EXE`;
}

const FILES: CrtFile[] = [
  ...PROJECTS.map((p) => ({
    name: p.name,
    text: p.description,
    tags: p.stack,
    href: p.link,
    preview: p.preview,
    client: false,
    dos: p.dosName || dosFallback(p.name),
  })),
  ...(isSectionEnabled("websites") ? WEBSITES : []).map((s) => ({
    name: s.name,
    text: s.description,
    tags: s.tags,
    href: s.url,
    preview: s.preview,
    client: true,
    dos: s.dosName || dosFallback(s.name),
  })),
];

/** "#homelab" becomes "homelab" when that section is enabled; anything else is null. */
function sectionOf(href: string): SectionId | null {
  if (!href.startsWith("#")) return null;
  const id = href.slice(1) as SectionId;
  return isSectionEnabled(id) ? id : null;
}

export function CrtPanel({ onClose, onNavigate }: PanelProps) {
  const [sel, setSel] = useState(0);
  const file = FILES[sel];
  const navigate = onNavigate ?? goToSection;
  const section = sectionOf(file.href);
  const external = Boolean(file.href) && !file.href.startsWith("#");

  const prev = useCallback(() => setSel((i) => wrap(i - 1, FILES.length)), []);
  const next = useCallback(() => setSel((i) => wrap(i + 1, FILES.length)), []);
  useCycleKeys(prev, next, true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      // Keys and links handle their own Enter; a focused hotspot polygon or a
      // text field must not trigger the open either.
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest("button, a, input, textarea, [data-hot]")) return;
      const href = FILES[sel].href;
      const target = sectionOf(href);
      if (target) navigate(target);
      else if (href && !href.startsWith("#")) window.open(href, "_blank", "noopener");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, navigate]);

  return (
    <FocusShell
      label="Projects"
      onClose={onClose}
      actions={
        <>
          {external ? (
            <LinkKey href={file.href} className={KEY_LIGHT}>
              Open {file.name} ↗
            </LinkKey>
          ) : null}
          {section ? (
            <button type="button" onClick={() => navigate(section)} className={KEY_LIGHT}>
              Open {section} ↓
            </button>
          ) : null}
          <button type="button" onClick={() => navigate("projects")} className={KEY}>
            classic view ↓
          </button>
        </>
      }
    >
      <div className="w-[min(58rem,calc(100vw-1.5rem),calc((100svh-11rem)*1.28))] rounded-[26px] bg-[linear-gradient(180deg,#ddd4bd,#b9ae95)] p-3 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95),inset_0_2px_0_rgba(255,255,255,0.5)] sm:rounded-[34px] sm:p-6">
        <div className="relative overflow-hidden rounded-[18px] bg-[#130b02] shadow-[inset_0_0_0_3px_#1d1a14,inset_0_0_90px_rgba(0,0,0,0.9)] max-sm:h-[62svh] sm:aspect-[4/3] sm:rounded-[26px]">
          <div className="absolute inset-0 flex flex-col overflow-hidden p-4 font-mono text-[12px] text-[#ffb347] [text-shadow:0_0_6px_rgba(255,179,71,0.45)] sm:p-7 sm:text-[13px]">
            <div className="flex items-center justify-between border-b border-[#ffb347]/30 pb-2">
              <span>{ROOM_CONTENT.crt.dosTitle}</span>
              <span className="text-[#ffb347]/60">{FILES.length} file(s)</span>
            </div>
            <div className="mt-3 grid min-h-0 flex-1 gap-4 sm:grid-cols-[15rem_1fr]">
              <ul className="space-y-0.5 max-sm:max-h-[8.5rem] max-sm:overflow-y-auto">
                {FILES.map((f, i) => (
                  <li key={f.name}>
                    {f.client && FILES[i - 1] && !FILES[i - 1].client ? (
                      <p className="mb-1 mt-2 text-[#ffb347]/50">── client work ──</p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setSel(i)}
                      aria-current={i === sel ? "true" : undefined}
                      className={`w-full px-1.5 py-0.5 text-left ${
                        i === sel ? "bg-[#ffb347] text-[#130b02] [text-shadow:none]" : "hover:bg-[#ffb347]/10"
                      }`}
                    >
                      {i === sel ? "▸ " : "  "}
                      {f.dos}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="min-h-0 overflow-y-auto pr-1 [scrollbar-color:rgba(255,179,71,0.3)_transparent] [scrollbar-width:thin]">
                {file.preview ? (
                  <div className="relative mb-3 aspect-[16/9] overflow-hidden border border-[#ffb347]/30">
                    <Image
                      src={file.preview}
                      alt={`${file.name} preview`}
                      fill
                      sizes="36rem"
                      className="object-cover object-top opacity-90"
                    />
                  </div>
                ) : null}
                <p className="text-[14px] font-bold uppercase tracking-wide sm:text-[15px]">{file.name}</p>
                <p className="mt-2 leading-relaxed text-[#ffcf8a]/85">{file.text}</p>
                <p className="mt-3 text-[#ffb347]/65">{file.tags.map((t) => `[${t}]`).join(" ")}</p>
              </div>
            </div>
            <div className="mt-3 flex justify-between border-t border-[#ffb347]/30 pt-2 text-[#ffb347]/55">
              <span>↑↓ select · ⏎ open</span>
              <span>
                C:\&gt;
                <span className="motion-safe:animate-[lab-caret_1s_steps(1)_infinite]">█</span>
              </span>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.28)_0px,rgba(0,0,0,0.28)_1px,transparent_1px,transparent_3px)]" />
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.07),transparent_55%)]" />
        </div>
        <div className="mt-2 flex items-center justify-between px-1 sm:mt-4">
          <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-[#5b5546]">
            {ROOM_CONTENT.crt.modelBadge}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80] shadow-[0_0_6px_#4ade80]" />
            <span className="h-3 w-6 rounded-sm bg-[#a39a83] shadow-[inset_0_-1px_0_rgba(0,0,0,0.25)]" />
          </span>
        </div>
      </div>
    </FocusShell>
  );
}
