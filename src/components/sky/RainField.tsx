"use client";

/**
 * Mint Terminal background: sparse, slow glyph rain on one canvas
 * (docs/theme/b.md sections 4, 6 and 7).
 *
 * Model: a grid of cells (column pitch x row height). Each column holds at
 * most one drop. A drop's lead glyph advances a whole row at a time; every
 * cell it enters lights to full brightness and then fades at the drop's own
 * rate (speed / trail length), so trails are cells left behind, not smears.
 *
 * Masks (mode):
 *   page  cells over the 72rem content column are dimmed and their columns
 *         spawn rarely, so the rain lives in the side gutters;
 *   room  rain across the full width, dimmed inside an ellipse around the
 *         room's projected bounds.
 * Every 12 to 22 seconds one full-strength column gets a fast "burst" drop
 * with a long trail (the old shooting stars' slot).
 *
 * Performance: requestAnimationFrame capped at RAIN.fps, DPR capped at
 * RAIN.maxDpr, typed arrays, no shadowBlur, one clearRect per frame. The loop
 * stops while the tab is hidden, while the canvas is off screen (including
 * display:none, the classic layer in room view) and, in room mode, whenever
 * <html data-view> is not "room" (the room sky is only visibility:hidden on
 * the page, which an IntersectionObserver cannot see). The canvas is
 * absolutely positioned inside a fixed-size box, so it never shifts layout.
 *
 * Reduced motion: no loop. A seeded, static glyph field is painted once (and
 * repainted on resize, on a preference change and when the mono font arrives).
 */

import { useEffect, useRef, type CSSProperties } from "react";
import { CAMERA, ROOM } from "@/components/lab/contracts";
import { mulberry32 } from "@/lib/rng";
import { RAIN, type RainMode, type RainProfile } from "./rain";

const GLYPHS = Array.from(RAIN.glyphs);
const N = GLYPHS.length;

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const randIn = (r: () => number, [lo, hi]: readonly [number, number]) => lo + r() * (hi - lo);

export interface RainFieldProps {
  mode?: RainMode;
  className?: string;
  style?: CSSProperties;
}

