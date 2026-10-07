/**
 * Room camera controller (spec 05 sections 4.1, 4.7, 4.11, 5.6; spec 01 4.4).
 *
 * createRoomCamera() is called inside LabHero's useGSAP callback and owns:
 *   - the live camera object P (tweened by GSAP, written as the viewBox of
 *     every svg[data-cam] in the section) and the marker counter-scale
 *   - layout measurements (section, svg element, wrapper parallax offset)
 *   - framings: REST (fit), STEP_IN, focus targets, the door (wayOut)
 *   - zoom/pan clamping, the exit-by-zoom-out rule and the exit tween
 *   - the hotspot tooltip (JS positioned, flips below near the top)
 *   - pointer drag, pinch, wheel (non-passive), click swallowing after drags
 *   - pointer parallax on the wrapper (fine pointers, no reduced motion)
 *   - the ResizeObserver re-framing
 *
 * Everything is imperative on purpose: the camera never goes through React
 * state, so the static art never re-renders.
 */

import gsap from "gsap";
import { RACK_LOCAL } from "./art/config";
import {
  CAMERA,
  isRackPart,
  ROOM,
  STEP_IN_TARGET,
  type HotspotId,
  type RackPartId,
  type ScenePose,
} from "@/components/lab/contracts";
import { HOTSPOT, RACK_PART_BOXES } from "@/components/lab/art/hotspots";
import {
  clamp,
  clampPan,
  clientToElement,
  fit,
  isFiniteCam,
  place,
  toScreen,
  viewBoxString,
  type Box,
  type Cam,
  type Metrics,
} from "@/lib/camera";
import { iso, K, pointsBounds } from "@/lib/iso";
import { blockWheel, setView, wayOut } from "@/lib/view-store";

export interface CameraOptions {
  section: HTMLElement;
  /** The bleeding wrapper (GSAP target for parallax and the power-up flicker/scale). */
  wrap: HTMLElement;
  /** Reduced motion: every camera duration is multiplied by 0. */
  rm: boolean;
  /** Shared "an animation owns the scene" flag. */
  busy: { current: boolean };
  /** Phase is live, no focus is open, not busy: gestures may move the camera. */
  canGesture: () => boolean;
  /** The open focus id, if any (resize re-targets it). */
  focusId: () => HotspotId | null;
  /** The zoomed flag changed (React mirrors it into html[data-lab-zoomed] and the HUD). */
  onZoomed: (zoomed: boolean) => void;
}

export interface RoomCamera {
  /** The live camera object. Tween it with onUpdate: render. */
  readonly P: Cam;
  /** Latest measurements (refresh with measure()). */
  readonly m: Metrics;
  measure(): Metrics;
  /** True once the section and svg have a size. */
  ready(): boolean;
  /** Write the viewBox to every svg[data-cam], counter-scale markers, reposition the tooltip. */
  render(): void;
  /** Assign a camera and render, killing running camera tweens. */
  jump(v: Cam): void;
  /** Tween the camera (power3.out by default, overwrite). Duration is zeroed under reduced motion. */
  tween(v: Cam, duration: number, ease?: string, onComplete?: () => void): gsap.core.Tween;
  rest(m?: Metrics): Cam;
  minScale(m?: Metrics): number;
  stepInView(): Cam;
  focusTarget(id: HotspotId, m?: Metrics): Cam;
  /** The door rect from wayOut() fitted as a camera, or null. */
  doorView(): Cam | null;
  /** Door rect in section px (null when unknown or the viewport changed). */
  doorRect(): Box | null;
  /** Zoom by factor about a client point (default: section centre). */
  zoomAround(f: number, cx?: number, cy?: number): Cam;
  /** Apply a camera from a gesture: leaves the room when zoomed out past rest. */
  setCam(v: Cam, duration?: number): void;
  /** Scale about a client point and move it to the centre. */
  zoomAt(clientX: number, clientY: number, factor: number): void;
  pan(dx: number, dy: number): void;
  /** Tween to the door (or REST), then switch to classic and swallow wheel for 700 ms. */
  exitRoom(duration?: number): void;
  readonly zoomed: boolean;
  setZoomed(z: boolean): void;
  /** Parallax is allowed only while settled and unzoomed. */
  setParallax(on: boolean): void;
  showTip(id: HotspotId | null, autoHide?: boolean): void;
  hotspotPx(id: HotspotId): number;
  poseOf(id: RackPartId): ScenePose;
  /** Screen px per unit of the current camera. */
  scale(): number;
  dispose(): void;
}

