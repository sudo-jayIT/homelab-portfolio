/**
 * Printed line templates for the tty console (spec 01 section 2.6).
 *
 * Every entry passed to TerminalHandle.print() is wrapped in its own <div> by
 * the terminal, so a bare <Dim> span still sits on its own line. The engine
 * (B4) prints BootStart, BootOk, BootTarget, LabOnline, SessionRestored and
 * SystemRestarted (names and props fixed by TerminalLineProps in contracts).
 * The first-visit session (session.tsx) prints LastLogin, PfWhoami and
 * Launching; the shell prints PfWhoami for `pf-whoami`.
 *
 * No hooks and no clock reads in here: anything time based arrives as a prop
 * (epoch ms) that the caller captured when it printed the line.
 */

import { Fragment, type ReactNode } from "react";
import type { TerminalLineProps } from "@/components/lab/contracts";
import { INTRO, PF_WHOAMI, PORTFOLIO_PACKAGE, type WhoamiPart } from "@/content";
import { NBSP, sessionStamp, ttyStamp } from "./format";

const HOST = INTRO.hostname;

/* ------------------------------------------------------------------------ */
/* Inline atoms                                                              */
/* ------------------------------------------------------------------------ */

/** Bold ink run (owner name, user name, keywords). */
export function Bold({ children }: { children: ReactNode }) {
  return <span className="font-bold text-title">{children}</span>;
}

/** Bold mint run: the login and shell prompts ("user@host:~$ "). */
export function Prompt({ children }: { children: ReactNode }) {
  return <span className="font-bold text-mint">{children}</span>;
}

/**
 * Muted run (kernel line, descriptions, misc output). gray-2 rather than the
 * spec's gray-3: these runs carry content (service roles, help text), and
 * gray-3 (3.1:1) is reserved for decoration.
 */
export function Dim({ children }: { children: ReactNode }) {
  return <span className="text-gray-2">{children}</span>;
}

/** Underlined ink link (mint underline); new tab except mailto and site-relative links. */
export function TermLink({ href, children }: { href: string; children: ReactNode }) {
  // mailto stays in place; everything else (profiles, the resume PDF) opens a new tab.
  const local = href.startsWith("mailto");
  return (
    <a
      href={href}
      target={local ? undefined : "_blank"}
      rel="noopener noreferrer"
      className="text-title underline decoration-mint/40 underline-offset-2 hover:decoration-mint"
    >
      {children}
    </a>
  );
}

/** Blank console line: a <p> holding a single NBSP so it keeps its height. */
export function Blank() {
  return <p>{NBSP}</p>;
}

/* ------------------------------------------------------------------------ */
/* Prompt strings                                                            */
/* ------------------------------------------------------------------------ */

/**
 * "{host} login: " before login, "{user}@{host}:{cwd}$ " after (host from
 * SITE.host). cwd is "~" for the home directory, otherwise an absolute path.
 */
export function promptText(user: string | null, cwd = "~"): string {
  return user ? `${user}@${HOST}:${cwd}$ ` : `${HOST} login: `;
}

/* ------------------------------------------------------------------------ */
/* Terminal-internal blocks                                                  */
/* ------------------------------------------------------------------------ */

/** Always the first entry: distro line plus a blank line. */
export function TtyHeader() {
  return (
    <div>
      <p>{INTRO.distroLine}</p>
      <Blank />
    </div>
  );
}

/** Echo of a submitted line (login name or command): mint prompt, then the raw text. */
export function PromptEcho({ prompt, text }: { prompt: string; text: string }) {
  return (
    <p className="whitespace-pre-wrap break-words">
      <Prompt>{prompt}</Prompt>
      {text}
    </p>
  );
}

/** Login banner: kernel, owner line, service rows, last login, welcome. */
export function Banner({ user, at }: { user: string; at: number }) {
  return (
    <div className="mb-1">
      <Dim>{INTRO.kernelLine}</Dim>
      <Blank />
      <p>
        {"  "}
        <Bold>{INTRO.ownerName}</Bold>
        {INTRO.bannerTagline}
      </p>
      {INTRO.services.map(({ unit, short }) => (
        <p key={unit} className="flex">
          <span className="shrink-0 whitespace-pre">
            {"  "}
            <span className="text-mint">●</span> {unit.padEnd(11, " ")}
          </span>
          <Dim>{short}</Dim>
        </p>
      ))}
      <Blank />
      <LastLogin at={at} />
      <p className="whitespace-pre-wrap">
        {"  "}welcome, <Bold>{user}</Bold>. type <Bold>help</Bold>, or press <Bold>enter</Bold> to power on the lab.
      </p>
      <Blank />
    </div>
  );
}

