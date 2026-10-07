/**
 * Shell command table and renderers (spec 01 sections 5.5 to 5.7).
 *
 * Output formats follow the spec; the text comes from the content modules
 * (read-only here). `runCommand` is called by the terminal after it has
 * echoed the line and recorded it in history.
 *
 * Added with the apt intro: `pf-whoami` (in help), and the hidden `cd` (a
 * small directory model: ~, /opt/kris-portfolio and their parents), `apt` /
 * `apt-get` and `sudo` (the guest account may only run apt through sudo; apt
 * replies live in apt.tsx).
 */

import type { ReactNode } from "react";
import type { TerminalMode } from "@/components/lab/contracts";
import {
  CLUSTER_HOSTS,
  CLUSTER_SERVICE_COUNT,
  CONTACT_LINKS,
  CREDENTIALS,
  EXPERIENCE,
  HOMELAB,
  HOMELAB_HOSTS,
  INTRO,
  PORTFOLIO_PACKAGE,
  PROJECTS,
  SECTION_ORDER,
  SHELL,
  SHELL_EXTRA,
  SITE,
  TERMINAL_COMMANDS,
  credentialDate,
  type Project,
  type SectionId,
} from "@/content";
import { aptReply, sudoRefusal } from "./apt";
import { isoMinute } from "./format";
import { Bold, Dim, PfWhoami, PromptEcho, TermLink } from "./lines";

const HOST = INTRO.hostname;

/** Sections `open` and the nmap buttons can jump to: the enabled ones, in page order. */
export const OPEN_TARGETS: readonly SectionId[] = SECTION_ORDER;

/** Smooth-scroll a classic-view section into view (no-op while it is hidden). */
export function scrollToSection(id: SectionId) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

/** Commands that work but stay out of help (ls, date and the rest stay uncompleted, as before). */
const HIDDEN_COMPLETIONS = ["apt", "cd", "sudo"] as const;

/** Command names offered by tab completion: the help list (boot and exit included) plus apt, cd and sudo. */
export const COMPLETIONS: readonly string[] = [...TERMINAL_COMMANDS.map((c) => c.name), ...HIDDEN_COMPLETIONS];

/** Alias -> canonical command name (aliases listed with each help row). */
const ALIAS: Record<string, string> = Object.fromEntries(
  TERMINAL_COMMANDS.flatMap((c) => (c.aliases ?? []).map((a) => [a, c.name] as const)),
);

export interface CommandContext {
  mode: TerminalMode;
  /** Logged-in user (always set when a command runs). */
  user: string;
  /** Working directory: "~" or an absolute path. */
  cwd: string;
  /** Change the working directory (the prompt follows). */
  chdir(dir: string): void;
  /** Previous commands, newest first, without the current one. */
  history: readonly string[];
  print(...nodes: ReactNode[]): void;
  clear(): void;
  /** Login screen `exit`: forget the user and reset to the tty header. */
  logout(): void;
  /** Login screen `boot` / `gui`: hand over to the engine. */
  boot(skip: boolean): void;
  /** Shell `exit` / `reboot`: the lab powers down. */
  exit(kind: "logout" | "reboot"): void;
}

/** Parsed submit line (spec 01 section 5.5). */
export interface ParsedLine {
  /** Trimmed line in its original case. */
  line: string;
  /** Lower-cased first word. */
  cmd: string;
  /** Lower-cased rest, single spaced. */
  arg: string;
}

export function parseLine(raw: string): ParsedLine {
  const line = raw.trim();
  const words = line.toLowerCase().replace(/\s+/g, " ").split(" ");
  return { line, cmd: words[0] ?? "", arg: words.slice(1).join(" ") };
}

/* ------------------------------------------------------------------------ */
/* Working directory                                                         */
/* ------------------------------------------------------------------------ */

/** Directories `cd` knows (absolute); everything else does not exist. */
function knownDirs(user: string): string[] {
  return ["/", "/home", `/home/${user}`, "/opt", PORTFOLIO_PACKAGE.dir];
}

/** Absolute path of a working directory ("~" is the user's home). */
export function absoluteDir(cwd: string, user: string): string {
  return cwd === "~" ? `/home/${user}` : cwd;
}

/**
 * Resolve a `cd` target ("", "~", "~/x", absolute or relative, with "." and
 * ".."). Returns the new working directory ("~" for home) or null when the
 * directory does not exist.
 */
