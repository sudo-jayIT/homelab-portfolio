"use client";

/**
 * Dev harness for the tty console. A tiny stand-in for the room engine (B4)
 * drives the same phase flow as the real lab: the autoplay session, console
 * fade (with the boot log on the login path), a power-up wait, the shell
 * drop-down, power down and the login screen. Timings follow spec 01 sections 4.1 to 4.6 so captures can be
 * compared frame by frame with the reference.
 */

import gsap from "gsap";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { LabPhase, TerminalHandle, TerminalMode } from "@/components/lab/contracts";
import { Terminal } from "@/components/lab/terminal/Terminal";
import {
  BootOk,
  BootStart,
  BootTarget,
  LabOnline,
  SessionRestored,
  SystemRestarted,
} from "@/components/lab/terminal/lines";
import { INTRO, RACK_BOOT } from "@/content";
import { SCENARIOS, SCENARIO_LABEL, type Scenario } from "./scenarios";

interface Setup {
  phase: LabPhase;
  mode: TerminalMode;
  autoplay: string | null;
  firstVisit: boolean;
}

function setupFor(s: Scenario, user: string): Setup {
  switch (s) {
    case "intro":
      return { phase: "intro", mode: "intro", autoplay: user, firstVisit: true };
    case "login":
    case "reboot":
      return { phase: "intro", mode: "intro", autoplay: null, firstVisit: false };
    case "shell":
      return { phase: "live", mode: "shell", autoplay: null, firstVisit: false };
    case "busy":
      return { phase: "booting", mode: "busy", autoplay: null, firstVisit: false };
  }
}

const finePointer = () => window.matchMedia("(pointer: fine)").matches;

