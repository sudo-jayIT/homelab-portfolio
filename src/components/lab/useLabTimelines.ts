/**
 * Room engine timelines (spec 01 sections 4.2 to 4.6, spec 04 section 4.4,
 * spec 05 sections 4.2 to 4.9).
 *
 * createLabEngine() is called inside LabHero's useGSAP callback, next to the
 * camera from createRoomCamera(). It implements the LabApi contract:
 * console boot log, room power-up (fluorescent flicker, slow settle, rack
 * parts with callout tags, cables drawing themselves), power-down, lightUp,
 * skipBoot, the door hand-off (frameOpening, toPage, enter), the focus lift
 * choreography, the terminal drop-down and the HUD camera moves.
 *
 * React state stays in LabHero; the engine reports back through `hooks`.
 */

import { createElement, type ReactNode } from "react";
import gsap from "gsap";
import {
  CAMERA,
  isBootPart,
  isRackPart,
  POWER_GROUP_CABLE,
  POWER_GROUPS,
  ROOM,
  type AmbientControls,
  type HotspotId,
  type LabApi,
  type LabPhase,
  type PowerUpOptions,
  type RackInspectorHandle,
  type Rect,
  type TerminalHandle,
} from "@/components/lab/contracts";
import { HOTSPOT } from "@/components/lab/art/hotspots";
import { BootOk, BootTarget, LabOnline } from "@/components/lab/terminal/lines";
import { RACK_BOOT } from "@/content";
import { clientToElement, cssMatrix, faceAffine, fit, IDENTITY, lerpAffine, type Box, type Cam } from "@/lib/camera";
import { findWayOut, setView, wayOut } from "@/lib/view-store";
import type { RoomCamera } from "./useRoomCamera";

export interface EngineHooks {
  term(): TerminalHandle | null;
  inspector(): RackInspectorHandle | null;
  ambient(): AmbientControls;
  phase(): LabPhase;
  termOpen(): boolean;
  /** enter() while the lab is not live yet: React logs in, restores the session and goes live. */
  goLive(): void;
  /** A focus close finished; `next` chains into another focus. */
  onFocusClosed(next: HotspotId | null): void;
}

export interface EngineOptions {
  section: HTMLElement;
  wrap: HTMLElement;
  /** The fixed console wrapper div[data-term]. */
  console: HTMLElement;
  /** The focus scrim. */
  dim: HTMLElement;
  cam: RoomCamera;
  rm: boolean;
  busy: { current: boolean };
  hooks: EngineHooks;
}

/** LabApi plus the internal variants LabHero uses. */
export interface LabEngine extends LabApi {
  /** instant: switch to the page with no camera move (skip on the first visit). */
  toPage(instant?: boolean): void;
  /** Close the terminal drop-down, then call done. */
  closeTerm(done?: () => void): void;
}

const LIT_SET = "[data-base], [data-lights], [data-unit], [data-part], [data-pool], [data-cable]:not([data-pkt])";
const LIGHT_GROUPS = ["room", "desk", "deskitems", "record"] as const;
/** Every console boot row, in power-up order. */
const BOOT_ROWS = RACK_BOOT.flatMap((s) => s.rows);
/**
 * Console row spacing scales down when there are many rows, so the boot log
 * keeps roughly the pace of a short one (6 rows at full spacing).
 */
const ROW_PACE = Math.min(1, 6 / Math.max(1, BOOT_ROWS.length));
/** Start of the console fade when the boot log is skipped (consoleBoot rows: false). */
const QUIET_FADE_AT = 0.1;
/** Delay between devices that light up in the same power-up stage. */
const PART_STAGGER = 0.09;
const FLICKER = [0, 1, 0.2, 1, 0.55, 1];
const SPOT_FLICKER = [0, 1, 0.3, 1, 0.7, 1];
const WRAP_FLICKER = [0, 0.5, 0.06, 0.75, 0.25, 1];

