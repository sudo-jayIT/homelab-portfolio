"use client";

import { useState } from "react";
import type { PanelProps } from "@/components/lab/contracts";
import { PC_PARTS, type PcPart } from "@/content/pc";
import { PcCase } from "../art/objects/PcCase";
import { pcInspectorProjection } from "@/lib/pc-geometry";

const projectCase = pcInspectorProjection();
import { FocusShell } from "./FocusShell";

export function PcPanel({ onClose }: PanelProps) {
  const [selected, setSelected] = useState<PcPart>("case");
  const part = PC_PARTS[selected];
  return <FocusShell label="Desktop PC component explorer" caption="Click a component to inspect it" onClose={onClose}>
    <div className="pc-explorer">
      <div className="pc-explorer-stage">
        <svg viewBox="0 0 460 500" aria-label="HYTE Y70 Touch internal components" className="pc-explorer-model">
          <ellipse cx={230} cy={459} rx={190} ry={23} fill="#a271ff" opacity={0.08} />
          <PcCase project={projectCase} selected={selected} onSelect={setSelected} />
        </svg>
      </div>
      <section className="pc-explorer-details">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mint">Inside my PC</p>
        <h2 className="mt-2 text-xl font-semibold text-mint-head">HYTE Y70 Touch</h2>
        <p className="mt-2 text-sm text-gray-2">Select the GPU, cooler, RAM, motherboard, storage, fans or touchscreen.</p>
        <div className="mt-5 flex flex-wrap gap-2" aria-label="PC components">
          {(Object.keys(PC_PARTS) as PcPart[]).map((id) => <button key={id} type="button" data-pc-select={id} aria-pressed={selected === id} onClick={() => setSelected(id)} className="pc-part-key">{PC_PARTS[id].label}</button>)}
        </div>
        <div className="pc-part-detail" aria-live="polite" aria-atomic="true">
          <p className="font-mono text-xs text-mint">{part.label}</p>
          <h3 className="mt-2 text-lg font-semibold text-mint-head">{part.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-gray-1">{part.description}</p>
        </div>
      </section>
    </div>
  </FocusShell>;
}
