/**
 * View store: which "view" the page is in, kept on <html data-view>.
 *
 *   classic: the scrolling portfolio (landing hero + sections + footer)
 *   room:    the full screen lab (#hero), also used by the first-visit intro
 *
 * View switching itself is pure CSS (see src/styles/base.css). This module
 * flips the attribute, resets scroll, and broadcasts window events. It also
 * holds the "door" handshake between the landing still image (HeroRoom) and
 * the live room camera (LabHero). Specs: 01 section 4.4, 03 section 4.5,
 * 05 section 2.1.
 *
 * Client-only module: import it from client components (it touches window and
 * exports a hook). It carries no "use client" directive on purpose; it is a
 * shared module, not a component boundary.
 */

import { useSyncExternalStore } from "react";
import type { SectionId } from "@/content/types";
import type { HotspotId } from "@/components/lab/contracts";

export type View = "room" | "classic";

/** Rectangle in CSS pixels (document or viewport coordinates, per call site). */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** What HeroRoom registers with setDoor(): its resting rect in document coords. */
export interface DoorInfo {
  rest: Rect;
  depth: number;
}

/** Dispatched on window after every view change (plain Event, no detail). */
export const VIEW_EVENT = "yg:view";
/** Dispatched on window by the header monogram in room view (plain Event). */
export const HOME_EVENT = "yg:home";
/** Dispatched on window by header nav links in room view: CustomEvent<HotspotId>. */
export const PICK_EVENT = "yg:pick";

let entryBox: Rect | null = null;
let door: { box: Rect; depth: number; vw: number; vh: number } | null = null;
let doorFn: (() => DoorInfo | null) | null = null;

/** Current view from <html data-view>, or null before the attribute is known (SSR). */
export function currentView(): View | null {
  if (typeof document === "undefined") return null;
  const v = document.documentElement.dataset.view;
  return v === "room" || v === "classic" ? v : null;
}

/**
 * Switch views. No-op when unchanged. Sets scroll restoration (manual in the
 * room, auto on the page), jumps to the top instantly, then fires VIEW_EVENT.
 * Listeners run synchronously inside this call.
 */
export function setView(v: View): void {
  const html = document.documentElement;
  if (html.dataset.view === v) return;
  html.dataset.view = v;
  history.scrollRestoration = v === "room" ? "manual" : "auto";
  window.scrollTo({ top: 0, behavior: "instant" });
  window.dispatchEvent(new Event(VIEW_EVENT));
}

/** Subscribe to view changes. Returns an unsubscribe function. */
export function subscribeView(callback: () => void): () => void {
  window.addEventListener(VIEW_EVENT, callback);
  return () => window.removeEventListener(VIEW_EVENT, callback);
}

/**
 * React hook for the current view. The server snapshot is null, so markup that
 * depends on the view renders its "unknown" variant before hydration (the
 * header uses this for its sm/lg breakpoint quirk, spec 02 section 2.2).
 */
export function useView(): View | null {
  return useSyncExternalStore(subscribeView, currentView, () => null);
}

/**
 * Step inside from the landing still.
 * @param box   the still image's on-screen rect at click time (viewport px), already inset to the drawn room
 * @param rest  the still's resting rect in document px (inset), used later for the exit move
 * @param depth sky parallax depth of the still (18)
 *
 * The entry box is readable through takeEntry() only during the synchronous
 * VIEW_EVENT dispatch inside setView(); it is cleared right after.
 */
export function enterRoom(box: Rect, rest: Rect, depth: number): void {
  entryBox = box;
  door = { box: rest, depth, vw: window.innerWidth, vh: window.innerHeight };
  document.documentElement.dataset.beenInside = "";
  setView("room");
  entryBox = null;
}

/** Consume the pending entry rect (once). Call from the VIEW_EVENT listener. */
export function takeEntry(): Rect | null {
  const e = entryBox;
  entryBox = null;
  return e;
}

/** HeroRoom registers a getter for its resting rect on mount and passes null on unmount. */
export function setDoor(fn: (() => DoorInfo | null) | null): void {
  doorFn = fn;
}

/**
 * Re-measure the door with the classic layout briefly applied (data-view is
 * set to classic, measured, then restored in the same task, so nothing paints).
 */
export function findWayOut(): void {
  const html = document.documentElement;
  const prev = html.dataset.view;
  html.dataset.view = "classic";
  const info = doorFn?.() ?? null;
  if (prev === undefined) delete html.dataset.view;
  else html.dataset.view = prev;
  if (info) door = { box: info.rest, depth: info.depth, vw: window.innerWidth, vh: window.innerHeight };
}

/**
 * The door rect (document px) corrected for the current sky parallax, or null
 * when nothing was measured or the viewport size changed since measuring.
 * Reads --px/--py from the first [data-sky-vars] element's inline style.
 */
export function wayOut(): Rect | null {
  if (!door || door.vw !== window.innerWidth || door.vh !== window.innerHeight) return null;
  const el = document.querySelector<HTMLElement>("[data-sky-vars]");
  const px = parseFloat(el?.style.getPropertyValue("--px") ?? "") || 0;
  const py = parseFloat(el?.style.getPropertyValue("--py") ?? "") || 0;
  return {
    x: door.box.x - px * door.depth,
    y: door.box.y - py * door.depth,
    w: door.box.w,
    h: door.box.h,
  };
}

/** Ask the room to open a hotspot (header nav in room view). */
export function pickInRoom(id: HotspotId): void {
  window.dispatchEvent(new CustomEvent<HotspotId>(PICK_EVENT, { detail: id }));
}

/** Ask the room to go home (header monogram in room view). */
export function goHome(): void {
  window.dispatchEvent(new Event(HOME_EVENT));
}

/**
 * "classic view ↓" / "full gallery ↓": switch to the page immediately (no exit
 * animation) and smooth-scroll to a section on the next frame.
 */
export function goToSection(id: SectionId): void {
  setView("classic");
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  });
}

/**
 * "see it in the room →": scroll to the top and click the landing door on the
 * next frame so the entry zoom starts from the still. Falls back to a plain
 * view switch when the door is not mounted.
 */
export function seeItInTheRoom(): void {
  const doorEl = document.querySelector<HTMLElement>("[data-room-door]");
  if (!doorEl) {
    setView("room");
    return;
  }
  window.scrollTo({ top: 0, behavior: "instant" });
  requestAnimationFrame(() => doorEl.click());
}

/** Swallow wheel events for `ms` (used after the exit camera lands on the page). */
export function blockWheel(ms = 700): void {
  const stop = (e: WheelEvent) => e.preventDefault();
  window.addEventListener("wheel", stop, { passive: false });
  window.setTimeout(() => window.removeEventListener("wheel", stop), ms);
}
