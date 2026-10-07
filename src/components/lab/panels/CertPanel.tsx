"use client";

/**
 * Wall certificates (`cert-1`..`cert-4`), spec 05 section 3.4. The credential
 * hung in a slot is found by `wall.slot`. Credentials with a card image
 * (`thumb`, a 1200x927 original stylized card) show it; Verify / code / Open
 * PDF keys appear only when the credential has that data. Without an image a
 * typographic card renders with the issuer as plain coloured text (no logos)
 * and the status ("In progress" or "Earned").
 */

import Image from "next/image";
import type { ReactNode } from "react";
import type { PanelProps } from "@/components/lab/contracts";
import { CREDENTIALS, SITE, credentialDate, credentialStatus, type Credential } from "@/content";
import { FocusShell, KEY_LIGHT, LinkKey } from "./FocusShell";

/** Issuer wordmark as coloured text: one colour, or one colour per letter. */
function Wordmark({ cred }: { cred: Credential }) {
  const { wordmark, wordmarkColor, band } = cred.wall;
  if (Array.isArray(wordmarkColor)) {
    const letters: ReactNode[] = Array.from(wordmark).map((ch, i) => (
      <span key={i} style={{ color: wordmarkColor[i % wordmarkColor.length] }}>
        {ch}
      </span>
    ));
    return <span className="font-semibold">{letters}</span>;
  }
  // A white wordmark only reads on its wall band; use the band colour on paper.
  const color = /^#f{3}(f{3})?$/i.test(wordmarkColor) ? (band ?? "#1f2d3d") : wordmarkColor;
  return (
    <span className="font-bold tracking-tight" style={{ color }}>
      {wordmark}
    </span>
  );
}

export function CertPanel({ id, onClose }: PanelProps) {
  const cred = CREDENTIALS.find((c) => c.wall.slot === id) ?? CREDENTIALS[0];
  const { verify, file, thumb } = cred;
  return (
    <FocusShell
      label={cred.label}
      onClose={onClose}
      caption={`${cred.issuer} · ${cred.note}`}
      actions={
        verify || file ? (
          <>
            {verify ? (
              <>
                <LinkKey href={verify.url} className={KEY_LIGHT}>
                  Verify at {cred.issuer} ↗
                </LinkKey>
                <span className="max-w-[16rem] break-all font-mono text-[10px] text-gray-2">code {verify.code}</span>
              </>
            ) : null}
            {file ? <LinkKey href={file}>Open PDF ↗</LinkKey> : null}
          </>
        ) : undefined
      }
    >
      <div className="bg-[#0c0d0e] p-2.5 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95)] sm:p-3.5">
        <div className="bg-[#e9e6de] p-3 sm:p-5">
          {thumb ? (
            <Image
              src={thumb}
              alt={`${cred.full} credential card`}
              width={1200}
              height={927}
              className="block h-auto w-[min(46rem,calc(100vw-4.5rem),calc((100svh-13rem)*1.294))]"
            />
          ) : (
            <div className="flex aspect-[1.294] w-[min(40rem,calc(100vw-4.5rem),calc((100svh-13rem)*1.294))] flex-col items-center justify-center border border-[#cfcabd] px-6 text-center text-slate-800">
              <p className="text-2xl sm:text-3xl">
                <Wordmark cred={cred} />
              </p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">{credentialStatus(cred)}</p>
              <p className="mt-2 text-xl font-semibold sm:text-3xl">{cred.full}</p>
              <p className="mt-4 text-sm text-slate-600">{SITE.name}</p>
              <p className="mt-1 max-w-sm text-xs text-slate-500">{credentialDate(cred)}</p>
            </div>
          )}
        </div>
      </div>
    </FocusShell>
  );
}