export function TerminalLab({ initial, user: initialUser, bare }: { initial: Scenario; user: string; bare: boolean }) {
  const [scenario, setScenario] = useState<Scenario>(initial);
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState<LabPhase>(() => setupFor(initial, initialUser).phase);
  const [mode, setMode] = useState<TerminalMode>(() => setupFor(initial, initialUser).mode);
  const [autoplay, setAutoplay] = useState<string | null>(() => setupFor(initial, initialUser).autoplay);
  const [firstVisit, setFirstVisit] = useState(() => setupFor(initial, initialUser).firstVisit);
  const [termOpen, setTermOpen] = useState(initial === "shell");
  const [roomLit, setRoomLit] = useState(initial === "shell");
  const [log, setLog] = useState<string[]>([]);

  const termRef = useRef<TerminalHandle>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const timelines = useRef<gsap.core.Timeline[]>([]);
  const busy = useRef(false);
  const fromAutoplay = useRef(initial === "intro");

  const note = useCallback((msg: string) => setLog((l) => [...l.slice(-5), msg]), []);
  const term = () => termRef.current;

  const killTimelines = () => {
    timelines.current.forEach((t) => t.kill());
    timelines.current = [];
  };

  /** Restart the harness in a scenario (remounts the terminal). */
  function start(s: Scenario) {
    killTimelines();
    busy.current = false;
    const setup = setupFor(s, initialUser);
    fromAutoplay.current = s === "intro";
    setScenario(s);
    setPhase(setup.phase);
    setMode(setup.mode);
    setAutoplay(setup.autoplay);
    setFirstVisit(setup.firstVisit);
    setTermOpen(s === "shell");
    setRoomLit(s === "shell");
    setLog([]);
    setRun((r) => r + 1);
  }

  // Console visibility at the start of a run (GSAP owns opacity/visibility like the engine).
  useLayoutEffect(() => {
    const el = consoleRef.current;
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.set(el, { autoAlpha: 1, yPercent: 0 });
  }, [run]);

  // Lines the engine prints right after a run starts.
  useEffect(() => {
    const t = termRef.current;
    if (!t) return;
    if (scenario === "reboot") t.print(<SystemRestarted />);
    if (scenario === "shell") {
      t.login(initialUser);
      t.print(<SessionRestored user={initialUser} at={Date.now() - 36e5} />);
    }
    if (scenario === "busy") t.print(<BootStart />);
    // Only on a new run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  useEffect(() => () => killTimelines(), []);

  /* ---------------------------------------------------------------- */
  /* Engine stand-ins                                                  */
  /* ---------------------------------------------------------------- */

  const goLive = useCallback(() => {
    setPhase("live");
    setMode("shell");
    setRoomLit(true);
    setTermOpen(false);
    busy.current = false;
    note("live");
  }, [note]);

  function consoleBoot(fast: boolean, done: () => void, rows = true) {
    const el = consoleRef.current;
    const [first, step] = fast ? [0.15, 0.12] : [0.35, 0.32];
    const tl = gsap.timeline({ onComplete: done });
    if (!rows) {
      // First-visit session: no boot log, just the fade (engine: consoleBoot rows: false).
      tl.to(el, { autoAlpha: 0, duration: 0.7, ease: "power2.inOut" }, 0.1);
      timelines.current.push(tl);
      return;
    }
    // One beat per power-up stage, like the engine (useLabTimelines); a stage prints all its rows.
    RACK_BOOT.forEach((stage, k) =>
      tl.call(() => stage.rows.forEach((r) => term()?.print(<BootOk host={r.host} msg={r.msg} />)), [], first + k * step),
    );
    const end = first + RACK_BOOT.length * step;
    tl.call(() => term()?.print(<BootTarget />), [], end + 0.1);
    tl.to(el, { autoAlpha: 0, duration: 0.7, ease: "power2.inOut" }, end + (fast ? 0.5 : 0.6));
    timelines.current.push(tl);
  }

  function powerUp(user: string, fast: boolean, done: () => void) {
    // The real power-up lights the room for 5.7 s (0.95 s + 0.1 s hold in fast mode).
    setRoomLit(true);
    const tl = gsap.timeline({ onComplete: done });
    tl.call(() => term()?.print(<LabOnline user={user} />), [], fast ? 0.95 : 3.85);
    tl.to({}, { duration: fast ? 0.1 : 0.5 }, fast ? 0.95 : 5.2);
    timelines.current.push(tl);
  }

  function onBoot(skip: boolean, name: string) {
    if (busy.current) return;
    busy.current = true;
    const user = name || "guest";
    const wasAutoplay = fromAutoplay.current;
    fromAutoplay.current = false;
    setAutoplay(null);
    term()?.login(user);
    setPhase("booting");
    setMode("busy");
    note(`onBoot(skip=${skip}, ${user})${wasAutoplay ? " from autoplay" : ""}`);
    if (skip) {
      gsap.to(consoleRef.current, {
        autoAlpha: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => powerUp(user, true, goLive),
      });
      return;
    }
    if (!wasAutoplay) term()?.print(<BootStart />);
    consoleBoot(wasAutoplay, () => powerUp(user, false, goLive), !wasAutoplay);
  }

  function onExit(kind: "logout" | "reboot") {
    if (busy.current) return;
    busy.current = true;
    note(`onExit(${kind})`);
    const el = consoleRef.current;
    const tl = gsap.timeline({
      onComplete: () => {
        term()?.reset();
        if (kind === "reboot") term()?.print(<SystemRestarted />);
        setRoomLit(false);
        setTermOpen(false);
        setPhase("intro");
        setMode("intro");
        setFirstVisit(false);
        gsap.set(el, { yPercent: 0 });
        gsap.fromTo(
          el,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: 0.6,
            ease: "power2.out",
            onComplete: () => {
              if (finePointer()) term()?.focus();
            },
          },
        );
        busy.current = false;
      },
    });
    tl.to(el, { autoAlpha: 0, duration: 0.25 }, 0);
    tl.call(() => setRoomLit(false), [], 0.5);
    tl.to({}, { duration: 0.7 }, 0.5);
    timelines.current.push(tl);
  }

  const openTerm = useCallback(() => {
    const el = consoleRef.current;
    setTermOpen(true);
    gsap.fromTo(
      el,
      { autoAlpha: 1, yPercent: -100 },
      { yPercent: 0, duration: 0.35, ease: "power3.out", onComplete: () => termRef.current?.focus() },
    );
  }, []);

  const closeTerm = useCallback(() => {
    const el = consoleRef.current;
    setTermOpen(false);
    gsap.to(el, {
      yPercent: -100,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        gsap.set(el, { autoAlpha: 0 });
      },
    });
  }, []);

  function skipIntro() {
    if (phase === "intro") {
      setAutoplay(null);
      setMode("busy");
      busy.current = true;
      gsap.to(consoleRef.current, {
        autoAlpha: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => (firstVisit ? goLive() : powerUp(INTRO.defaultUser, true, goLive)),
      });
    } else if (phase === "booting") {
      timelines.current.forEach((t) => t.progress(1));
    }
    note("skip intro");
  }

  function backToPage() {
    killTimelines();
    gsap.set(consoleRef.current, { autoAlpha: 0 });
    setPhase("off");
    setMode("busy");
    note("back to the page");
  }

  // Live room keys: backtick toggles the shell (not while typing), Escape closes it.
  useEffect(() => {
    if (phase !== "live") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && termOpen) {
        closeTerm();
        return;
      }
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "`") {
        e.preventDefault();
        if (termOpen) closeTerm();
        else openTerm();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, termOpen, openTerm, closeTerm]);

  const live = phase === "live";
  const showControls = phase === "intro" || phase === "booting";

  return (
    <div className="relative min-h-[100svh] overflow-clip">
      {/* Page base stand-in (the real one is RoomSky). */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-background" />
      {roomLit ? (
        <p className="pointer-events-none fixed inset-x-0 top-1/2 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-white/25 motion-safe:animate-[lab-fade-in_0.6s_ease-out]">
          {live ? "room is live (simulated)" : "room powering up (simulated)"}
        </p>
      ) : null}
      {phase === "off" ? (
        <p className="fixed inset-x-0 top-1/2 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">
          classic view (simulated)
        </p>
      ) : null}

      <div
        ref={consoleRef}
        data-term=""
        className={
          live
            ? "fixed inset-x-0 top-0 z-[55] h-[min(58svh,34rem)] border-b border-white/10 opacity-0 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95)]"
            : "fixed inset-x-0 top-0 z-30 h-[100svh] opacity-0"
        }
      >
        <Terminal
          key={run}
          ref={termRef}
          mode={mode}
          autoplay={autoplay}
          onBoot={onBoot}
          onExit={onExit}
          onClose={closeTerm}
          onCommand={(cmd, arg) => note(`cmd ${cmd}${arg ? " " + arg : ""}`)}
        />
      </div>

      {showControls ? (
        <div className="fixed right-5 top-5 z-[60] flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.25em] sm:right-8 sm:top-7">
          {!firstVisit ? (
            <button type="button" onClick={backToPage} className="text-white/40 transition-colors hover:text-white/85">
              back to the page
            </button>
          ) : null}
          <button type="button" onClick={skipIntro} className="text-white/40 transition-colors hover:text-white/85">
            skip intro →
          </button>
        </div>
      ) : null}

      {live && !termOpen ? (
        <button
          type="button"
          onClick={openTerm}
          className="key fixed bottom-6 left-5 z-40 text-[12px] motion-safe:animate-[lab-fade-in_0.6s_ease-out_0.4s_backwards]"
        >
          <span className="text-white/60">›_</span> terminal
        </button>
      ) : null}

      {bare ? null : (
        <div className="fixed bottom-3 left-1/2 z-[80] w-[min(94vw,46rem)] -translate-x-1/2 rounded-lg border border-line-strong bg-card/90 p-2 font-mono text-[11px] text-gray-1 shadow-[0_24px_70px_-16px_rgba(0,0,0,0.95)]">
          <div className="flex flex-wrap items-center gap-1.5">
            {SCENARIOS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => start(s)}
                className={`rounded border px-2 py-1 ${
                  s === scenario ? "border-white/40 text-white" : "border-white/10 hover:border-white/30"
                }`}
              >
                {SCENARIO_LABEL[s]}
              </button>
            ))}
            {mode === "busy" && phase !== "off" ? (
              <button
                type="button"
                onClick={() => consoleBoot(false, () => undefined)}
                className="rounded border border-white/10 px-2 py-1 hover:border-white/30"
              >
                print boot log
              </button>
            ) : null}
            {live ? (
              <button
                type="button"
                onClick={() => (termOpen ? closeTerm() : openTerm())}
                className="rounded border border-white/10 px-2 py-1 hover:border-white/30"
              >
                {termOpen ? "close shell" : "open shell"}
              </button>
            ) : null}
          </div>
          <p className="mt-1.5 truncate text-white/40">
            phase {phase} · mode {mode}
            {autoplay ? ` · autoplay ${autoplay}` : ""}
            {log.length ? ` · ${log.join(" › ")}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
