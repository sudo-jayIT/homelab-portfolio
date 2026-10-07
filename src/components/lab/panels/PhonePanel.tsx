"use client";

/** Contact phone (`phone`), spec 05 section 3.4: a contact card on a phone screen. */

import Image from "next/image";
import type { PanelProps } from "@/components/lab/contracts";
import { ABOUT, CONTACT, CONTACT_LINKS, contactLink, SITE, type ContactKey } from "@/content";
import { FocusShell } from "./FocusShell";

/** Icon tile glyphs (plain text, no brand marks). */
const GLYPH: Record<ContactKey, string> = { email: "✉", linkedin: "in", github: "gh", resume: "cv" };

export function PhonePanel({ onClose }: PanelProps) {
  const email = contactLink("email");
  return (
    <FocusShell label="Contact" onClose={onClose}>
      <div className="relative aspect-[9/19] h-[min(38rem,calc(100svh-9rem))] overflow-hidden rounded-[2.6rem] border-[9px] border-[#0b0c0d] bg-[radial-gradient(ellipse_at_top,#1b2a44,#0b1020_60%)] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95)] ring-1 ring-white/10">
        <div className="absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
        <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-semibold text-white/85">
          <span>9:41</span>
          <span className="tracking-widest">▮▮▮</span>
        </div>
        <div className="flex h-full flex-col px-5 pb-10 pt-8">
          <div className="flex flex-col items-center text-center">
            <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-white/15">
              <Image src={ABOUT.portrait.src} alt="" fill sizes="4rem" className="object-cover object-[50%_30%]" />
            </div>
            <p className="mt-3 text-[17px] font-semibold text-white">{SITE.name}</p>
            <p className="mt-1 text-[12px] leading-snug text-white/55">{CONTACT.pitch}</p>
          </div>
          <div className="mt-5 divide-y divide-white/[0.07] overflow-hidden rounded-2xl bg-white/[0.06]">
            {CONTACT_LINKS.map((l) => (
              <a
                key={l.key}
                href={l.href}
                target={l.href.startsWith("mailto") ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-white/[0.05]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 font-mono text-[11px] text-white/80">
                  {GLYPH[l.key] ?? "•"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] text-white">{l.label}</span>
                  <span className="block truncate text-[11px] text-white/45">{l.handle}</span>
                </span>
                <span className="text-white/30">›</span>
              </a>
            ))}
          </div>
          {email ? (
            <a href={email.href} className="key key-light mt-auto w-full rounded-full text-[14px]">
              Email me
            </a>
          ) : null}
        </div>
      </div>
    </FocusShell>
  );
}