export function RainField({ mode = "page", className, style }: RainFieldProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const html = document.documentElement;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fontVar = getComputedStyle(html).getPropertyValue("--font-geist-mono").trim();
    const family = fontVar ? `${fontVar}, ui-monospace, monospace` : "ui-monospace, monospace";
    const rand = Math.random;

    // Layout (CSS px), per-cell alpha and per-column spawn weight.
    let w = 0;
    let h = 0;
    let dpr = 1;
    let p: RainProfile = RAIN.desktop;
    let cols = 0;
    let rows = 0;
    let cellAlpha = new Float32Array(0);
    let colSpawn = new Float32Array(0);

    // Per-cell state.
    let bright = new Float32Array(0);
    let fade = new Float32Array(0);
    let glyph = new Uint8Array(0);

    // Per-column drop state.
    let head = new Float32Array(0);
    let speed = new Float32Array(0);
    let rate = new Float32Array(0);
    let trail = new Float32Array(0);
    let wait = new Float32Array(0);
    let active = new Uint8Array(0);

    let raf = 0;
    let last = 0;
    let inView = true;
    let burstIn = randIn(rand, RAIN.burst.every);

    /** Room mode only runs while the room view is showing. */
    const viewOn = () => mode !== "room" || html.dataset.view === "room";

    function rest(c: number, r: () => number = rand) {
      active[c] = 0;
      wait[c] = randIn(r, RAIN.gap) / Math.max(0.02, colSpawn[c]);
    }

    function spawn(c: number, fast = false) {
      active[c] = 1;
      head[c] = -rand() * 3;
      speed[c] = randIn(rand, fast ? RAIN.burst.speed : RAIN.speed);
      trail[c] = randIn(rand, fast ? RAIN.burst.trail : RAIN.trail);
      rate[c] = speed[c] / trail[c];
    }

    /** Fast drop in a random idle full-strength column (no-op when none is idle). */
    function burst() {
      const start = (rand() * cols) | 0;
      for (let k = 0; k < cols; k++) {
        const c = (start + k) % cols;
        if (!active[c] && colSpawn[c] > 0.85) {
          spawn(c, true);
          return;
        }
      }
    }

    /** Page mask: by distance from the content column edge, the same for every row. */
    function maskPage() {
      const half = Math.min(RAIN.contentHalf, w / 2 - 24);
      for (let c = 0; c < cols; c++) {
        const x = c * p.colW + p.colW / 2;
        const g = smoothstep(-p.feather, p.featherOut, Math.abs(x - w / 2) - half);
        const a = lerp(p.contentAlpha, 1, g);
        colSpawn[c] = lerp(p.contentSpawn, 1, g);
        for (let r = 0; r < rows; r++) cellAlpha[r * cols + c] = a;
      }
    }

    /** Room mask: dimmed inside an ellipse around the room, as the camera's REST framing places it. */
    function maskRoom() {
      const k = RAIN.room;
      const m = CAMERA.fitMargin;
      const fw = Math.max(1, w - m.left - m.right);
      const fh = Math.max(1, h - m.top - m.bottom);
      const s = Math.min(fw / ROOM.w, fh / ROOM.h);
      const rx = Math.max(1, (ROOM.w * s * k.reach) / 2);
      const ry = Math.max(1, (ROOM.h * s * k.reach) / 2);
      const cx = m.left + fw / 2;
      const cy = m.top + fh / 2;
      for (let c = 0; c < cols; c++) {
        const dx = (c * p.colW + p.colW / 2 - cx) / rx;
        let open = 0;
        for (let r = 0; r < rows; r++) {
          const dy = (r * p.rowH + p.rowH / 2 - cy) / ry;
          const g = smoothstep(1 - k.feather, 1 + k.feather, Math.sqrt(dx * dx + dy * dy));
          cellAlpha[r * cols + c] = lerp(k.alpha, 1, g);
          open += g;
        }
        // Columns that mostly run behind the (opaque) room spawn less: same look, fewer draws.
        colSpawn[c] = lerp(k.alpha, 1, open / rows);
      }
    }

    function layout(): boolean {
      // Measure the PARENT, not the canvas itself: a <canvas> is a replaced
      // element, and if its CSS size doesn't resolve cleanly (a WebKit edge
      // case with position:fixed + percentage heights), the browser falls
      // back to the canvas's own width/height attributes as its intrinsic
      // size — which we just set. Reading that back in creates a runaway
      // feedback loop (each resize doubles the canvas, crashing the tab in a
      // few seconds on iOS Safari). The parent div can't self-reference like
      // that, so it's a safe, stable measurement.
      const box = (canvas!.parentElement ?? canvas!).getBoundingClientRect();
      // Hard safety clamp: never allocate a backing store larger than a
      // generous desktop screen, no matter what the measurement says.
      const nw = Math.min(4000, Math.round(box.width));
      const nh = Math.min(4000, Math.round(box.height));
      const nd = Math.min(RAIN.maxDpr, window.devicePixelRatio || 1);
      if (nw === w && nh === h && nd === dpr && cols > 0) return false;
      w = nw;
      h = nh;
      dpr = nd;
      p = w < RAIN.mobileBelow ? RAIN.mobile : RAIN.desktop;
      canvas!.width = Math.max(1, Math.round(w * dpr));
      canvas!.height = Math.max(1, Math.round(h * dpr));
      cols = Math.max(1, Math.ceil(w / p.colW));
      rows = Math.max(1, Math.ceil(h / p.rowH));

      const cells = cols * rows;
      cellAlpha = new Float32Array(cells);
      colSpawn = new Float32Array(cols);
      if (mode === "room") maskRoom();
      else maskPage();

      bright = new Float32Array(cells);
      fade = new Float32Array(cells);
      glyph = new Uint8Array(cells);
      head = new Float32Array(cols);
      speed = new Float32Array(cols);
      rate = new Float32Array(cols);
      trail = new Float32Array(cols);
      wait = new Float32Array(cols);
      active = new Uint8Array(cols);
      return true;
    }

    function step(dt: number) {
      burstIn -= dt;
      if (burstIn <= 0) {
        burstIn = randIn(rand, RAIN.burst.every);
        burst();
      }
      for (let c = 0; c < cols; c++) {
        if (!active[c]) {
          wait[c] -= dt;
          if (wait[c] <= 0) spawn(c);
          continue;
        }
        const from = Math.floor(head[c]);
        head[c] += speed[c] * dt;
        const to = Math.floor(head[c]);
        for (let r = Math.max(0, from + 1); r <= Math.min(to, rows - 1); r++) {
          const i = r * cols + c;
          bright[i] = 1;
          fade[i] = rate[c];
          glyph[i] = (rand() * N) | 0;
        }
        if (to >= 0 && to < rows && rand() < RAIN.headFlicker * dt) {
          glyph[to * cols + c] = (rand() * N) | 0;
        }
        if (to - trail[c] > rows) rest(c);
      }
      const swap = RAIN.mutate * dt;
      for (let i = 0; i < bright.length; i++) {
        if (bright[i] <= 0) continue;
        bright[i] -= fade[i] * dt;
        if (bright[i] < 0) bright[i] = 0;
        else if (rand() < swap) glyph[i] = (rand() * N) | 0;
      }
    }

    function draw() {
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, w, h);
      if (!cols) return;
      ctx!.font = `500 ${p.font}px ${family}`;
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";

      ctx!.fillStyle = RAIN.color;
      for (let r = 0; r < rows; r++) {
        const y = r * p.rowH + p.rowH / 2;
        const base = r * cols;
        for (let c = 0; c < cols; c++) {
          const b = bright[base + c];
          if (b < 0.03) continue;
          if (active[c] && Math.floor(head[c]) === r) continue;
          const a = RAIN.trailAlpha * b * b * cellAlpha[base + c];
          if (a < RAIN.minAlpha) continue;
          ctx!.globalAlpha = a;
          ctx!.fillText(GLYPHS[glyph[base + c]], c * p.colW + p.colW / 2, y);
        }
      }

      ctx!.fillStyle = RAIN.headColor;
      for (let c = 0; c < cols; c++) {
        if (!active[c]) continue;
        const r = Math.floor(head[c]);
        if (r < 0 || r >= rows) continue;
        const i = r * cols + c;
        ctx!.globalAlpha = RAIN.headAlpha * cellAlpha[i];
        ctx!.fillText(GLYPHS[glyph[i]], c * p.colW + p.colW / 2, r * p.rowH + p.rowH / 2);
      }
      ctx!.globalAlpha = 1;
    }

    /** Fresh animated field, simulated forward so the first frame is already raining. */
    function seedLive() {
      bright.fill(0);
      active.fill(0);
      for (let c = 0; c < cols; c++) {
        rest(c);
        wait[c] *= rand();
      }
      const dt = 1 / 15;
      for (let t = 0; t < RAIN.prewarm; t += dt) step(dt);
    }

    /** Reduced motion: a deterministic frozen field, painted once. */
    function paintStatic() {
      const r = mulberry32(RAIN.staticSeed);
      bright.fill(0);
      active.fill(0);
      for (let c = 0; c < cols; c++) {
        if (r() > RAIN.staticDensity * colSpawn[c]) continue;
        const len = Math.round(randIn(r, RAIN.trail));
        const top = Math.floor(r() * (rows + len));
        active[c] = 1;
        head[c] = top;
        for (let k = 0; k <= len; k++) {
          const row = top - k;
          if (row < 0 || row >= rows) continue;
          const i = row * cols + c;
          bright[i] = 1 - k / (len + 1);
          glyph[i] = (r() * N) | 0;
        }
      }
      draw();
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const elapsed = now - last;
      if (elapsed < 1000 / RAIN.fps - 2) return;
      last = now;
      step(Math.min(0.1, elapsed / 1000));
      draw();
    }

    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    }

    function sync() {
      const resized = layout();
      if (motion.matches) {
        stop();
        paintStatic();
        return;
      }
      if (resized) {
        seedLive();
        draw();
      }
      const run = inView && viewOn() && document.visibilityState === "visible" && w > 0 && h > 0;
      if (run && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!run) {
        stop();
      }
    }

    const ro = new ResizeObserver(() => sync());
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    io.observe(canvas);
    const onVisibility = () => sync();
    document.addEventListener("visibilitychange", onVisibility);
    const onMotion = () => {
      cols = 0; // force a rebuild for the new mode
      sync();
    };
    motion.addEventListener("change", onMotion);
    // The room field follows <html data-view>, whoever flips it (view store, intro gate, dev pages).
    const mo = mode === "room" ? new MutationObserver(() => sync()) : null;
    mo?.observe(html, { attributes: true, attributeFilter: ["data-view"] });
    // The mono face may arrive after the first paint; repaint the static field then.
    let alive = true;
    document.fonts?.ready.then(() => {
      if (alive && motion.matches && cols) paintStatic();
    });

    sync();

    return () => {
      alive = false;
      stop();
      ro.disconnect();
      io.disconnect();
      mo?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", onMotion);
    };
  }, [mode]);

  return <canvas ref={ref} aria-hidden className={className} style={{ display: "block", ...style }} />;
}
