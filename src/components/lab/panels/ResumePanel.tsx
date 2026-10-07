"use client";

/** Resume page (`resume`), spec 05 section 3.4: a 17:22 sheet with Open PDF and Download. */

import Image from "next/image";
import type { PanelProps } from "@/components/lab/contracts";
import { ROOM_CONTENT, SITE } from "@/content";
import { FocusShell, KEY_LIGHT, LinkKey } from "./FocusShell";

export function ResumePanel({ onClose }: PanelProps) {
  const { image, pdf, downloadName } = ROOM_CONTENT.resume;
  return (
    <FocusShell
      label="Resume"
      onClose={onClose}
      actions={
        <>
          <LinkKey href={pdf} className={KEY_LIGHT}>
            Open PDF ↗
          </LinkKey>
          <LinkKey href={pdf} download={downloadName}>
            Download
          </LinkKey>
        </>
      }
    >
      <div className="relative aspect-[17/22] w-[min(46rem,calc(100vw-1.5rem),calc((100svh-9.5rem)*0.7727))] bg-white shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95)]">
        <Image
          src={image}
          alt={`${SITE.name}, resume`}
          fill
          sizes="(max-width: 768px) 100vw, 46rem"
          className="object-contain"
        />
      </div>
    </FocusShell>
  );
}
