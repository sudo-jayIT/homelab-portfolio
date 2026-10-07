"use client";

import { useEffect, useState } from "react";
import { PANEL_IDS, type PanelId } from "@/components/lab/contracts";
import { PANELS } from "@/components/lab/panels";
import type { SectionId } from "@/content";

/** Panel ids that have a registered panel (the contract list may still name a retired one). */
const IDS = PANEL_IDS.filter((p) => p in PANELS);

/** Client half of /dev/panels: switcher, flat panel stage, callback log. */
export function PanelsPreview({ initial, bare, music }: { initial: PanelId; bare: boolean; music: boolean }) {
  const [id, setId] = useState<PanelId>(initial);
  const [log, setLog] = useState("");

  const pick = (next: PanelId) => {
    setId(next);
    setLog("");
    const url = new URL(window.location.href);
    url.searchParams.set("p", next);
    window.history.replaceState(null, "", url);
  };

  const onClose = () => setLog(`onClose(${id})`);
  const onNavigate = (s: SectionId) => setLog(`onNavigate(${s})`);
  const onStopMusic = () => setLog("onStopMusic()");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLog(`Escape: onClose(${id})`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id]);

  const Panel = PANELS[id];
  return (
    <div data-panel-preview="" className="relative h-[100svh] overflow-hidden">
      <div aria-hidden className="panel-preview-backdrop absolute inset-0" />
      <Panel
        key={id}
        id={id}
        onClose={onClose}
        onNavigate={onNavigate}
        onStopMusic={music ? onStopMusic : undefined}
      />
      {bare ? null : (
        <nav className="fixed left-2 top-2 z-50 flex max-w-[calc(100vw-1rem)] flex-wrap gap-1 font-mono text-[10px]">
          {IDS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => pick(p)}
              className={`rounded px-1.5 py-0.5 ${p === id ? "bg-mint text-black" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
            >
              {p}
            </button>
          ))}
          {log ? <span className="rounded bg-black/70 px-1.5 py-0.5 text-mint">{log}</span> : null}
        </nav>
      )}
    </div>
  );
}
