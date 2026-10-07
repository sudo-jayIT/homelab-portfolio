"use client";

/**
 * The landing "door" into the room view (spec 03 sections 2.2, 3.7, 4.5).
 *
 * div[data-sky-vars] receives --px/--py/--sy from SkyMotion (never give it a
 * React style prop), the .par child turns them into pointer and scroll
 * parallax (--d 18, --s -0.04), and the button holds the contact shadow, the
 * tilting and floating still image and the "step inside" keycap.
 *
 * Door contract with the view store:
 * - on mount, setDoor() registers a getter for the resting rect: the wrapper's
 *   document rect with height = width * 1460 / 1700, inset to the drawn room
 *   (1/170 horizontally, 1/146 vertically: the bitmap's 10px margin);
 * - on click, enterRoom() receives the image's live on-screen rect (float,
 *   tilt and parallax included), inset the same way, plus the rest rect.
 */

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import { insetStill, type Rect } from "@/components/lab/contracts";
import type { LandingHeroContent } from "@/content/types";
import { enterRoom, setDoor } from "@/lib/view-store";

export interface HeroRoomProps {
  door: LandingHeroContent["door"];
}

/** Resting rect of the still in document coordinates, inset to the drawn room. */
function restRect(wrap: HTMLElement | null, aspect: number): Rect | null {
  if (!wrap) return null;
  const b = wrap.getBoundingClientRect();
  return insetStill({ x: b.left, y: b.top + window.scrollY, w: b.width, h: b.width * aspect });
}

export function HeroRoom({ door }: HeroRoomProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const aspect = door.height / door.width;
  const depth = door.parallaxDepth;

  useEffect(() => {
    setDoor(() => {
      const rest = restRect(wrapRef.current, aspect);
      return rest && { rest, depth };
    });
    return () => setDoor(null);
  }, [aspect, depth]);

  const stepInside = () => {
    const rest = restRect(wrapRef.current, aspect);
    const img = imgRef.current;
    if (!rest || !img) return;
    const r = img.getBoundingClientRect();
    enterRoom(insetStill({ x: r.left, y: r.top, w: r.width, h: r.height }), rest, depth);
  };

  const parallax = { "--d": depth, "--s": door.scrollFactor } as CSSProperties;

  return (
    <div ref={wrapRef} data-sky-vars="" className="relative mx-auto w-full max-w-[34rem] lg:max-w-none">
      <div className="par" style={parallax}>
        <button
          type="button"
          data-room-door=""
          onClick={stepInside}
          aria-label={door.ariaLabel}
          className="mini-room group relative block w-full"
        >
          <span aria-hidden="true" className="mini-room-shadow" />
          <span className="mini-room-tilt block">
            <Image
              ref={imgRef}
              src={door.src}
              alt={door.alt}
              width={door.width}
              height={door.height}
              loading="eager"
              sizes={door.sizes}
              className="mini-room-float h-auto w-full"
            />
          </span>
          <span className="relative -mt-2 flex justify-center">
            <span className="key key-light">{door.keyLabel}</span>
          </span>
        </button>
      </div>
    </div>
  );
}