export function createLabEngine(o: EngineOptions): LabEngine {
  const { section, wrap, dim, cam, busy, hooks } = o;
  const term = o.console;
  const k = o.rm ? 0 : 1;
  const P = cam.P;

  const all = (selector: string) => Array.from(section.querySelectorAll<Element>(selector));
  /** Add a tween only when its targets exist (the art may omit optional groups). */
  const add = (
    tl: gsap.core.Timeline,
    selector: string,
    vars: gsap.TweenVars,
    pos: gsap.Position,
    from?: gsap.TweenVars,
  ) => {
    const els = all(selector);
    if (!els.length) return;
    if (from) tl.fromTo(els, from, vars, pos);
    else tl.to(els, vars, pos);
  };
  const print = (...nodes: ReactNode[]) => hooks.term()?.print(...nodes);
  const docks = () => all("[data-dock]");

  let bootTl: gsap.core.Animation | null = null;
  let powerTl: gsap.core.Timeline | null = null;
  let saved: Cam | null = null;
  let fitsDoor = false;

  /* ---------------------------------------------------------------- */
  /* Lights                                                            */
  /* ---------------------------------------------------------------- */

  const lightUp = () => {
    bootTl?.kill();
    powerTl?.kill();
    gsap.killTweensOf(term);
    const lit = all(LIT_SET);
    if (lit.length) gsap.set(lit, { opacity: 1 });
    const paths = all("[data-cable] path");
    if (paths.length) gsap.set(paths, { drawSVG: "0% 100%" });
    gsap.set(wrap, { autoAlpha: 1, scale: 1 });
    gsap.set(term, { autoAlpha: 0 });
    hooks.ambient().start();
  };

  const powerUp = ({ fast, user, silent = false, onComplete }: PowerUpOptions) => {
    const tl = gsap.timeline({
      onComplete: () => {
        cam.setParallax(true);
        onComplete?.();
      },
    });
    powerTl = tl;
    const step = fast ? 0.1 : 0.45;
    const c = fast ? 0 : 1;

    if (fast) {
      tl.to(wrap, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "power1.out" }, 0);
    } else {
      const s = cam.scale();
      const origin = `${(ROOM.x + ROOM.w / 2 - P.x) * s}px ${(ROOM.y + 0.55 * ROOM.h - P.y) * s}px`;
      tl.set(wrap, { visibility: "visible", transformOrigin: origin }, 0)
        .fromTo(wrap, { opacity: 0 }, { keyframes: { opacity: WRAP_FLICKER }, duration: 1.2, ease: "none" }, 0)
        .fromTo(wrap, { scale: 1.2 }, { scale: 1, duration: 5.2, ease: "power2.out" }, 0);
    }

    add(tl, '[data-base="myrack"]', { opacity: 1, duration: fast ? 0.25 : 0.5, ease: "power1.out" }, c + 0.1);
    add(tl, '[data-pool="myrack"]', { opacity: 1, duration: 1.2, ease: "power1.out" }, c + 0.2);
    add(tl, '[data-part="spot"]', { keyframes: { opacity: SPOT_FLICKER }, duration: fast ? 0.25 : 0.5, ease: "none" }, c);

    RACK_BOOT.forEach((stage, i) => {
      const at = c + 0.35 + i * step;
      stage.parts.forEach((part, j) => {
        const t = at + j * (fast ? 0.03 : PART_STAGGER);
        add(tl, `[data-part="${part}"]`, { keyframes: { opacity: FLICKER }, duration: fast ? 0.3 : 0.5, ease: "none" }, t);
        if (!fast && isBootPart(part)) {
          add(tl, `[data-tag="${part}"]`, { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }, t, { opacity: 0, x: -8 });
        }
      });
      if (!silent) {
        const each = step / Math.max(1, stage.rows.length);
        stage.rows.forEach((row, j) =>
          tl.call(() => print(createElement(BootOk, { host: row.host, msg: row.msg })), [], at + j * each),
        );
      }
    });

    let h = c + 0.35 + RACK_BOOT.length * step;
    if (!fast) add(tl, "[data-tag]", { opacity: 0, duration: 0.45, stagger: 0.06 }, h + 0.7);

    const d = fast ? 0.1 : 0.35;
    POWER_GROUPS.forEach((devices, g) => {
      const at = h + g * d;
      for (const dev of devices) {
        add(tl, `[data-base="${dev}"]`, { opacity: 1, duration: fast ? 0.25 : 0.4, ease: "power1.out" }, at);
        add(tl, `[data-pool="${dev}"]`, { opacity: 1, duration: 1.2, ease: "power1.out" }, at + 0.1);
        add(tl, `[data-lights="${dev}"]`, { keyframes: { opacity: FLICKER }, ease: "none", duration: fast ? 0.35 : 0.6 }, at + 0.05);
      }
      const cable = POWER_GROUP_CABLE[g];
      if (cable) {
        const group = all(`[data-cable="${cable}"]:not([data-pkt])`);
        if (group.length) tl.set(group, { opacity: 1 }, at);
        add(
          tl,
          `[data-cable="${cable}"]:not([data-pkt]) path`,
          { drawSVG: "100%", duration: fast ? 0.5 : 0.9, ease: "power2.inOut" },
          at,
          { drawSVG: "0%" },
        );
      }
    });
    h += POWER_GROUPS.length * d;
    tl.call(() => hooks.ambient().start(), [], h);
    tl.call(() => print(createElement(LabOnline, { user })), [], h);
    tl.to({}, { duration: fast ? 0.1 : 0.5 });
  };

  const powerDown = ({ onComplete }: { reboot: boolean; onComplete?: () => void }) => {
    hooks.ambient().kill();
    cam.setParallax(false);
    cam.showTip(null);
    const tl = gsap.timeline({
      onComplete: () => {
        cam.setZoomed(false);
        cam.measure();
        cam.jump(cam.rest());
        onComplete?.();
      },
    });
    tl.to(term, { autoAlpha: 0, duration: 0.25 }, 0);
    const tags = all("[data-tag]");
    if (tags.length) tl.set(tags, { opacity: 0 }, 0);
    add(tl, "[data-cable]:not([data-pkt]) path", { drawSVG: "100% 100%", duration: 0.7, ease: "power2.in" }, 0);
    add(tl, "[data-unit], [data-part]", { opacity: 0, duration: 0.2, stagger: { each: 0.01, from: "end" } }, 0.1);
    add(tl, LIGHT_GROUPS.map((g) => `[data-lights="${g}"]`).join(","), { opacity: 0, duration: 0.25, stagger: 0.08 }, 0.1);
    add(tl, "[data-pool]", { opacity: 0, duration: 0.6 }, 0.1);
    add(tl, "[data-base]", { opacity: 0.42, duration: 0.6 }, 0.3);
    const cables = all("[data-cable]:not([data-pkt])");
    if (cables.length) tl.set(cables, { opacity: 0 }, 0.9);
    tl.to(wrap, { autoAlpha: 0, duration: 0.7, ease: "power2.in" }, 0.5);
  };

  const skipBoot = () => {
    // Completing the console boot fires its onComplete, which may start the
    // power-up; read powerTl afterwards so that one completes too.
    bootTl?.progress(1);
    powerTl?.progress(1);
  };

  /* ---------------------------------------------------------------- */
  /* Console                                                           */
  /* ---------------------------------------------------------------- */

  const consoleBoot = ({ fast, rows = true, onComplete }: { fast: boolean; rows?: boolean; onComplete?: () => void }) => {
    gsap.killTweensOf(term);
    const tl = gsap.timeline({ onComplete });
    bootTl = tl;
    if (!rows) {
      // First-visit session: it already ended on its launch line; just fade.
      tl.to(term, { autoAlpha: 0, duration: 0.7, ease: "power2.inOut" }, QUIET_FADE_AT);
      return;
    }
    const [start, base] = fast ? [0.15, 0.12] : [0.35, 0.32];
    const step = base * ROW_PACE;
    BOOT_ROWS.forEach((row, i) =>
      tl.call(() => print(createElement(BootOk, { host: row.host, msg: row.msg })), [], start + i * step),
    );
    const c = start + BOOT_ROWS.length * step;
    tl.call(() => print(createElement(BootTarget)), [], c + 0.1);
    tl.to(term, { autoAlpha: 0, duration: 0.7, ease: "power2.inOut" }, c + (fast ? 0.5 : 0.6));
  };

  const hideConsole = (duration = 0.3, onComplete?: () => void) => {
    gsap.killTweensOf(term);
    bootTl = gsap.to(term, { autoAlpha: 0, duration, ease: "power2.in", onComplete });
  };

  const focusTerminalIfFine = () => {
    if (window.matchMedia("(pointer: fine)").matches) hooks.term()?.focus();
  };

  const showLogin = () => {
    gsap.set(term, { yPercent: 0 });
    gsap.fromTo(term, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "power2.out", onComplete: focusTerminalIfFine });
  };

  const openTerm = () => {
    cam.showTip(null);
    gsap.fromTo(
      term,
      { autoAlpha: 1, yPercent: -100 },
      { yPercent: 0, duration: 0.35, ease: "power3.out", onComplete: () => hooks.term()?.focus() },
    );
  };

  const closeTerm = (done?: () => void) => {
    gsap.to(term, {
      yPercent: -100,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        gsap.set(term, { autoAlpha: 0 });
        done?.();
      },
    });
  };

  /* ---------------------------------------------------------------- */
  /* Door hand-off                                                     */
  /* ---------------------------------------------------------------- */

  const frameOpening = () => {
    findWayOut();
    const m = cam.measure();
    const d = wayOut();
    fitsDoor = !!d && d.x >= 0 && d.y >= 0 && d.x + d.w <= m.hw && d.y + d.h <= m.hh;
    cam.jump((fitsDoor && cam.doorView()) || cam.rest());
    return fitsDoor;
  };

  const toPage = (instant = false) => {
    if (instant) {
      setView("classic");
      return;
    }
    cam.measure();
    cam.exitRoom(fitsDoor ? CAMERA.durations.exitFits : CAMERA.durations.exit);
  };

  const enter = (entry: Rect | null) => {
    const m = cam.measure();
    if (!cam.ready()) return;
    if (hooks.phase() === "live") {
      // Already lit: resume the paused loops (and make sure the layer shows).
      gsap.set(wrap, { autoAlpha: 1, scale: 1 });
      hooks.ambient().start();
    } else {
      lightUp();
      hooks.goLive();
    }
    gsap.killTweensOf(P);
    cam.setZoomed(true);
    if (!entry) {
      cam.jump(cam.stepInView());
      return;
    }
    cam.jump(fit(ROOM, clientToElement(entry, m), m.ew, m.eh));
    busy.current = true;
    cam.tween(cam.stepInView(), CAMERA.durations.enter, "power3.inOut", () => {
      busy.current = false;
    });
  };

  const sleep = () => {
    gsap.killTweensOf(P);
    cam.showTip(null);
    cam.setParallax(false);
    cam.setZoomed(false);
    saved = null;
    busy.current = false;
    gsap.set(dim, { autoAlpha: 0 });
    const vinyl = all("[data-vinyl]");
    if (vinyl.length) gsap.set(vinyl, { opacity: 1 });
    const d = docks();
    if (hooks.phase() === "live" && d.length) gsap.set(d, { autoAlpha: 1 });
    if (hooks.termOpen()) gsap.set(term, { autoAlpha: 0, yPercent: -100 });
    hooks.ambient().pause();
  };

  /* ---------------------------------------------------------------- */
  /* Focus                                                             */
  /* ---------------------------------------------------------------- */

  /** Section-relative rect of an element with its transform temporarily removed. */
  const untransformed = (el: HTMLElement): Box => {
    const prev = el.style.transform;
    el.style.transform = "none";
    const r = el.getBoundingClientRect();
    el.style.transform = prev;
    const m = cam.m;
    return { x: r.left - m.hl, y: r.top - m.ht, w: r.width, h: r.height };
  };

  const liftWriter = (id: HotspotId, lift: HTMLElement, box: Box, state: { t: number }) => {
    const face = HOTSPOT[id]?.face;
    return () => {
      if (!face || box.w <= 0 || box.h <= 0) {
        lift.style.transform = "none";
        return;
      }
      lift.style.transform = cssMatrix(lerpAffine(faceAffine(face, P, cam.m, box), IDENTITY, state.t));
    };
  };

  /** Phase-match the lifted disc with the in-scene vinyl (both 1.8 s per turn). */
  const syncRecordSpin = (lift: HTMLElement) => {
    const spin = section.querySelector("[data-vinyl] .lab-spin");
    const disc = lift.querySelector<HTMLElement>("[data-spin]");
    const t = spin ? getComputedStyle(spin).transform : "none";
    if (!disc || !t || t === "none") return;
    const mtx = new DOMMatrix(t);
    const deg = ((Math.atan2(mtx.b, mtx.a) * 180) / Math.PI + 360) % 360;
    disc.style.animationDelay = `${(-((deg / 360) * 1.8)).toFixed(3)}s`;
  };

  const openFocus = (id: HotspotId) => {
    busy.current = true;
    cam.setParallax(false);
    cam.showTip(null);
    cam.measure();
    saved = cam.zoomed ? { ...P } : cam.rest();
    const target = cam.focusTarget(id);
    const tl = gsap.timeline({
      onComplete: () => {
        busy.current = false;
      },
    });
    const d = docks();
    if (d.length) tl.to(d, { autoAlpha: 0, duration: 0.3 * k }, 0);
    tl.to(P, { ...target, duration: 0.95 * k, ease: "power3.inOut", onUpdate: cam.render }, 0);
    tl.to(dim, { autoAlpha: isRackPart(id) ? 1 : 0.85, duration: 0.5 * k }, 0.35 * k);

    if (isRackPart(id)) {
      tl.call(() => hooks.inspector()?.enter(), [], 0.4 * k).to({}, { duration: 1.05 * k }, 0.4 * k);
      return;
    }
    const lift = section.querySelector<HTMLElement>("[data-lift]");
    if (!lift) return;
    const box = untransformed(lift);
    const state = { t: 0 };
    const write = liftWriter(id, lift, box, state);
    write();
    if (id === "record") {
      syncRecordSpin(lift);
      const vinyl = all("[data-vinyl]");
      if (vinyl.length) tl.set(vinyl, { opacity: 0 }, 0.45 * k);
    }
    tl.to(state, { t: 1, duration: 0.8 * k, ease: "power3.inOut", onUpdate: write, onComplete: write }, 0.45 * k);
    tl.fromTo(lift, { opacity: 0 }, { opacity: 1, duration: 0.3 * k }, 0.45 * k);
    const chrome = all("[data-chrome]");
    if (chrome.length) tl.fromTo(chrome, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.35 * k }, 1.05 * k);
  };

  const closeFocus = (id: HotspotId, next: HotspotId | null = null) => {
    busy.current = true;
    cam.measure();
    const back = saved ?? cam.rest();
    const tl = gsap.timeline({
      onComplete: () => {
        busy.current = false;
        if (!cam.zoomed) cam.setParallax(true);
        hooks.onFocusClosed(next);
      },
    });
    const chrome = all("[data-chrome]");
    if (chrome.length) tl.to(chrome, { autoAlpha: 0, duration: 0.2 * k }, 0);
    if (isRackPart(id)) {
      tl.call(() => hooks.inspector()?.leave(() => {}), [], 0);
    } else {
      const lift = section.querySelector<HTMLElement>("[data-lift]");
      if (lift) {
        const box = untransformed(lift);
        const state = { t: 1 };
        const write = liftWriter(id, lift, box, state);
        tl.to(state, { t: 0, duration: 0.65 * k, ease: "power3.inOut", onUpdate: write }, 0);
        tl.to(lift, { opacity: 0, duration: 0.25 * k }, 0.4 * k);
        if (id === "record") {
          const vinyl = all("[data-vinyl]");
          if (vinyl.length) tl.set(vinyl, { opacity: 1 }, 0.4 * k);
        }
      }
    }
    tl.to(dim, { autoAlpha: 0, duration: 0.5 * k }, 0.25 * k);
    tl.to(P, { ...back, duration: 0.9 * k, ease: "power3.inOut", onUpdate: cam.render }, 0.25 * k);
    const d = docks();
    if (d.length) tl.to(d, { autoAlpha: 1, duration: 0.4 * k }, 0.85 * k);
  };

  /* ---------------------------------------------------------------- */
  /* HUD moves                                                         */
  /* ---------------------------------------------------------------- */

  const zoomBy = (factor: number, duration: number = CAMERA.durations.zoom) => {
    cam.setCam(cam.zoomAround(factor), duration);
  };

  const resetView = (duration: number = CAMERA.durations.reset) => {
    if (!cam.zoomed) return;
    cam.measure();
    cam.tween(cam.stepInView(), duration);
  };

  const stepIn = (duration: number = CAMERA.durations.stepIn) => {
    if (cam.zoomed) return;
    cam.measure();
    cam.setZoomed(true);
    cam.tween(cam.stepInView(), duration, "power3.inOut");
  };

  const home = () => {
    if (!cam.zoomed) return;
    cam.exitRoom();
  };

  return {
    enter,
    home,
    openFocus,
    closeFocus,
    openTerm,
    closeTerm,
    zoomBy,
    zoomAt: (x, y, f) => cam.zoomAt(x, y, f),
    resetView,
    stepIn,
    nudge: (dx, dy) => cam.pan(dx, dy),
    showTip: (id, autoHideMs) => cam.showTip(id, !!autoHideMs),
    hotspotPx: (id) => cam.hotspotPx(id),
    poseOf: (id) => cam.poseOf(id),
    sleep,
    consoleBoot,
    powerUp,
    powerDown,
    hideConsole,
    showLogin,
    frameOpening,
    toPage,
    lightUp,
    skipBoot,
  };
}
