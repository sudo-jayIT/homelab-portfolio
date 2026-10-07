"use client";

/**
 * The black tty console shared by the first-visit intro, the login screen and
 * the in-room shell (spec 01 sections 2.5, 5.4 to 5.9).
 *
 * Modes: "intro" (login prompt or logged-in pre-boot prompt), "shell" (the
 * room drop-down, with the footer bar) and "busy" (no prompt, just a bare
 * blinking caret while an animation owns the scene). The engine renders it
 * in "busy" on the server so markup matches before the intro gate runs.
 *
 * First-visit autoplay: plays the session in session.tsx (login, sudo apt
 * install, cd, pf-whoami), then calls onBoot. While it runs, the cursor line
 * can show program text instead of the prompt (`live`) and apt's progress
 * row sits at the bottom; both only render while autoplay is set, so a skip
 * drops them with the pending timers.
 *
 * Imperative handle (React 19 ref prop): print, clear, focus, login, reset.
 */

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import type { TerminalProps } from "@/components/lab/contracts";
import { INTRO } from "@/content";
import { readSession } from "@/lib/lab-session";
import { AptProgress } from "./apt";
import { complete, parseLine, runCommand } from "./commands";
import { NBSP, sanitizeUser } from "./format";
import { Banner, Prompt, PromptEcho, TtyHeader, promptText } from "./lines";
import { firstVisitSession, type SessionAction } from "./session";

interface Entry {
  id: number;
  node: ReactNode;
}

/** Entries kept before a new batch is appended (the batch itself is never cut). */
const SCROLLBACK = 200;
const HISTORY_MAX = 50;

/** Delay between "Enter as guest" and the boot call. */
const GUEST_BOOT_DELAY = 650;

/** Console type: 13 px under md, 14 px from md, line height 1.6 (spec 01 section 3.2). */
const CONSOLE_TYPE = "font-mono text-[13px] leading-[1.6] md:text-[14px]";
/**
 * Below md the session outgrows the screen and scrolls; lines that scroll up
 * fade out under the top-right intro controls (the first line sits at 64 px,
 * below the fade, so nothing is masked until the scroller moves).
 */
const INTRO_TOP_FADE = "max-md:[mask-image:linear-gradient(to_bottom,transparent_40px,#000_64px)]";
const CARET = "inline-block w-[0.6em] border-b-2 border-mint";
const CARET_BLINK = "motion-safe:animate-[lab-caret_1.05s_steps(1)_infinite]";