const STEP_IN_POINT = iso(STEP_IN_TARGET[0], STEP_IN_TARGET[1], STEP_IN_TARGET[2]);

export function createRoomCamera(opts: CameraOptions): RoomCamera {
  const { section, wrap, rm, busy } = opts;
  const k = rm ? 0 : 1;
  const tip = section.querySelector<HTMLElement>("[data-tip]");

  let svgs: SVGSVGElement[] = [];
  let markers: SVGGElement[] = [];
  const refreshNodes = () => {
    if (!svgs.length || !svgs[0].isConnected) svgs = Array.from(section.querySelectorAll<SVGSVGElement>("svg[data-cam]"));
    if (!markers.length || !markers[0].isConnected) markers = Array.from(section.querySelectorAll<SVGGElement>("[data-mk]"));
  };
  refreshNodes();

  const P: Cam = { x: 0, y: 0, w: 1600, h: 900 };
  let markerK = 1;
  let zoomed = false;
  let tipId: HotspotId | null = null;
  let tipTimer: gsap.core.Tween | null = null;

  const measure = (): Metrics => {
    refreshNodes();
    const hero = section.getBoundingClientRect();
    const svg = svgs[0]?.getBoundingClientRect();
    const gx = Number(gsap.getProperty(wrap, "x")) || 0;
    const gy = Number(gsap.getProperty(wrap, "y")) || 0;
    return {
      hl: hero.left,
      ht: hero.top,
      hw: hero.width,
      hh: hero.height,
      ew: svg?.width ?? 0,
      eh: svg?.height ?? 0,
      ox: (svg?.left ?? 0) - hero.left - gx,
      oy: (svg?.top ?? 0) - hero.top - gy,
    };
  };
  let A = measure();
  const ready = () => A.hw > 0 && A.ew > 0;

  const placeTip = () => {
    if (!tip || !tipId) return;
    const b = pointsBounds(HOTSPOT[tipId].points);
    const s = A.ew / P.w;
    const left = clamp((b.x + b.w / 2 - P.x) * s, 70, A.ew - 70);
    const top = (b.y - P.y) * s;
    const below = top + A.oy < 84;
    tip.style.left = `${left.toFixed(1)}px`;
    tip.style.top = `${(below ? (b.y + b.h - P.y) * s : top).toFixed(1)}px`;
    if (below) tip.dataset.below = "";
    else delete tip.dataset.below;
  };

  const render = () => {
    if (!ready() || !isFiniteCam(P)) return;
    refreshNodes();
    const vb = viewBoxString(P);
    for (const s of svgs) s.setAttribute("viewBox", vb);
    const t = `scale(${((P.w / A.ew) * markerK).toFixed(4)})`;
    for (const mk of markers) mk.setAttribute("transform", t);
    placeTip();
  };

  const rest = (m: Metrics = A): Cam => {
    const { left, right, top, bottom } = CAMERA.fitMargin;
    return fit(ROOM, { x: left - m.ox, y: top - m.oy, w: m.hw - left - right, h: m.hh - top - bottom }, m.ew, m.eh);
  };
  const minScale = (m: Metrics = A) => m.ew / rest(m).w;
  const limits = (m: Metrics = A) => {
    const min = minScale(m);
    return { min, max: Math.max(4.5 * Math.max(m.hw / ROOM.w, m.hh / ROOM.h), 3 * min) };
  };
  const updateMarkerK = () => {
    markerK = clamp(minScale(A) / 0.9, 0.6, 1);
  };
  const pan = (v: Cam): Cam => clampPan(v, ROOM, A.ew, CAMERA.panMargin);

  /** Client point to units under the current camera. */
  const toUnits = (cx: number, cy: number): [number, number] => {
    const r = P.w / A.ew;
    return [P.x + (cx - A.hl - A.ox) * r, P.y + (cy - A.ht - A.oy) * r];
  };

  const zoomAround = (f: number, cx = A.hl + A.hw / 2, cy = A.ht + A.hh / 2): Cam => {
    const lim = limits(A);
    const s = clamp((A.ew / P.w) * f, lim.min, lim.max);
    const [ux, uy] = toUnits(cx, cy);
    return pan({
      x: ux - (cx - A.hl - A.ox) / s,
      y: uy - (cy - A.ht - A.oy) / s,
      w: A.ew / s,
      h: A.eh / s,
    });
  };

  const focusTarget = (id: HotspotId, m: Metrics = A): Cam => {
    const min = m.ew / rest(m).w;
    if (isRackPart(id)) {
      const b = pointsBounds(HOTSPOT.rack.points);
      const st = section.querySelector("[data-stage]")?.getBoundingClientRect();
      const stage: Box = st
        ? { x: st.left - m.hl - m.ox, y: st.top - m.ht - m.oy, w: st.width, h: st.height }
        : { x: -m.ox, y: -m.oy, w: m.hw, h: m.hh };
      const s = clamp(Math.min((0.6 * stage.w) / b.w, (0.82 * stage.h) / b.h), 1.2 * min, 6 * min);
      return place(b.x + b.w / 2, b.y + b.h / 2, s, stage.x + stage.w / 2, stage.y + stage.h / 2, m.ew, m.eh);
    }
    const b = pointsBounds(HOTSPOT[id].points);
    const s = clamp(Math.min((0.3 * m.hw) / b.w, (0.3 * m.hh) / b.h), 1.6 * min, 4.5 * min);
    return place(b.x + b.w / 2, b.y + b.h / 2, s, m.hw / 2 - m.ox, m.hh / 2 - m.oy, m.ew, m.eh);
  };

  const stepInView = (): Cam => {
    const big = Math.max(A.hw / ROOM.w, A.hh / ROOM.h);
    const small = Math.min(A.hw / ROOM.w, A.hh / ROOM.h);
    const lim = limits(A);
    const s = clamp(Math.min(0.92 * big, 2.2 * small), 1.15 * lim.min, lim.max);
    return pan(place(STEP_IN_POINT[0], STEP_IN_POINT[1], s, A.hw / 2 - A.ox, A.hh / 2 - A.oy, A.ew, A.eh));
  };

  const doorRect = (): Box | null => {
    const d = wayOut();
    return d ? { x: d.x - A.hl, y: d.y - A.ht, w: d.w, h: d.h } : null;
  };
  const doorView = (): Cam | null => {
    const d = wayOut();
    return d ? fit(ROOM, clientToElement(d, A), A.ew, A.eh) : null;
  };

  /* ---------------------------------------------------------------- */
  /* Parallax (fine pointer, no reduced motion)                        */
  /* ---------------------------------------------------------------- */

  let parallaxOn = false;
  let qx: ((v: number) => void) | null = null;
  let qy: ((v: number) => void) | null = null;
  let onParallaxMove: ((e: PointerEvent) => void) | null = null;
  if (!rm && window.matchMedia("(pointer: fine)").matches) {
    const fx = gsap.quickTo(wrap, "x", { duration: 1.4, ease: "power3" });
    const fy = gsap.quickTo(wrap, "y", { duration: 1.4, ease: "power3" });
    qx = fx;
    qy = fy;
    onParallaxMove = (e: PointerEvent) => {
      if (!parallaxOn) return;
      fx(-((e.clientX / window.innerWidth - 0.5) * 16));
      fy(-((e.clientY / window.innerHeight - 0.5) * 9));
    };
    window.addEventListener("pointermove", onParallaxMove);
  }
  const resetParallax = () => {
    parallaxOn = false;
    qx?.(0);
    qy?.(0);
  };

  /* ---------------------------------------------------------------- */
  /* Zoomed flag, tooltip                                              */
  /* ---------------------------------------------------------------- */

  const setZoomed = (z: boolean) => {
    if (z === zoomed) return;
    zoomed = z;
    if (z) resetParallax();
    opts.onZoomed(z);
  };

  const showTip = (id: HotspotId | null, autoHide = false) => {
    tipTimer?.kill();
    tipTimer = null;
    const spot = id ? HOTSPOT[id] : null;
    const text = spot && !section.hasAttribute("data-dragging") ? spot.tip : null;
    tipId = text ? id : null;
    if (!tip) return;
    if (!tipId || !text) {
      delete tip.dataset.on;
      return;
    }
    tip.textContent = text;
    placeTip();
    tip.dataset.on = "";
    if (autoHide) tipTimer = gsap.delayedCall(2, () => showTip(null));
  };

  /* ---------------------------------------------------------------- */
  /* Moves                                                             */
  /* ---------------------------------------------------------------- */

  const jump = (v: Cam) => {
    gsap.killTweensOf(P);
    Object.assign(P, v);
    render();
  };

  const tween = (v: Cam, duration: number, ease = "power3.out", onComplete?: () => void) =>
    gsap.to(P, { ...v, duration: duration * k, ease, overwrite: true, onUpdate: render, onComplete });

  const exitRoom = (duration: number = CAMERA.durations.exit) => {
    if (busy.current) return;
    busy.current = true;
    A = measure();
    showTip(null);
    resetParallax();
    const docks = section.querySelectorAll("[data-dock]");
    if (docks.length) gsap.to(docks, { autoAlpha: 0, duration: 0.2 * k, overwrite: true });
    tween(doorView() ?? rest(A), duration, "power3.inOut", () => {
      busy.current = false;
      setView("classic");
      blockWheel(700);
    });
  };

  const setCam = (v: Cam, duration = 0) => {
    if (A.ew / v.w <= CAMERA.exitScale * minScale(A)) {
      if (zoomed) exitRoom();
      return;
    }
    setZoomed(true);
    if (duration) tween(v, duration);
    else jump(v);
  };

  const zoomAt = (clientX: number, clientY: number, factor: number) => {
    A = measure();
    const lim = limits(A);
    const s = clamp((A.ew / P.w) * factor, lim.min, lim.max);
    const [ux, uy] = toUnits(clientX, clientY);
    setCam(pan(place(ux, uy, s, A.hw / 2 - A.ox, A.hh / 2 - A.oy, A.ew, A.eh)), CAMERA.durations.tapZoom);
  };

  const panBy = (dx: number, dy: number) => {
    if (!zoomed) return;
    const s = A.ew / P.w;
    tween(pan({ ...P, x: P.x + dx / s, y: P.y + dy / s }), CAMERA.durations.pan);
  };

  /* ---------------------------------------------------------------- */
  /* Pointer, pinch, wheel                                             */
  /* ---------------------------------------------------------------- */

  const pointers = new Map<number, { x: number; y: number }>();
  let travel = 0;
  const pair = () => {
    const [a, b] = [...pointers.values()];
    return { d: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };

  const onDown = (e: PointerEvent) => {
    if (!opts.canGesture()) return;
    const target = e.target as Element | null;
    if (target?.closest("button, a, input, [data-term], [data-hud]")) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) travel = 0;
    A = measure();
  };

  const onMove = (e: PointerEvent) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    if (pointers.size === 1) {
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      travel += Math.abs(dx) + Math.abs(dy);
      if (zoomed && travel > CAMERA.dragThreshold) {
        gsap.killTweensOf(P);
        const s = A.ew / P.w;
        Object.assign(P, pan({ ...P, x: P.x - dx / s, y: P.y - dy / s }));
        if (!section.hasAttribute("data-dragging")) {
          section.dataset.dragging = "";
          showTip(null);
        }
        render();
      }
      p.x = e.clientX;
      p.y = e.clientY;
      return;
    }
    const before = pair();
    p.x = e.clientX;
    p.y = e.clientY;
    const after = pair();
    travel += 10;
    if (before.d <= 0) return;
    if (zoomed) {
      gsap.killTweensOf(P);
      const s = A.ew / P.w;
      Object.assign(P, pan({ ...P, x: P.x - (after.x - before.x) / s, y: P.y - (after.y - before.y) / s }));
      render();
    }
    setCam(zoomAround(after.d / before.d, after.x, after.y));
  };

  const onUp = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (!pointers.size) delete section.dataset.dragging;
  };

  const onClickCapture = (e: MouseEvent) => {
    if (travel > CAMERA.dragThreshold) {
      e.stopPropagation();
      e.preventDefault();
    }
    travel = 0;
  };

  const onWheel = (e: WheelEvent) => {
    if (!opts.canGesture()) return;
    if ((e.target as Element | null)?.closest("[data-term]")) return;
    e.preventDefault();
    A = measure();
    const dy = e.deltaMode === 1 ? 16 * e.deltaY : e.deltaY;
    setCam(zoomAround(Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX, e.clientY));
  };

  section.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  section.addEventListener("click", onClickCapture, true);
  section.addEventListener("wheel", onWheel, { passive: false });

  /* ---------------------------------------------------------------- */
  /* Resize                                                            */
  /* ---------------------------------------------------------------- */

  let raf = 0;
  const onResize = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (busy.current) return;
      const prevScale = A.ew / P.w;
      const wasReady = ready();
      A = measure();
      if (!ready()) return;
      updateMarkerK();
      const f = opts.focusId();
      if (f) Object.assign(P, focusTarget(f, A));
      else if (zoomed && wasReady) {
        const cx = P.x + P.w / 2;
        const cy = P.y + P.h / 2;
        Object.assign(
          P,
          pan({ x: cx - A.ew / prevScale / 2, y: cy - A.eh / prevScale / 2, w: A.ew / prevScale, h: A.eh / prevScale }),
        );
      } else {
        setZoomed(false);
        Object.assign(P, rest(A));
      }
      render();
    });
  };
  const ro = new ResizeObserver(onResize);
  ro.observe(section);
  document.fonts?.ready.then(onResize).catch(() => {});

  const cam: RoomCamera = {
    P,
    get m() {
      return A;
    },
    measure() {
      A = measure();
      updateMarkerK();
      return A;
    },
    ready,
    render,
    jump,
    tween,
    rest,
    minScale,
    stepInView,
    focusTarget,
    doorView,
    doorRect,
    zoomAround(f, cx, cy) {
      A = measure();
      return zoomAround(f, cx, cy);
    },
    setCam,
    zoomAt,
    pan: panBy,
    exitRoom,
    get zoomed() {
      return zoomed;
    },
    setZoomed,
    setParallax(on) {
      if (on) parallaxOn = true;
      else resetParallax();
    },
    showTip,
    hotspotPx(id) {
      const h = HOTSPOT[id];
      if (!h) return Infinity;
      A = measure();
      const b = pointsBounds(h.points);
      return Math.min(b.w, b.h) * (A.ew / P.w);
    },
    poseOf(id) {
      const b = RACK_PART_BOXES[id];
      const [x, y] = toScreen([b.x + b.w / 2, b.y + b.d / 2, b.z + b.h / 2], P, A.ew);
      return { x: x + A.ox, y: y + A.oy, px: RACK_LOCAL.S * K * (A.ew / P.w) };
    },
    scale: () => A.ew / P.w,
    dispose() {
      section.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      section.removeEventListener("click", onClickCapture, true);
      section.removeEventListener("wheel", onWheel);
      if (onParallaxMove) window.removeEventListener("pointermove", onParallaxMove);
      ro.disconnect();
      cancelAnimationFrame(raf);
      tipTimer?.kill();
    },
  };
  return cam;
}
