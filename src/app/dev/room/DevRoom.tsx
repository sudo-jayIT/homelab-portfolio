"use client";

/**
 * /dev/room helpers (B4). Never shipped (the dev layout 404s in production).
 *
 * DevRoomBoot decides how the lab starts on this route:
 *   (default)   mount in classic, then setView("room") without an entry box:
 *               the room lights up instantly at the step-in framing
 *   ?intro=1    replay the first-visit intro (what the inline gate does on "/")
 *   ?classic=1  stay on the page with the dev door, to test the zoom in and out
 *
 * DevDoor is a minimal stand-in for the landing HeroRoom door (B2): it uses
 * the room still, registers setDoor() and calls enterRoom() exactly like the
 * real door, so the hand-off math can be checked on this route.
 */

import { useEffect, useLayoutEffect, useRef } from "react";
import { insetStill, STILL } from "@/components/lab/contracts";
import { enterRoom, setDoor, setView } from "@/lib/view-store";

function mode(): "room" | "intro" | "classic" {
  const q = new URLSearchParams(window.location.search);
  if (q.has("intro")) return "intro";
  if (q.has("classic")) return "classic";
  return "room";
}

export function DevRoomBoot() {
  // Runs before LabHero's useGSAP (sibling order), like the pre-paint gate.
  useLayoutEffect(() => {
    if (mode() !== "intro") return;
    const html = document.documentElement;
    html.dataset.view = "room";
    html.dataset.labIntro = "";
    html.dataset.opening = "";
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    if (mode() !== "room") return;
    const raf = requestAnimationFrame(() => setView("room"));
    return () => cancelAnimationFrame(raf);
  }, []);
  return null;
}

export function DevDoor({ src }: { src: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const rest = () => {
      const w = wrapRef.current;
      if (!w) return null;
      const b = w.getBoundingClientRect();
      return {
        rest: insetStill({ x: b.left, y: b.top + window.scrollY, w: b.width, h: (b.width * STILL.height) / STILL.width }),
        depth: STILL.depth,
      };
    };
    setDoor(rest);
    return () => setDoor(null);
  }, []);

  const onClick = () => {
    const img = imgRef.current;
    const info = wrapRef.current?.getBoundingClientRect();
    if (!img || !info) return;
    const r = img.getBoundingClientRect();
    enterRoom(
      insetStill({ x: r.left, y: r.top, w: r.width, h: r.height }),
      insetStill({ x: info.left, y: info.top + window.scrollY, w: info.width, h: (info.width * STILL.height) / STILL.width }),
      STILL.depth,
    );
  };

  return (
    <div ref={wrapRef} data-sky-vars="" className="relative w-full">
      <button type="button" data-room-door="" aria-label="Step inside my room" onClick={onClick} className="block w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt=""
          width={STILL.width}
          height={STILL.height}
          className="par block h-auto w-full"
          style={{ ["--d" as string]: STILL.depth }}
        />
      </button>
    </div>
  );
}