export function resolveDir(cwd: string, target: string, user: string): string | null {
  const home = `/home/${user}`;
  const path =
    target === "" || target === "~"
      ? home
      : target.startsWith("~/")
        ? home + target.slice(1)
        : target.startsWith("/")
          ? target
          : `${absoluteDir(cwd, user)}/${target}`;
  const parts: string[] = [];
  for (const seg of path.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  const abs = "/" + parts.join("/");
  if (!knownDirs(user).includes(abs)) return null;
  return abs === home ? "~" : abs;
}

/* ------------------------------------------------------------------------ */
/* Renderers                                                                 */
/* ------------------------------------------------------------------------ */

function helpRows(mode: TerminalMode): ReactNode[] {
  return [
    ...TERMINAL_COMMANDS.filter((c) => mode === "intro" || !c.introOnly).map((c) => (
      <p key={c.name} className="whitespace-pre">
        {"  "}
        <span className="text-title">{c.name.padEnd(13, " ")}</span>
        <Dim>{c.help}</Dim>
      </p>
    )),
    <p key="hint" className="mt-1">
      <Dim>tab completes · ↑↓ history · ctrl+l clears</Dim>
    </p>,
  ];
}

function aboutRows(): ReactNode[] {
  const [lead, rest] = SHELL.aboutParagraphs;
  return [
    <p key="lead" className="text-title">
      {lead}
    </p>,
    <p key="rest">{rest}</p>,
  ];
}

function experienceRows(): ReactNode[] {
  return EXPERIENCE.map((e) => (
    <p key={e.role}>
      {e.role} <Dim>@ {e.company} · {e.period.toLowerCase()}</Dim>
    </p>
  ));
}

/** A project name: external link, in-page jump (enabled sections only), or plain text. */
function ProjectName({ project }: { project: Project }) {
  const { link, name } = project;
  if (link.startsWith("#")) {
    const id = link.slice(1) as SectionId;
    if (!OPEN_TARGETS.includes(id)) return <span className="text-title">{name}</span>;
    return (
      <button
        type="button"
        onClick={() => scrollToSection(id)}
        className="text-title underline decoration-mint/40 underline-offset-2 hover:decoration-mint"
      >
        {name}
      </button>
    );
  }
  if (link) return <TermLink href={link}>{name}</TermLink>;
  return <span className="text-title">{name}</span>;
}

function projectRows(): ReactNode[] {
  return PROJECTS.map((p) => (
    <p key={p.slug}>
      <ProjectName project={p} /> <Dim>· {p.stack.slice(0, 3).join(", ")}</Dim>
    </p>
  ));
}

function certRows(): ReactNode[] {
  return CREDENTIALS.map((c) => (
    <p key={c.id}>
      {c.full}{" "}
      <Dim>
        · {c.issuer} · {credentialDate(c).toLowerCase()}
      </Dim>
    </p>
  ));
}

function educationRows(): ReactNode[] {
  return SHELL.education.map((line) => <p key={line}>{line}</p>);
}

function whoamiRows(user: string): ReactNode[] {
  return [
    <p key="user">{user}</p>,
    <Dim key="note">
      a guest on {SITE.name}&apos;s homelab · try &quot;about&quot;
    </Dim>,
  ];
}

function contactRows(): ReactNode[] {
  return CONTACT_LINKS.map((l) => (
    <p key={l.key} className="whitespace-pre">
      <Dim>{l.key.padEnd(11, " ")}</Dim>
      <TermLink href={l.href}>{l.handle}</TermLink>
    </p>
  ));
}

/** Host column of `services`: two spaces, the host id padded to 10. */
const HOST_COL = 12;

/**
 * `services`: grouped by node. Each row prints the host and its role, then
 * its services on a hanging indent (idle nodes and service-less rows print
 * the role only).
 */
function serviceRows(): ReactNode[] {
  return [
    <p key="host">
      <Bold>{SHELL.servicesHost}</Bold> <Dim>· {HOMELAB.host} · {HOMELAB.os}</Dim>
    </p>,
    ...HOMELAB_HOSTS.flatMap((h) => [
      <p key={h.id} className="flex">
        <span className="shrink-0 whitespace-pre text-title/90">{("  " + h.id).padEnd(HOST_COL, " ")}</span>
        <Dim>{h.tag}</Dim>
      </p>,
      h.services.length > 0 ? (
        <p key={`${h.id}-svc`} className="flex">
          <span className="shrink-0 whitespace-pre">{" ".repeat(HOST_COL)}</span>
          <span>{h.services.join(" · ")}</span>
        </p>
      ) : null,
    ]).filter(Boolean),
    <p key="hardening" className="mt-1 whitespace-pre-wrap">
      {"  "}hardening: <Dim>{HOMELAB.hardening.join(" · ")}</Dim>
    </p>,
  ];
}

function neofetchRows(user: string): ReactNode[] {
  const idle = CLUSTER_HOSTS.filter((h) => h.idle).map((h) => `${h.id} idle`);
  const busy = CLUSTER_HOSTS.filter((h) => !h.idle).map((h) => h.id);
  const span = busy.length > 1 ? `${busy[0]} to ${busy[busy.length - 1]}` : busy.join("");
  const rows: [string, string][] = [
    ["OS", SHELL.neofetch.OS],
    ["Host", SHELL.neofetch.Host],
    ["CPU", SHELL_EXTRA.cpu],
    ["Memory", SHELL.neofetch.Memory],
    ["Storage", SHELL.neofetch.Storage],
    ["Network", SHELL.neofetch.Network],
    ["Services", [`${CLUSTER_SERVICE_COUNT} on ${span}`, ...idle, SHELL_EXTRA.servicesNote].join(" · ")],
  ];
  return [
    <p key="title">
      <Bold>
        {user}@{HOST}
      </Bold>
    </p>,
    <Dim key="rule">-----------------</Dim>,
    ...rows.map(([k, v]) => (
      <p key={k}>
        <Bold>{k}</Bold>: {v}
      </p>
    )),
  ];
}

function nmapRows(now: number): ReactNode[] {
  return [
    <Dim key="start">Starting Nmap 7.95 ( https://nmap.org ) at {isoMinute(now)}</Dim>,
    <Dim key="report">
      Nmap scan report for {SITE.domain} ({SHELL_EXTRA.scanAddress})
    </Dim>,
    <p key="head" className="whitespace-pre text-gray-2">{"PORT".padEnd(10) + "STATE".padEnd(10) + "SERVICE"}</p>,
    ...SHELL.nmap.map((r) => {
      const target = r.target;
      return (
        <p key={r.port} className="whitespace-pre">
          {r.port.padEnd(10)}
          <span className={r.state === "open" ? "text-title" : "text-gray-2"}>{r.state.padEnd(10)}</span>
          {target ? (
            <button
              type="button"
              onClick={() => scrollToSection(target)}
              className="text-title underline decoration-mint/40 underline-offset-2 hover:decoration-mint"
            >
              {r.service}
            </button>
          ) : (
            <Dim>{r.service} (nice try)</Dim>
          )}
        </p>
      );
    }),
    <Dim key="done">Nmap done: 1 IP address (1 host up) scanned in {SHELL_EXTRA.scanSeconds} seconds</Dim>,
  ];
}

/* ------------------------------------------------------------------------ */
/* Dispatcher                                                                */
/* ------------------------------------------------------------------------ */

/**
 * Run one non-empty command. Every printed node becomes its own scrollback
 * entry; the terminal keys entries itself, so these arrays need no keys.
 */
export function runCommand({ line, cmd, arg }: ParsedLine, ctx: CommandContext): void {
  const { mode, user, print } = ctx;
  const intro = mode === "intro";

  /** Words after the command in their original case (paths, sudo's command line). */
  const rawArgs = line.split(/\s+/).slice(1);

  let name = ALIAS[cmd] ?? cmd;
  if (name === "cat") {
    if (arg === "about.txt") name = "about";
    else if (arg === "services.md") name = "services";
    else {
      print(<p>cat: {arg || "(nothing)"}: No such file or directory</p>);
      return;
    }
  }

  switch (name) {
    case "boot":
      if (intro) return ctx.boot(false);
      return print(<Dim>the lab is already running.</Dim>);
    case "gui":
    case "skip":
      if (intro) return ctx.boot(true);
      return print(<Dim>you&apos;re already in the gui.</Dim>);
    case "clear":
      return ctx.clear();
    case "help":
      return print(...helpRows(mode));
    case "about":
      return print(...aboutRows());
    case "whoami":
      return print(...whoamiRows(user));
    case "education":
      return print(...educationRows());
    case "experience":
      return print(...experienceRows());
    case "projects":
      return print(...projectRows());
    case "certs":
      return print(...certRows());
    case "contact":
      return print(...contactRows());
    case "resume":
      window.open(SITE.resumeUrl, "_blank");
      return print(<Dim>opening resume.pdf…</Dim>);
    case "services":
      return print(...serviceRows());
    case "neofetch":
      return print(...neofetchRows(user));
    case "open": {
      const target = OPEN_TARGETS.find((s) => s === arg);
      if (target) {
        scrollToSection(target);
        return print(<Dim>opening {target}…</Dim>);
      }
      return print(
        <p>
          open: no such section: {arg || "(none)"}. try {OPEN_TARGETS.join(", ")}
        </p>,
      );
    }
    case "ls":
      return print(<p className="whitespace-pre-wrap">{SHELL_EXTRA.listing}</p>);
    case "pwd":
      return print(<p>{absoluteDir(ctx.cwd, user)}</p>);
    case "cd": {
      if (rawArgs.length > 1) return print(<p>-bash: cd: too many arguments</p>);
      const target = rawArgs[0] ?? "";
      const dir = resolveDir(ctx.cwd, target, user);
      if (dir === null) return print(<p className="whitespace-pre-wrap break-words">-bash: cd: {target}: No such file or directory</p>);
      return ctx.chdir(dir);
    }
    case PORTFOLIO_PACKAGE.bin:
      return print(<PfWhoami />);
    case "apt":
    case "apt-get":
      return print(...aptReply(arg ? arg.split(" ") : [], false, user, name));
    case "sudo": {
      const [bin = "", ...rest] = arg ? arg.split(" ") : [];
      if (!bin) return print(<p>usage: sudo -h | -K | -k | -V</p>);
      if (bin === "apt" || bin === "apt-get") return print(...aptReply(rest, true, user, bin));
      // The guest account may only run apt through sudo.
      const command = bin.startsWith("-") ? "/bin/bash" : ["/usr/bin/" + rawArgs[0], ...rawArgs.slice(1)].join(" ");
      return print(sudoRefusal(user, command));
    }
    case "echo":
      return print(<p className="whitespace-pre-wrap break-words">{line.slice(5)}</p>);
    case "date":
      return print(<p>{isoMinute(Date.now())}</p>);
    case "history":
      return print(
        ...[...ctx.history]
          .reverse()
          .concat(line)
          .map((c, i) => (
            <p key={i} className="whitespace-pre">{`${String(i + 1).padStart(5)}  ${c}`}</p>
          )),
      );
    case "nmap":
      return print(...nmapRows(Date.now()));
    case "exit":
      if (intro) return ctx.logout();
      print(<p>logout</p>);
      return ctx.exit("logout");
    case "reboot":
      if (intro) return ctx.boot(false);
      print(<p>Broadcast message from root@{HOST}: the system is going down for reboot NOW!</p>);
      return ctx.exit("reboot");
    case "su":
    case "login":
      return print(<p className="text-alert">nice try.</p>);
  }

  print(<p>-bash: {cmd}: command not found</p>);
}

/** Argument candidates after a command line head (lower-cased, single spaced). */
function argCandidates(head: string): readonly string[] {
  if (/^(sudo )?apt(-get)? install$/.test(head)) return [PORTFOLIO_PACKAGE.name];
  if (/^(sudo )?apt(-get)?$/.test(head)) return ["install", "update", "upgrade"];
  if (head === "sudo") return ["apt", "apt-get"];
  if (head === "cd") return [PORTFOLIO_PACKAGE.dir, "~"];
  if (head === "cat") return ["about.txt", "services.md"];
  if (head === "open") return OPEN_TARGETS;
  return [];
}

/**
 * Tab completion (logged in, non-empty input). The first word completes
 * against the command names; later words complete against the arguments the
 * command knows (apt's package, cd's directories, cat's files, open's
 * sections). One match replaces the word, several are listed (sorted).
 */
export function complete(
  input: string,
  prompt: string,
): { replace: string } | { list: ReactNode[] } | null {
  const text = input.replace(/^\s+/, "");
  if (!text) return null;
  const cut = text.lastIndexOf(" ");
  const word = text.slice(cut + 1).toLowerCase();
  const pool = cut === -1 ? COMPLETIONS : argCandidates(text.slice(0, cut).toLowerCase().replace(/\s+/g, " ").trim());
  if (cut === -1 && !word) return null;
  const hits = pool.filter((c) => c.startsWith(word)).sort();
  if (hits.length === 1) return { replace: text.slice(0, cut + 1) + hits[0] };
  if (hits.length > 1) return { list: [<PromptEcho key="echo" prompt={prompt} text={input} />, <p key="hits">{hits.join("   ")}</p>] };
  return null;
}
