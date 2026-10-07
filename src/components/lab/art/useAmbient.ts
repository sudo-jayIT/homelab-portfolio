/**
 * Ambient GSAP loops of the lit room (spec 04 section 4.3): four packets
 * riding the cables (MotionPath), the red packet that dies at the firewall
 * (burst ring, "blocked · opnsense" flash, CRT counter) and the CRT bar graph.
 * LED blinking, the pulsing skyline windows and the record spin are CSS
 * (lab-led-*, lab-spin) and need no timeline.
 *
 * start() builds the loops once and resumes them afterwards; pause() freezes
 * them in place (leaving the room view); kill() tears them down and hides the
 * packets and the alert (power down). Nothing runs under reduced motion.
 * Random values are drawn once per timeline, so each page load differs.
 */

import { useEffect, useMemo, useRef, type RefObject } from "react";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { CABLE_PATH_ID, PACKET_ATTRS, type AmbientControls, type CableId } from "@/components/lab/contracts";
import { BLOCKED_FRACTION, CABLE_LEN } from "./config";

gsap.registerPlugin(MotionPathPlugin);

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** `scope` is the section#hero element; selectors are resolved inside it. */
export function useAmbient(scope: RefObject<HTMLElement | null>): AmbientControls {
  const loops = useRef<gsap.core.Animation[]>([]);
  const blocked = useRef(0);

  const controls = useMemo<AmbientControls>(() => {
    const all = <T extends Element>(root: ParentNode, sel: string) => Array.from(root.querySelectorAll<T>(sel));

    function build(root: HTMLElement) {
      const list: gsap.core.Animation[] = [];

      for (const pkt of all<SVGGElement>(root, "[data-pkt]")) {
        const cable = pkt.getAttribute(PACKET_ATTRS.cable) as CableId | null;
        const path = cable ? root.querySelector<SVGPathElement>(`#${CABLE_PATH_ID[cable]}`) : null;
        if (!cable || !path) continue;
        const dir = Number(pkt.getAttribute(PACKET_ATTRS.dir)) > 0 ? 1 : -1;
        const duration = CABLE_LEN[cable] / gsap.utils.random(110, 150);
        const tl = gsap.timeline({
          repeat: -1,
          delay: gsap.utils.random(0, duration),
          repeatDelay: gsap.utils.random(0.4, 2.4),
        });
        tl.set(pkt, { opacity: 0 })
          .to(
            pkt,
            {
              duration,
              ease: "none",
              motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: dir > 0 ? 0 : 1, end: dir > 0 ? 1 : 0 },
            },
            0,
          )
          .to(pkt, { opacity: 1, duration: 0.25 }, 0)
          .to(pkt, { opacity: 0, duration: 0.25 }, duration - 0.25);
        list.push(tl);
      }

      const wan = root.querySelector<SVGPathElement>(`#${CABLE_PATH_ID.wan}`);
      const red = root.querySelector("[data-blocked-pkt]");
      const alert = root.querySelector("[data-fw-alert]");
      const burst = root.querySelector("[data-fw-burst]");
      if (wan && red && alert && burst) {
        const travel = (CABLE_LEN.wan * BLOCKED_FRACTION) / 140;
        const bump = () => {
          blocked.current += 1;
          const text = blocked.current.toLocaleString();
          for (const n of all(root, "[data-blocked-count]")) n.textContent = text;
        };
        const tl = gsap.timeline({ repeat: -1, delay: 1.2, repeatDelay: 4 });
        tl.set(red, { opacity: 0 })
          .to(
            red,
            {
              duration: travel,
              ease: "none",
              motionPath: { path: wan, align: wan, alignOrigin: [0.5, 0.5], start: 0, end: BLOCKED_FRACTION },
            },
            0,
          )
          .to(red, { opacity: 1, duration: 0.3 }, 0)
          .set(red, { opacity: 0 }, travel)
          .call(bump, [], travel + 0.15)
          .fromTo(
            alert,
            { opacity: 0 },
            { keyframes: { opacity: [1, 0.35, 1, 1, 1, 0] }, duration: 1.8, ease: "none" },
            travel + 0.1,
          )
          .fromTo(
            burst,
            { attr: { r: 1.5 }, opacity: 1 },
            { attr: { r: 13 }, opacity: 0, duration: 0.9, ease: "power2.out" },
            travel + 0.1,
          );
        list.push(tl);
      }

      for (const bar of all<SVGRectElement>(root, "[data-bar]")) {
        list.push(
          gsap.to(bar, {
            scaleY: () => gsap.utils.random(0.25, 1),
            transformOrigin: "50% 100%",
            duration: gsap.utils.random(0.6, 1.3),
            ease: "sine.inOut",
            repeat: -1,
            repeatRefresh: true,
          }),
        );
      }
      return list;
    }

    return {
      start() {
        if (reducedMotion()) return;
        if (loops.current.length) {
          for (const t of loops.current) t.resume();
          return;
        }
        const root = scope.current;
        if (!root) return;
        loops.current = build(root);
      },
      pause() {
        for (const t of loops.current) t.pause();
      },
      kill() {
        for (const t of loops.current) t.kill();
        loops.current = [];
        const root = scope.current;
        if (!root) return;
        const hide = all(root, "[data-pkt], [data-blocked-pkt], [data-fw-alert], [data-fw-burst]");
        if (hide.length) gsap.set(hide, { opacity: 0 });
      },
    };
  }, [scope]);

  // Tear the loops down with the component.
  useEffect(() => () => controls.kill(), [controls]);

  return controls;
}
