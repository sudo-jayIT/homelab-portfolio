"use client";

/**
 * section#hero: the lab (specs 01, 04 sections 4 and 5, 05).
 *
 * Owns the phase machine (init, intro, booting, live, off), the first-visit
 * intro (terminal autoplay session, console fade, power-up, hand-off to the
 * landing still), entering and leaving through the door, the hotspot picks, the focus
 * panels and rack inspector, the HUD, the terminal drop-down, the music card,
 * the keyboard map and the html[data-*] flags.
 *
 * The camera and every GSAP timeline live in an imperative engine created
 * inside useGSAP (useRoomCamera.ts + useLabTimelines.ts). React state only
 * decides what is mounted; the engine never re-renders the art. The static
 * art (RoomBase, RoomLights) is server-rendered and passed in as props.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";
import {
  CAMERA,
  isLight,
  type LightId,
  type HotspotId,
  type LabHeroProps,
  type LabPhase,
  type RackInspectorHandle,
  type RackPartId,
  type ScenePose,
  type TerminalHandle,
  type TerminalMode,
} from "@/components/lab/contracts";
import { HOTSPOT } from "@/components/lab/art/hotspots";
import { useAmbient } from "@/components/lab/art/useAmbient";
import { BootStart, SessionRestored, SystemRestarted } from "@/components/lab/terminal/lines";
import { Terminal } from "@/components/lab/terminal/Terminal";
import { endSession, readHintsSeen, readSession, startSession, writeHintsSeen } from "@/lib/lab-session";
import { currentView, HOME_EVENT, PICK_EVENT, setView, takeEntry, VIEW_EVENT } from "@/lib/view-store";
import { FocusLayer } from "./FocusLayer";
import { HotspotLayer } from "./HotspotLayer";
import { RoomPerson } from "./RoomPerson";
import { HudKeys, TerminalKey, type ZoomAction } from "./HudKeys";
import { IntroControls } from "./IntroControls";
import { MarkerLayer } from "./MarkerLayer";
import { MusicCard } from "./MusicCard";
import { createRoomCamera } from "./useRoomCamera";
import { createLabEngine, type LabEngine } from "./useLabTimelines";

gsap.registerPlugin(useGSAP, DrawSVGPlugin);

const COARSE = "(pointer: coarse)";
const NO_POSE: ScenePose = { x: 0, y: 0, px: 1 };

function exitFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

export function LabHero({ base, lights }: LabHeroProps) {
  const [lightStates, setLightStates] = useState<Record<LightId, boolean>>({ "light-left": true, "light-right": true, "floor-lamp": true, ambient: true });
  const sectionRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<TerminalHandle>(null);
  const inspector = useRef<RackInspectorHandle>(null);
  const api = useRef<LabEngine | null>(null);

  // Mirrors for event handlers (refs, not state, to avoid re-render races).
  const busy = useRef(false);
  const phaseRef = useRef<LabPhase>("init");
  const focusRef = useRef<HotspotId | null>(null);
  const termOpenRef = useRef(false);
  const zoomedRef = useRef(false);
  const fromAutoplay = useRef(false);
  const firstVisitRef = useRef(false);
  const hintsSeenRef = useRef(true);

  const [phase, setPhaseState] = useState<LabPhase>("init");
  const [autoplayUser, setAutoplayUser] = useState<string | null>(null);
  const [firstVisit, setFirstVisit] = useState(false);
  const [termOpen, setTermOpen] = useState(false);
  const [focus, setFocus] = useState<HotspotId | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [hint, setHint] = useState(false);
  const [music, setMusic] = useState(false);
  const [markersAllowed, setMarkersAllowed] = useState(false);
  const [hintsSeen, setHintsSeen] = useState(true);
  const [env, setEnv] = useState({ coarse: false, fullscreen: false });

  const ambient = useAmbient(sectionRef);
  const ambientRef = useRef(ambient);
  useEffect(() => {
    ambientRef.current = ambient;
  }, [ambient]);

  const setPhase = useCallback((p: LabPhase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);
  const setTerm = useCallback((open: boolean) => {
    termOpenRef.current = open;
    setTermOpen(open);
  }, []);
  const setFocused = useCallback((id: HotspotId | null) => {
    focusRef.current = id;
    setFocus(id);
  }, []);

  /* ------------------------------------------------------------------ */
  /* Engine                                                              */
  /* ------------------------------------------------------------------ */

  useGSAP(
    () => {
      const section = sectionRef.current;
      const wrap = wrapRef.current;
      const con = consoleRef.current;
      const dim = dimRef.current;
      if (!section || !wrap || !con || !dim) return;

      const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let hinted = false;
      let hintTimer: gsap.core.Tween | null = null;

      const cam = createRoomCamera({
        section,
        wrap,
        rm,
        busy,
        canGesture: () => phaseRef.current === "live" && !focusRef.current && !busy.current,
        focusId: () => focusRef.current,
        onZoomed: (z) => {
          zoomedRef.current = z;
          setZoomed(z);
          if (z && !hinted) {
            hinted = true;
            setHint(true);
            hintTimer = gsap.delayedCall(5, () => setHint(false));
          }
        },
      });

      const engine = createLabEngine({
        section,
        wrap,
        console: con,
        dim,
        cam,
        rm,
        busy,
        hooks: {
          term: () => terminal.current,
          inspector: () => inspector.current,
          ambient: () => ambientRef.current,
          phase: () => phaseRef.current,
          termOpen: () => termOpenRef.current,
          goLive: () => {
            const saved = readSession();
            const user = saved?.user ?? "guest";
            terminal.current?.login(user);
            if (saved) terminal.current?.print(<SessionRestored user={user} at={saved.at} />);
            startSession(user);
            fromAutoplay.current = false;
            setAutoplayUser(null);
            setPhase("live");
            setMarkersAllowed(true);
          },
          onFocusClosed: (next) => setFocused(next),
        },
      });
      api.current = engine;

      hintsSeenRef.current = readHintsSeen();
      setHintsSeen(hintsSeenRef.current);
      setEnv({ coarse: window.matchMedia(COARSE).matches, fullscreen: !!document.fullscreenEnabled });

      const view = currentView();
      const was = phaseRef.current;
      // Mount-time states are plain style writes on purpose: useGSAP reverts
      // every gsap.set made in this callback on cleanup (Fast Refresh in dev),
      // which would otherwise undo them after later timelines changed things.
      if (view === "room" && was === "live") {
        // The engine was re-created while the lab was live (Fast Refresh in
        // dev): re-attach the camera instead of replaying the intro.
        wrap.style.opacity = "1";
        wrap.style.visibility = "inherit";
        if (!termOpenRef.current) {
          con.style.opacity = "0";
          con.style.visibility = "hidden";
        }
        engine.enter(null);
      } else if (view === "room" && (was === "init" || was === "intro")) {
        // First-visit intro: the inline gate switched to the room before paint.
        // ("intro" again covers the StrictMode remount in dev.)
        cam.measure();
        if (cam.ready()) cam.jump(cam.rest());
        wrap.style.opacity = "0";
        wrap.style.visibility = "hidden";
        firstVisitRef.current = true;
        setFirstVisit(true);
        fromAutoplay.current = true;
        setAutoplayUser(readSession()?.user ?? "guest");
        setPhase("intro");
        con.style.opacity = "1";
        con.style.visibility = "inherit";
        delete document.documentElement.dataset.opening;
      } else if (was === "init") {
        setPhase("off");
      }

      return () => {
        hintTimer?.kill();
        cam.dispose();
        api.current = null;
      };
    },
    { scope: sectionRef },
  );

  /* ------------------------------------------------------------------ */
  /* Boot, logout, terminal                                              */
  /* ------------------------------------------------------------------ */

  const onBoot = useCallback(
    (skip: boolean, name: string) => {
      const eng = api.current;
      if (!eng || busy.current) return;
      busy.current = true;
      const user = name || "guest";
      const wasAutoplay = fromAutoplay.current;
      const isFirst = firstVisitRef.current;
      fromAutoplay.current = false;
      setAutoplayUser(null);
      terminal.current?.login(user);
      startSession(user);
      setPhase("booting");
      const done = () => {
        setPhase("live");
        busy.current = false;
        window.setTimeout(() => setMarkersAllowed(true), 700);
      };
      if (skip) {
        eng.hideConsole(0.3, () => {
          if (isFirst) {
            eng.lightUp();
            done();
            eng.toPage(true);
          } else {
            done();
            eng.powerUp({ fast: true, user });
          }
        });
        return;
      }
      // The first-visit session ends on its own launch line: no boot log
      // there. The login screen and reboot path keep "powering on" and the
      // RACK_BOOT rows.
      if (!wasAutoplay) terminal.current?.print(<BootStart />);
      eng.consoleBoot({
        fast: wasAutoplay,
        rows: !wasAutoplay,
        onComplete: () => {
          if (!isFirst) {
            eng.powerUp({ fast: false, user, silent: true, onComplete: done });
            return;
          }
          eng.frameOpening();
          eng.powerUp({
            fast: false,
            user,
            silent: true,
            onComplete: () => {
              done();
              eng.toPage();
            },
          });
        },
      });
    },
    [setPhase],
  );

  const onExit = useCallback(
    (kind: "logout" | "reboot") => {
      const eng = api.current;
      if (!eng || busy.current) return;
      busy.current = true;
      setMusic(false);
      setMarkersAllowed(false);
      endSession();
      eng.powerDown({
        reboot: kind === "reboot",
        onComplete: () => {
          terminal.current?.reset();
          if (kind === "reboot") terminal.current?.print(<SystemRestarted />);
          setTerm(false);
          setPhase("intro");
          eng.showLogin();
          busy.current = false;
        },
      });
    },
    [setPhase, setTerm],
  );

  const toggleTerm = useCallback(() => {
    const eng = api.current;
    if (!eng || busy.current || focusRef.current) return;
    const next = !termOpenRef.current;
    setTerm(next);
    if (next) eng.openTerm();
    else eng.closeTerm();
  }, [setTerm]);

  const onSkip = useCallback(() => {
    if (phaseRef.current === "intro") onBoot(true, "");
    else if (phaseRef.current === "booting") api.current?.skipBoot();
  }, [onBoot]);

  /* ------------------------------------------------------------------ */
  /* Picks and focus                                                     */
  /* ------------------------------------------------------------------ */

  const pick = useCallback(
    (id: HotspotId, pointer?: { x: number; y: number }) => {
      const eng = api.current;
      if (!eng || busy.current || focusRef.current || !HOTSPOT[id]) return;
      if (id === "print") return;
      if (isLight(id)) {
        setLightStates((states) => ({ ...states, [id]: !states[id] }));
        return;
      }
      if (pointer && window.matchMedia(COARSE).matches && eng.hotspotPx(id) < CAMERA.tapZoomMin) {
        eng.zoomAt(pointer.x, pointer.y, CAMERA.tapZoomFactor);
        eng.showTip(id, 2000);
        return;
      }
      if (id === "record") setMusic(true);
      if (termOpenRef.current) {
        setTerm(false);
        eng.closeTerm();
      }
      if (!hintsSeenRef.current) {
        hintsSeenRef.current = true;
        setHintsSeen(true);
        writeHintsSeen();
      }
      setFocused(id);
    },
    [setFocused, setTerm],
  );

  // The panel / inspector DOM exists by now, so the lift can measure it.
  useLayoutEffect(() => {
    if (focus) api.current?.openFocus(focus);
  }, [focus]);

  /** Close the open focus. `next` chains into another focus; anything else (an event) is ignored. */
  const closeFocus = useCallback((next?: unknown) => {
    const cur = focusRef.current;
    const chain = typeof next === "string" && next in HOTSPOT ? (next as HotspotId) : null;
    if (cur && !busy.current) api.current?.closeFocus(cur, chain);
  }, []);

  const onHover = useCallback((id: HotspotId | null) => api.current?.showTip(id), []);
  const poseOf = useCallback((id: RackPartId) => api.current?.poseOf(id) ?? NO_POSE, []);
  const onStopMusic = useCallback(() => {
    setMusic(false);
    closeFocus();
  }, [closeFocus]);

  /* ------------------------------------------------------------------ */
  /* HUD                                                                 */
  /* ------------------------------------------------------------------ */

  const onStepOutside = useCallback(() => {
    if (busy.current || focusRef.current) return;
    exitFullscreen();
    api.current?.home();
  }, []);

  const onZoom = useCallback((act: ZoomAction) => {
    const eng = api.current;
    if (act === "in") eng?.zoomBy(1.4);
    else if (act === "out") eng?.zoomBy(1 / 1.4);
    else if (act === "reset") eng?.resetView();
    else if (document.fullscreenElement) exitFullscreen();
    else sectionRef.current?.requestFullscreen?.().catch(() => {});
  }, []);

  /* ------------------------------------------------------------------ */
  /* Window events                                                       */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const onView = () => {
      const eng = api.current;
      if (!eng) return;
      const v = currentView();
      if (v === "classic") {
        if (phaseRef.current === "booting") eng.skipBoot();
        eng.sleep();
        setFocused(null);
        setTerm(false);
        if (phaseRef.current === "intro" || phaseRef.current === "init") setPhase("off");
        firstVisitRef.current = false;
        setFirstVisit(false);
      } else if (v === "room") {
        // takeEntry() is only valid during this synchronous dispatch.
        eng.enter(takeEntry());
      }
    };
    window.addEventListener(VIEW_EVENT, onView);
    return () => window.removeEventListener(VIEW_EVENT, onView);
  }, [setFocused, setPhase, setTerm]);

  // Back in the room after a logout and re-login: step in to the default framing.
  useEffect(() => {
    if (phase !== "live" || currentView() !== "room" || zoomedRef.current || firstVisitRef.current) return;
    api.current?.stepIn();
  }, [phase]);

  useEffect(() => {
    const onPick = (e: Event) => {
      const id = (e as CustomEvent<HotspotId>).detail;
      if (phaseRef.current !== "live" || busy.current) return;
      if (focusRef.current) {
        if (focusRef.current !== id) closeFocus(id);
        return;
      }
      pick(id);
    };
    const onHome = () => {
      if (focusRef.current) closeFocus();
      else if (termOpenRef.current) toggleTerm();
      else api.current?.home();
    };
    window.addEventListener(PICK_EVENT, onPick);
    window.addEventListener(HOME_EVENT, onHome);
    return () => {
      window.removeEventListener(PICK_EVENT, onPick);
      window.removeEventListener(HOME_EVENT, onHome);
    };
  }, [pick, closeFocus, toggleTerm]);

  useEffect(() => {
    if (phase !== "live") return;
    const onKey = (e: KeyboardEvent) => {
      if (currentView() === "classic") return;
      const eng = api.current;
      if (e.key === "Escape") {
        if (focusRef.current) closeFocus();
        else if (termOpenRef.current) toggleTerm();
        else {
          exitFullscreen();
          eng?.home();
        }
        return;
      }
      const target = e.target as Element | null;
      if (target?.closest?.("input, textarea, [contenteditable]")) return;
      if (e.key === "`") {
        e.preventDefault();
        toggleTerm();
        return;
      }
      if (focusRef.current || termOpenRef.current || e.metaKey || e.ctrlKey || e.altKey || !eng) return;
      const actions: Record<string, () => void> = {
        "+": () => eng.zoomBy(1.3),
        "=": () => eng.zoomBy(1.3),
        "-": () => eng.zoomBy(1 / 1.3),
        _: () => eng.zoomBy(1 / 1.3),
        "0": () => eng.resetView(),
        ArrowLeft: () => eng.nudge(-90, 0),
        ArrowRight: () => eng.nudge(90, 0),
        ArrowUp: () => eng.nudge(0, -90),
        ArrowDown: () => eng.nudge(0, 90),
      };
      const act = actions[e.key];
      if (act) {
        e.preventDefault();
        act();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, closeFocus, toggleTerm]);

  /* ------------------------------------------------------------------ */
  /* <html> flags                                                        */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const html = document.documentElement;
    if (phase === "intro" || phase === "booting") {
      html.dataset.labIntro = "";
      window.scrollTo({ top: 0, behavior: "instant" });
    } else if (phase === "live" || phase === "off") {
      delete html.dataset.labIntro;
    }
  }, [phase]);
  useEffect(
    () => () => {
      delete document.documentElement.dataset.labIntro;
    },
    [],
  );
  useEffect(() => {
    const html = document.documentElement;
    if (focus) html.dataset.labFocus = "";
    else delete html.dataset.labFocus;
    return () => {
      delete html.dataset.labFocus;
    };
  }, [focus]);
  useEffect(() => {
    const html = document.documentElement;
    if (music) html.dataset.labMusic = "";
    else delete html.dataset.labMusic;
    return () => {
      delete html.dataset.labMusic;
    };
  }, [music]);
  useEffect(() => {
    const html = document.documentElement;
    if (zoomed) html.dataset.labZoomed = "";
    else delete html.dataset.labZoomed;
    return () => {
      delete html.dataset.labZoomed;
    };
  }, [zoomed]);

  // Accessibility: the header is invisible while the lab owns the screen, so
  // take it out of the tab order too (no visual change).
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("body > header, header");
    if (!header) return;
    const hide = phase === "intro" || phase === "booting" || !!focus || zoomed;
    if (hide && !header.inert) {
      header.inert = true;
      header.dataset.labInert = "";
    } else if (!hide && header.dataset.labInert !== undefined) {
      header.inert = false;
      delete header.dataset.labInert;
    }
  }, [phase, focus, zoomed]);

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  const live = phase === "live";
  const mode: TerminalMode = phase === "intro" ? "intro" : live ? "shell" : "busy";
  const showMarkers = live && markersAllowed && !hintsSeen && !focus && !termOpen;

  return (
    <section id="hero" ref={sectionRef} data-phase={phase} data-light-left={lightStates["light-left"] ? "on" : "off"} data-light-right={lightStates["light-right"] ? "on" : "off"} data-floor-lamp={lightStates["floor-lamp"] ? "on" : "off"} data-ambient={lightStates.ambient ? "on" : "off"} className="relative min-h-[100svh] overflow-clip bg-background">
      <div ref={wrapRef} className="pointer-events-none absolute -inset-4 opacity-0 md:-inset-6">
        {base}
        {lights}
        <MarkerLayer show={showMarkers} />
        <HotspotLayer enabled={live && !focus} onPick={pick} onHover={onHover} lightStates={lightStates} />
        <RoomPerson active={live} paused={!!focus} />
        <div
          data-tip=""
          aria-hidden
          className="lab-tip pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-md border border-mint/25 bg-card/95 px-2 py-1 font-mono text-[11px] leading-none text-mint shadow-[0_8px_24px_-8px_rgba(0,0,0,0.9)]"
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent" />
      <div ref={dimRef} className="invisible absolute inset-0 z-30 bg-[rgba(2,4,3,0.8)] opacity-0" onClick={() => closeFocus()} />
      {focus ? (
        <FocusLayer
          id={focus}
          onClose={closeFocus}
          onGo={closeFocus}
          onStopMusic={onStopMusic}
          poseOf={poseOf}
          inspectorRef={inspector}
        />
      ) : null}
      {live && zoomed ? (
        <HudKeys
          coarse={env.coarse}
          fullscreen={env.fullscreen}
          hint={hint && !focus}
          onStepOutside={onStepOutside}
          onZoom={onZoom}
        />
      ) : null}
      <div
        ref={consoleRef}
        data-term=""
        className={`fixed inset-x-0 top-0 opacity-0 ${live ? "z-[55] h-[min(58svh,34rem)] border-b border-line-strong shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95)]" : "z-30 h-[100svh]"}`}
      >
        <Terminal
          ref={terminal}
          mode={mode}
          autoplay={phase === "intro" ? autoplayUser : null}
          onBoot={onBoot}
          onExit={onExit}
          onClose={toggleTerm}
        />
      </div>
      {music ? createPortal(<MusicCard onStop={() => setMusic(false)} />, document.body) : null}
      {phase === "intro" || phase === "booting" ? (
        <IntroControls firstVisit={firstVisit} onBack={() => setView("classic")} onSkip={onSkip} />
      ) : null}
      {live ? <TerminalKey open={termOpen} onToggle={toggleTerm} /> : null}
    </section>
  );
}
