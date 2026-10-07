/**
 * The first-visit session the terminal autoplay plays after hydration
 * (docs/OWNER-NOTES.md, "First-visit intro sequence"):
 *
 *   homelab login: guest              Last login: ... on tty1
 *   guest@homelab:~$ sudo apt install kris-portfolio
 *   [sudo] password for guest:        (no echo), then apt and dpkg output
 *   guest@homelab:~$ cd /opt/kris-portfolio
 *   guest@homelab:/opt/kris-portfolio$ pf-whoami
 *   ...summary...                     launching kris-portfolio ...
 *
 * then hands over to the engine (onBoot), which fades the console and powers
 * the room up. The script is plain data: beats at fixed times, each running
 * its actions in one timer callback so React renders them together. Keystroke
 * delays come from a seeded generator (45 to 63 ms), so every visit plays
 * the same and nothing random reaches render.
 */

import type { ReactNode } from "react";
import { PORTFOLIO_PACKAGE } from "@/content";
import { mulberry32 } from "@/lib/rng";
import { APT_INSTALL, APT_READING, Out } from "./apt";
import { LastLogin, Launching, PfWhoami, PromptEcho, promptText } from "./lines";

/** One change the terminal applies. */
export type SessionAction =
  /** Text in the prompt's input (the typed command so far). */
  | { kind: "input"; text: string }
  /** The cursor line: null shows the prompt, a string replaces it ("" = bare caret while a program runs). */
  | { kind: "live"; text: string | null }
  | { kind: "print"; nodes: ReactNode[] }
  /** Login accepted: the prompt becomes "{user}@host:~$ ". */
  | { kind: "user"; name: string }
  | { kind: "cwd"; dir: string }
  /** apt's bottom progress row; null removes it. */
  | { kind: "progress"; pct: number | null }
  /** Hand over to the engine (onBoot). */
  | { kind: "boot" };

export interface SessionBeat {
  /** ms after the autoplay started (hydration). */
  at: number;
  actions: SessionAction[];
}

/** Session timings in ms. Keystrokes are 45 to 63 ms (keyDelays). */
export const SESSION_TIMING = {
  /** Autoplay start to the login name; its first keystroke lands at start + nameChar (spec 01 section 4.1). */
  start: 300,
  /** Login name keystrokes. */
  nameChar: 55,
  /** Last name keystroke to the accepted login. */
  afterName: 140,
  /** Fresh prompt to the first keystroke of the next command. */
  think: 220,
  /** Last keystroke to Enter. */
  enter: 110,
  /** sudo's silent password entry. */
  password: 360,
  /** pf-whoami's start-up before it prints. */
  whoami: 70,
  /** Summary to the launch line. */
  launch: 180,
  /** Launch line to the hand-off. */
  boot: 200,
} as const;

/** apt and dpkg pacing after the password: the delay in ms before each beat. */
const APT_PACE = {
  lists: 170,
  tree: 130,
  state: 80,
  get: 150,
  fetched: 200,
  selecting: 90,
  dbPercent: 50,
  db: 70,
  preparing: 60,
  unpacking: 130,
  unpacked: 150,
  settingUp: 110,
  done: 160,
} as const;

/** Seeds of the three typed commands (any fixed numbers). */
const SEED = { install: 0x5ad0, cd: 0xcd02, whoami: 0x3e11 } as const;

/**
 * Per-keystroke delays for `text`: 45 to 57 ms, plus 6 ms after a space or a
 * slash (a word boundary), so 45 to 63 ms in all.
 */
export function keyDelays(text: string, seed: number): number[] {
  const r = mulberry32(seed);
  return Array.from(text, (_, i) => {
    const prev = text[i - 1];
    return 45 + Math.floor(r() * 13) + (prev === " " || prev === "/" ? 6 : 0);
  });
}

/**
 * Build the session for `user`. `lastLogin` (epoch ms) is captured by the
 * caller in an effect, never during render.
 */
export function firstVisitSession(user: string, lastLogin: number): SessionBeat[] {
  const T = SESSION_TIMING;
  const P = PORTFOLIO_PACKAGE;
  const beats: SessionBeat[] = [];
  let t = 0;
  const beat = (wait: number, ...actions: SessionAction[]) => {
    t += wait;
    beats.push({ at: t, actions });
  };
  const print = (...nodes: ReactNode[]): SessionAction => ({ kind: "print", nodes });
  const live = (text: string | null): SessionAction => ({ kind: "live", text });
  const progress = (pct: number | null): SessionAction => ({ kind: "progress", pct });
  const type = (text: string, delays: readonly number[]) =>
    delays.forEach((d, i) => beat(d, { kind: "input", text: text.slice(0, i + 1) }));
  /** Think, type, press Enter: the input clears and the line is echoed with the prompt it was typed at. */
  const command = (prompt: string, text: string, seed: number, ...after: SessionAction[]) => {
    t += T.think;
    type(text, keyDelays(text, seed));
    beat(T.enter, { kind: "input", text: "" }, print(<PromptEcho prompt={prompt} text={text} />), ...after);
  };

  // 1. Login (no service banner), then the last login line.
  t = T.start;
  type(user, Array.from(user, () => T.nameChar));
  beat(
    T.afterName,
    { kind: "input", text: "" },
    print(<PromptEcho prompt={promptText(null)} text={user} />, <LastLogin at={lastLogin} />),
    { kind: "user", name: user },
  );

  // 2. sudo apt install: password prompt without echo, then apt and dpkg.
  const sudoAsk = `[sudo] password for ${user}: `;
  command(promptText(user), `sudo apt install ${P.name}`, SEED.install, live(sudoAsk));
  const A = APT_INSTALL;
  const [lists, tree, state] = APT_READING;
  beat(T.password, print(<p className="whitespace-pre-wrap">{sudoAsk}</p>), live(lists));
  beat(APT_PACE.lists, print(<Out>{lists}Done</Out>), live(tree));
  beat(APT_PACE.tree, print(<Out>{tree}Done</Out>), live(state));
  beat(
    APT_PACE.state,
    print(
      <Out>{state}Done</Out>,
      <Out>{A.newHeader}</Out>,
      <Out>{A.newList}</Out>,
      <Out>{A.summary}</Out>,
      <Out>{A.needToGet}</Out>,
      <Out>{A.afterThis}</Out>,
    ),
    live(""),
  );
  beat(APT_PACE.get, print(<Out>{A.get}</Out>));
  beat(APT_PACE.fetched, print(<Out>{A.fetched}</Out>));
  beat(APT_PACE.selecting, print(<Out>{A.selecting}</Out>), progress(0));
  beat(APT_PACE.dbPercent, live(`${A.dbPrefix}60%`));
  beat(APT_PACE.db, print(<Out>{A.db}</Out>), live(""));
  beat(APT_PACE.preparing, print(<Out>{A.preparing}</Out>), progress(20));
  beat(APT_PACE.unpacking, print(<Out>{A.unpacking}</Out>), progress(40));
  beat(APT_PACE.unpacked, progress(60));
  beat(APT_PACE.settingUp, print(<Out>{A.settingUp}</Out>), progress(80));
  beat(APT_PACE.done, progress(null), live(null));

  // 3. cd into the install directory; the prompt path follows.
  command(promptText(user), `cd ${P.dir}`, SEED.cd, { kind: "cwd", dir: P.dir });

  // 4. pf-whoami, the launch line, then the engine takes over.
  command(promptText(user, P.dir), P.bin, SEED.whoami, live(""));
  beat(T.whoami, print(<PfWhoami />));
  beat(T.launch, print(<Launching />));
  beat(T.boot, { kind: "boot" });
  return beats;
}
