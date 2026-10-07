"use client";

/**
 * Dev-only toggles for the chrome preview. Query params apply on mount:
 *   ?view=room        switch to room view (room sky, header picks)
 *   ?attr=lab-intro   set html[data-lab-intro] (also lab-zoomed, lab-focus)
 *   ?bare             hide these buttons (clean screenshots)
 */

import { useEffect, useState } from "react";
import { setView } from "@/lib/view-store";

const ATTRS = ["lab-intro", "lab-zoomed", "lab-focus"] as const;

function toggleAttr(name: string) {
  const html = document.documentElement;
  const key = `data-${name}`;
  if (html.hasAttribute(key)) html.removeAttribute(key);
  else html.setAttribute(key, "");
}

export function DevControls() {
  const [bare, setBare] = useState(true);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("view") === "room") setView("room");
    const attr = q.get("attr");
    if (attr) toggleAttr(attr);
    const show = !q.has("bare");
    const id = requestAnimationFrame(() => setBare(!show));
    return () => cancelAnimationFrame(id);
  }, []);

  if (bare) return null;
  return (
    <div className="fixed bottom-3 right-3 z-[60] flex flex-wrap gap-2">
      <button type="button" className="key key-xs" onClick={() => setView("classic")}>
        classic
      </button>
      <button type="button" className="key key-xs" onClick={() => setView("room")}>
        room
      </button>
      {ATTRS.map((a) => (
        <button key={a} type="button" className="key key-xs" onClick={() => toggleAttr(a)}>
          {a}
        </button>
      ))}
    </div>
  );
}
