"use client";

/**
 * Framed art print (`print`), spec 05 section 3.4: black frame, off-white mat
 * and the same art that hangs in the scene (ROOM_CONTENT.printArt), so the
 * panel lifts off a matching picture. No actions beyond the close key.
 */

import Image from "next/image";
import type { PanelProps } from "@/components/lab/contracts";
import { ROOM_CONTENT } from "@/content";
import { FocusShell } from "./FocusShell";

export function PrintPanel({ onClose }: PanelProps) {
  const { printArt, print } = ROOM_CONTENT;
  return (
    <FocusShell label={print.caption} caption={print.caption} onClose={onClose}>
      <div className="bg-[#0c0d0e] p-2.5 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95)] sm:p-3.5">
        <div className="bg-[#ecebe7] p-4 sm:p-8">
          <div className="relative aspect-[1.478] w-[min(48rem,calc(100vw-5.5rem),calc((100svh-14rem)*1.478))]">
            <Image src={printArt} alt={print.alt} fill sizes="50rem" className="object-cover" />
          </div>
        </div>
      </div>
    </FocusShell>
  );
}
