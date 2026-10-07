/**
 * Debian apt and dpkg output for the portfolio package (docs/OWNER-NOTES.md,
 * "First-visit intro sequence"). The first-visit session prints the install
 * transcript line by line; the shell prints the short replies (already the
 * newest version, the dpkg lock error without sudo, update and upgrade).
 *
 * Wording follows apt 2.x and dpkg as printed on a Debian tty. Numbers and
 * names come from PORTFOLIO_PACKAGE; no dependency packages are invented.
 */

import type { ReactNode } from "react";
import { INTRO, PORTFOLIO_PACKAGE } from "@/content";

const PKG = PORTFOLIO_PACKAGE;

/** One line of program output (dim, keeps leading spaces, wraps long tokens). */
export function Out({ children }: { children: ReactNode }) {
  return <p className="whitespace-pre-wrap break-words text-gray-2">{children}</p>;
}

/** An `E:` line (alert red). */
function Err({ children }: { children: ReactNode }) {
  return <p className="whitespace-pre-wrap break-words text-alert">{children}</p>;
}

/* ------------------------------------------------------------------------ */
/* Transcript text                                                           */
/* ------------------------------------------------------------------------ */

/** The three dependency-solver stages apt reports before anything else. */
export const APT_READING = ["Reading package lists... ", "Building dependency tree... ", "Reading state information... "] as const;

const SUMMARY_NONE = "0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.";

/** Install of the package, in the order apt and dpkg print it. */
export const APT_INSTALL = {
  newHeader: "The following NEW packages will be installed:",
  newList: `  ${PKG.name}`,
  summary: "0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.",
  needToGet: `Need to get ${PKG.download} of archives.`,
  afterThis: `After this operation, ${PKG.installed} of additional disk space will be used.`,
  get: `Get:1 ${PKG.repo} ${PKG.suite} ${PKG.arch} ${PKG.name} ${PKG.arch} ${PKG.version} [${PKG.download}]`,
  fetched: `Fetched ${PKG.download} in 0s (${PKG.rate})`,
  selecting: `Selecting previously unselected package ${PKG.name}.`,
  /** dpkg rewrites this line with a percentage before the final count. */
  dbPrefix: "(Reading database ... ",
  db: `(Reading database ... ${PKG.dbFiles} files and directories currently installed.)`,
  preparing: `Preparing to unpack .../${PKG.name}_${PKG.version}_${PKG.arch}.deb ...`,
  unpacking: `Unpacking ${PKG.name} (${PKG.version}) ...`,
  settingUp: `Setting up ${PKG.name} (${PKG.version}) ...`,
} as const;

/** "Reading package lists... Done" and the two stages after it. */
function readingDone(): ReactNode[] {
  return APT_READING.map((stage) => <Out key={stage}>{stage}Done</Out>);
}

/* ------------------------------------------------------------------------ */
/* Bottom progress row                                                       */
/* ------------------------------------------------------------------------ */

/**
 * apt's Dpkg::Progress-Fancy status row, "Progress: [ 40%] [####......]",
 * drawn on the last row while dpkg runs. The label sits on the accent (apt
 * draws it black on green); the bar fills the row like apt does: its width
 * is the terminal columns minus the label and four columns of padding.
 */
export function AptProgress({ pct, cols }: { pct: number; cols: number }) {
  const label = `Progress: [${String(Math.floor(pct)).padStart(3, " ")}%]`;
  const inner = Math.max(8, cols - 4 - label.length - 2);
  const done = Math.max(0, Math.min(inner, Math.floor((pct / 100) * inner)));
  return (
    <p className="whitespace-pre">
      <span className="bg-mint text-console">{label}</span>
      {` [${"#".repeat(done)}${".".repeat(inner - done)}]`}
    </p>
  );
}

/* ------------------------------------------------------------------------ */
/* Shell replies                                                             */
/* ------------------------------------------------------------------------ */

const WRITE_OPS = new Set(["install", "reinstall", "remove", "purge", "autoremove", "upgrade", "full-upgrade", "dist-upgrade"]);
/** What the guest account may run through sudo (everything else gets sudo's refusal). */
const SUDO_OPS = new Set(["install", "update", "upgrade", "full-upgrade", "dist-upgrade"]);

/** sudo's refusal for a command the sudoers entry does not allow. */
export function sudoRefusal(user: string, command: string): ReactNode {
  return (
    <p className="whitespace-pre-wrap break-words">
      Sorry, user {user} is not allowed to execute &apos;{command}&apos; as root on {INTRO.hostname}.
    </p>
  );
}

/**
 * `apt` / `apt-get` with lower-cased words after the command. `root` is true
 * when it ran through sudo (credentials are still cached from the intro, so
 * no password prompt).
 */
export function aptReply(words: readonly string[], root: boolean, user: string, bin = "apt"): ReactNode[] {
  const [op = "", ...args] = words;
  if (!op) return [<Out key="usage">Usage: {bin} [options] command</Out>];

  if (op === "update") {
    if (!root) {
      return [
        <Out key="read">Reading package lists... Done</Out>,
        <Err key="lock">E: Could not open lock file /var/lib/apt/lists/lock - open (13: Permission denied)</Err>,
        <Err key="dir">E: Unable to lock directory /var/lib/apt/lists/</Err>,
      ];
    }
    return [
      <Out key="hit">Hit:1 {PKG.repo} {PKG.suite.split("/")[0]} InRelease</Out>,
      ...readingDone(),
      <Out key="ok">All packages are up to date.</Out>,
    ];
  }

  if (!WRITE_OPS.has(op)) return [<Err key="op">E: Invalid operation {op}</Err>];

  if (!root) {
    return [
      <Err key="open">E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)</Err>,
      <Err key="lock">E: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), are you root?</Err>,
    ];
  }
  if (!SUDO_OPS.has(op)) return [sudoRefusal(user, ["/usr/bin/" + bin, ...words].join(" "))];

  if (op !== "install") {
    return [...readingDone(), <Out key="calc">Calculating upgrade... Done</Out>, <Out key="sum">{SUMMARY_NONE}</Out>];
  }
  const pkgs = args.filter((a) => !a.startsWith("-"));
  const unknown = pkgs.find((p) => p !== PKG.name);
  if (unknown) return [...readingDone(), <Err key="missing">E: Unable to locate package {unknown}</Err>];
  if (pkgs.length === 0) return [...readingDone(), <Out key="sum">{SUMMARY_NONE}</Out>];
  return [
    ...readingDone(),
    <Out key="newest">
      {PKG.name} is already the newest version ({PKG.version}).
    </Out>,
    <Out key="sum">{SUMMARY_NONE}</Out>,
  ];
}