/** Character columns that fit in the scroller's content box (apt sizes its progress bar to them). */
function measureCols(el: HTMLElement | null): number {
  if (!el) return 80;
  const cs = getComputedStyle(el);
  const probe = document.createElement("span");
  probe.textContent = "0".repeat(40);
  probe.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:${cs.font}`;
  document.body.appendChild(probe);
  const ch = probe.getBoundingClientRect().width / 40;
  probe.remove();
  const width = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  return ch > 0 ? Math.max(24, Math.floor(width / ch)) : 80;
}

export function Terminal({ mode, autoplay = null, onBoot, onExit, onClose, onCommand, ref }: TerminalProps) {
  const [lines, setLines] = useState<Entry[]>(() => [{ id: -1, node: <TtyHeader /> }]);
  const [user, setUser] = useState<string | null>(null);
  const [input, setInput] = useState("");
  /** Newest first, at most HISTORY_MAX. */
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [focused, setFocused] = useState(false);
  /** Working directory: "~" (home) or an absolute path. */
  const [cwd, setCwd] = useState("~");
  /** Autoplay cursor line: null shows the prompt, a string replaces it ("" = bare caret). */
  const [live, setLive] = useState<string | null>(null);
  /** Autoplay apt progress row. */
  const [progress, setProgress] = useState<{ pct: number; cols: number } | null>(null);

  const nextId = useRef(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const guestTimer = useRef<number | null>(null);

  const busy = mode === "busy";
  const shell = mode === "shell";
  const prompt = promptText(user, cwd);
  const liveLine = autoplay ? live : null;
  const aptRow = autoplay ? progress : null;

  /* ---------------------------------------------------------------- */
  /* Scrollback                                                        */
  /* ---------------------------------------------------------------- */

  const print = useCallback((...nodes: ReactNode[]) => {
    const batch = nodes.map((node) => ({ id: nextId.current++, node }));
    setLines((prev) => [...prev.slice(-SCROLLBACK), ...batch]);
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const resetScreen = useCallback(() => {
    setLines([{ id: nextId.current++, node: <TtyHeader /> }]);
  }, []);

  const focus = useCallback(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  /** The input unmounts in busy mode without a blur event; drop the focus flag with it. */
  const attachInput = useCallback((el: HTMLInputElement | null) => {
    inputRef.current = el;
    if (!el) setFocused(false);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      print,
      clear,
      focus,
      login(name: string) {
        setUser((u) => u ?? name);
        setInput("");
      },
      reset() {
        setUser(null);
        setInput("");
        setCwd("~");
        resetScreen();
      },
    }),
    [print, clear, focus, resetScreen],
  );

  // Keep the newest line in view whenever lines, the mode, the cursor line or
  // the progress row (which shortens the scroller) change.
  const hasAptRow = aptRow !== null;
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, mode, liveLine, hasAptRow]);

  // Pull focus to the prompt on fine pointers (never pops a phone keyboard).
  useEffect(() => {
    if (mode !== "busy" && window.matchMedia("(pointer: fine)").matches) focus();
  }, [mode, focus]);

  // Cancel a pending "Enter as guest" boot on unmount.
  useEffect(() => {
    const timer = guestTimer;
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /* First-visit autoplay (session.tsx)                                */
  /* ---------------------------------------------------------------- */

  const bootFromAutoplay = useEffectEvent((name: string) => onBoot(false, name));

  useEffect(() => {
    if (!autoplay) return;
    const name = autoplay;
    // A visitor who logged out earlier sees their previous login time.
    const prev = readSession()?.at ?? 0;
    const now = Date.now();
    const beats = firstVisitSession(name, prev > 0 && prev < now ? prev : now);

    const apply = (a: SessionAction) => {
      switch (a.kind) {
        case "input":
          return setInput(a.text);
        case "live":
          return setLive(a.text);
        case "print":
          return print(...a.nodes);
        case "user":
          return setUser(a.name);
        case "cwd":
          return setCwd(a.dir);
        case "progress":
          return setProgress(a.pct === null ? null : { pct: a.pct, cols: measureCols(scrollerRef.current) });
        case "boot":
          return bootFromAutoplay(name);
      }
    };
    // One timer per beat: its actions render together.
    const timers = beats.map((b) => window.setTimeout(() => b.actions.forEach(apply), b.at));

    // Skipping (autoplay reset to null) or unmounting drops pending beats.
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      setLive(null);
      setProgress(null);
    };
  }, [autoplay, print]);

  /* ---------------------------------------------------------------- */
  /* Submit                                                            */
  /* ---------------------------------------------------------------- */

  function loginAs(raw: string): string {
    const name = sanitizeUser(raw);
    setUser(name);
    print(<PromptEcho prompt={promptText(null)} text={raw} />, <Banner user={name} at={Date.now()} />);
    return name;
  }

  function submit(raw: string) {
    if (!user) {
      loginAs(raw);
      return;
    }
    const parsed = parseLine(raw);
    print(<PromptEcho prompt={prompt} text={parsed.line} />);
    if (!parsed.line) {
      if (mode === "intro") onBoot(false, user);
      return;
    }
    const before = history;
    setHistory([parsed.line, ...before.slice(0, HISTORY_MAX - 1)]);
    setHistIdx(-1);
    onCommand?.(parsed.cmd, parsed.arg);
    runCommand(parsed, {
      mode,
      user,
      cwd,
      history: before,
      print,
      clear,
      chdir: setCwd,
      logout() {
        setUser(null);
        setCwd("~");
        resetScreen();
      },
      boot: (skip) => onBoot(skip, user),
      exit: onExit,
    });
  }

  function onKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (autoplay) {
      e.preventDefault();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      submit(input);
      setInput("");
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (!user) return;
      const result = complete(input, prompt);
      if (!result) return;
      if ("replace" in result) setInput(result.replace);
      else print(...result.list);
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      clear();
    } else if (e.key === "ArrowUp" && user) {
      e.preventDefault();
      const i = Math.min(histIdx + 1, history.length - 1);
      if (history[i] !== undefined) {
        setHistIdx(i);
        setInput(history[i]);
      }
    } else if (e.key === "ArrowDown" && user) {
      e.preventDefault();
      const i = histIdx - 1;
      setHistIdx(i < 0 ? -1 : i);
      setInput(i < 0 ? "" : history[i]);
    }
  }

  // Login screen: typing anywhere lands in the prompt, Enter submits it.
  const onWindowKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const el = inputRef.current;
    const active = document.activeElement;
    if (!el || active === el || (active && active !== document.body)) return;
    if (e.key === "Enter") {
      e.preventDefault();
      el.focus({ preventScroll: true });
      if (autoplay) return;
      submit(input);
      setInput("");
    } else if (e.key.length === 1) {
      el.focus({ preventScroll: true });
    }
  });

  useEffect(() => {
    if (mode !== "intro") return;
    const handler = (e: KeyboardEvent) => onWindowKey(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode]);

  function enterAsGuest(e: ReactMouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    const name = user ?? loginAs("");
    if (guestTimer.current !== null) window.clearTimeout(guestTimer.current);
    guestTimer.current = window.setTimeout(() => {
      guestTimer.current = null;
      onBoot(false, name);
    }, GUEST_BOOT_DELAY);
  }

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <div
      className="relative flex h-full w-full flex-col bg-console text-left"
      onClick={() => {
        if (!busy) focus();
      }}
    >
      <div
        ref={scrollerRef}
        aria-live="polite"
        aria-busy={autoplay ? true : undefined}
        className={`flex-1 cursor-text overflow-y-auto ${CONSOLE_TYPE} text-gray-1 [scrollbar-color:rgba(61,252,154,0.22)_transparent] [scrollbar-width:thin] ${
          shell ? "px-5 py-4 md:px-8" : `px-5 pb-5 pt-16 md:px-10 md:py-8 ${INTRO_TOP_FADE}`
        }`}
      >
        {lines.map((entry) => (
          <div key={entry.id}>{entry.node}</div>
        ))}
        {busy ? (
          <span className={`${CARET} ${CARET_BLINK}`}>{NBSP}</span>
        ) : (
          <p className="relative whitespace-pre-wrap break-words">
            {liveLine === null ? (
              <>
                <Prompt>{prompt}</Prompt>
                {input}
              </>
            ) : (
              liveLine
            )}
            <span aria-hidden="true" className={`${CARET} translate-y-[0.1em] ${focused ? CARET_BLINK : "opacity-40"}`}>
              {NBSP}
            </span>
            <input
              ref={attachInput}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              readOnly={!!autoplay}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="absolute inset-0 h-full w-full cursor-text bg-transparent text-[16px] text-transparent caret-transparent opacity-0 outline-none"
              aria-label={user ? "Terminal input" : "Login name"}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
            />
          </p>
        )}
      </div>

      {aptRow ? (
        <div aria-hidden="true" className={`shrink-0 px-5 pb-5 text-gray-1 md:px-10 md:pb-8 ${CONSOLE_TYPE}`}>
          <AptProgress pct={aptRow.pct} cols={aptRow.cols} />
        </div>
      ) : null}

      {mode === "intro" && !autoplay ? (
        <div className="pointer-events-none flex items-center justify-between gap-3 px-5 pb-5 font-mono text-[11px] text-gray-3 md:px-10 md:pb-8">
          <button
            type="button"
            onClick={enterAsGuest}
            className="key key-light pointer-events-auto hidden w-full [@media(pointer:coarse)]:inline-flex"
          >
            Enter as guest
          </button>
          <span className="ml-auto [@media(pointer:coarse)]:hidden">
            {user ? "type help, or press enter to power on the lab" : "type any name and press enter (or just enter)"}
          </span>
        </div>
      ) : null}

      {shell && onClose ? (
        <div className="flex items-center justify-between border-t border-line px-5 py-1.5 font-mono text-[11px] text-gray-3 md:px-8">
          <span>
            {INTRO.tty} · {INTRO.hostname}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="hover:text-gray-1"
          >
            close <span className="text-gray-3/70">(` or esc)</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
