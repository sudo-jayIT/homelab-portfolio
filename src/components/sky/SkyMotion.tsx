"use client";

import { useEffect } from "react";

/**
 * Drives the parallax custom properties (spec 02 section 4.1). Renders nothing.
 *
 * Writes --px, --py (eased pointer position in [-1, 1]) and --sy (scrollY) to
 * every [data-sky-vars] element. Pointer easing is exponential with a 160ms
 * time constant: k = 1 - exp(-dt / 160). Touch pointers are ignored (scroll
 * still updates --sy). pointerleave on <html> eases back to centre. The loop
 * stops when settled. Disabled entirely under prefers-reduced-motion.
 *
 * Elements carrying data-sky-vars must not receive a React `style` prop, or a
 * re-render would wipe these imperatively written values.
 */
export function SkyMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let raf = 0;
    let last = 0;

    const tick = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(now - last, 64) : 16;
      const k = 1 - Math.exp(-dt / 160);
      last = now;
      x += (tx - x) * k;
      y += (ty - y) * k;
      const settled = Math.abs(tx - x) < 0.002 && Math.abs(ty - y) < 0.002;
      if (settled) {
        x = tx;
        y = ty;
        last = 0;
      }
      const px = x.toFixed(4);
      const py = y.toFixed(4);
      const sy = window.scrollY.toFixed(1);
      document.querySelectorAll<HTMLElement>("[data-sky-vars]").forEach((el) => {
        el.style.setProperty("--px", px);
        el.style.setProperty("--py", py);
        el.style.setProperty("--sy", sy);
      });
      if (!settled) raf = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
      kick();
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      tx = 0;
      ty = 0;
      kick();
    };

    const root = document.documentElement;
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", kick, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    kick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", kick);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return null;
}
