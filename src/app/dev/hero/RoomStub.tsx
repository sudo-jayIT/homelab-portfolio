"use client";

/**
 * Dev-only stand-in for section#hero so the door can be exercised in
 * isolation: clicking the still flips data-view to "room" (the CSS view switch
 * hides the classic wrapper), this stub shows the entry and rest rects it
 * received, and the buttons flip back to the page either as a return from the
 * room (name stays static) or as an intro skip (name animates again).
 */

import { useEffect, useState } from "react";
import { setView, takeEntry, VIEW_EVENT, wayOut, findWayOut, type Rect } from "@/lib/view-store";

const fmt = (r: Rect | null) => (r ? `${r.x.toFixed(2)}, ${r.y.toFixed(2)}, ${r.w.toFixed(2)} x ${r.h.toFixed(2)}` : "null");

export function RoomStub() {
  const [entry, setEntry] = useState<Rect | null>(null);
  const [rest, setRest] = useState<Rect | null>(null);

  useEffect(() => {
    const onView = () => {
      if (document.documentElement.dataset.view !== "room") return;
      setEntry(takeEntry());
      setRest(wayOut());
    };
    window.addEventListener(VIEW_EVENT, onView);
    return () => window.removeEventListener(VIEW_EVENT, onView);
  }, []);

  const back = (asSkip: boolean) => {
    if (asSkip) delete document.documentElement.dataset.beenInside;
    setView("classic");
  };

  const measureWayOut = () => {
    findWayOut();
    setRest(wayOut());
  };

  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center gap-6 font-mono text-xs text-white/70">
      <p className="uppercase tracking-[0.2em] text-putty">room view (dev stub)</p>
      <p data-entry={entry ? JSON.stringify(entry) : ""}>entry (viewport px): {fmt(entry)}</p>
      <p data-rest={rest ? JSON.stringify(rest) : ""}>rest (document px, parallax corrected): {fmt(rest)}</p>
      <div className="flex gap-3">
        <button type="button" className="key key-sm" onClick={measureWayOut}>
          findWayOut()
        </button>
        <button type="button" className="key key-sm" data-back-room="" onClick={() => back(false)}>
          back (been inside)
        </button>
        <button type="button" className="key key-sm key-light" data-back-skip="" onClick={() => back(true)}>
          back (as intro skip)
        </button>
      </div>
    </div>
  );
}
