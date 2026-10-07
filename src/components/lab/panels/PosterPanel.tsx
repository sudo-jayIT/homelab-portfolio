"use client";

/** Poster (`poster`), spec 05 section 3.4: a square print in a thin black frame. */

import Image from "next/image";
import type { PanelProps } from "@/components/lab/contracts";
import { ROOM_CONTENT } from "@/content";
import { FocusShell } from "./FocusShell";

export function PosterPanel({ onClose }: PanelProps) {
  const { src, alt, caption } = ROOM_CONTENT.poster;
  return (
    <FocusShell label={`Poster: ${caption}`} onClose={onClose} caption={caption}>
      <div className="bg-[#0c0d0e] p-2 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95)] sm:p-3">
        <div className="relative aspect-square w-[min(40rem,calc(100vw-5.5rem),calc(100svh-10rem))]">
          <Image src={src} alt={alt} fill sizes="40rem" className="object-cover" />
        </div>
      </div>
    </FocusShell>
  );
}