/** "Last login: Www Mmm DD HH:MM:SS YYYY on tty1" (login banner and the first-visit session). */
export function LastLogin({ at }: { at: number }) {
  return (
    <p className="whitespace-pre-wrap">
      Last login: {ttyStamp(at)} on {INTRO.tty}
    </p>
  );
}

/* ------------------------------------------------------------------------ */
/* pf-whoami                                                                 */
/* ------------------------------------------------------------------------ */

/** Key column of a pf-whoami row: two spaces, the dot, the key padded to 9 (13 columns). */
const WHOAMI_KEY = 9;

/** One value part; a part with a short form swaps it in below md. */
function Part({ part }: { part: WhoamiPart }) {
  if (!part.short) return <>{part.text}</>;
  return (
    <>
      <span className="md:hidden">{part.short}</span>
      <span className="hidden md:inline">{part.text}</span>
    </>
  );
}

/**
 * `pf-whoami`: bold name, dim role line, then one row per status with a
 * mint dot. Values hang under their column; each part is an inline-block,
 * so a row that does not fit breaks after a " · " instead of inside a part.
 */
export function PfWhoami() {
  return (
    <div>
      <p>
        <Bold>{PF_WHOAMI.name}</Bold>
      </p>
      <p className="text-gray-2">{PF_WHOAMI.role}</p>
      {PF_WHOAMI.rows.map(({ key, parts }) => (
        <p key={key} className="flex">
          <span className="shrink-0 whitespace-pre">
            {"  "}
            <span aria-hidden="true" className="text-mint">
              ●
            </span>{" "}
            <span className="text-gray-2">{key.padEnd(WHOAMI_KEY, " ")}</span>
          </span>
          <span className="min-w-0">
            {parts.map((part, i) => (
              <Fragment key={i}>
                {i > 0 ? <span className="text-gray-2">{" · "}</span> : null}
                <span className="inline-block">
                  <Part part={part} />
                </span>
              </Fragment>
            ))}
          </span>
        </p>
      ))}
    </div>
  );
}

/** Last line of the first-visit session, right before the console fades. */
export function Launching() {
  return <p className="mt-1 text-gray-2">launching {PORTFOLIO_PACKAGE.name} ...</p>;
}

/* ------------------------------------------------------------------------ */
/* Engine-printed lines (TerminalLineProps)                                  */
/* ------------------------------------------------------------------------ */

/** "powering on the homelab…" (dim). */
export function BootStart() {
  return <p className="text-gray-2">powering on the homelab…</p>;
}

/** "[  OK  ] host        msg" with a hanging indent when the message wraps. */
export function BootOk({ host, msg }: TerminalLineProps["BootOk"]) {
  return (
    <p className="flex text-gray-2">
      <span className="shrink-0 whitespace-pre">
        [<span className="text-mint">{"  OK  "}</span>] <span className="text-title/90">{host.padEnd(11, " ")}</span>{" "}
      </span>
      <span>{msg}</span>
    </p>
  );
}

/** "[  OK  ] Reached target graphical.target - the room." */
export function BootTarget() {
  return (
    <p className="whitespace-pre-wrap text-gray-2">
      [<span className="text-mint">{"  OK  "}</span>] Reached target <span className="text-title/90">graphical.target</span> - the room.
    </p>
  );
}

/** Printed into the (already hidden) console when the room finishes lighting up. */
export function LabOnline({ user }: TerminalLineProps["LabOnline"]) {
  return <p className="mt-1 text-title">lab online. welcome, {user}.</p>;
}

/** Entering the room later with a saved session: last login, welcome back, blank. */
export function SessionRestored({ user, at }: TerminalLineProps["SessionRestored"]) {
  return (
    <>
      <p>
        Last login: {sessionStamp(at)} on {INTRO.tty}
      </p>
      <p>
        session restored. welcome back, <Bold>{user}</Bold>. type <Bold>help</Bold> to look around.
      </p>
      <Blank />
    </>
  );
}

/** Shown under the tty header on the login screen after `reboot`. */
export function SystemRestarted() {
  return <p className="text-gray-2">System restarted.</p>;
}
