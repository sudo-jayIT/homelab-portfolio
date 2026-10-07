/**
 * Room ("lab") contracts shared by the art (B3), engine (B4), terminal (B5),
 * panels (B6) and rack inspector (B7). Owned by Foundation; read-only for
 * builders. Request changes through neededFromOthers.
 *
 * Derived from specs 01 (intro terminal), 04 (room scene) and 05 (room UI).
 * Identifier note: rack part ids name the owner's devices (switches, Proxmox
 * nodes pve1 to pve4, the Raspberry Pi, the ZimaBoard shelf, the NAS and the
 * PDU); their rack positions live in one table in src/lib/rack.tsx. The four
 * certificate ids are slot based ("cert-1".."cert-4", in wall order from the
 * front end toward the corner) so content can be swapped without touching
 * hotspot ids.
 */

import type { ReactNode, Ref } from "react";
import type { SectionId } from "@/content/types";
import { ENABLED_SECTIONS } from "@/content/site";
import { ROOM_STILL_SRC } from "@/content/room-still";
import { iso, type Vec2, type Vec3 } from "@/lib/iso";

export type { Vec2, Vec3 };

/** Rectangle (SVG user units or CSS px depending on context). */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/* ------------------------------------------------------------------------ */
/* Geometry                                                                  */
/* ------------------------------------------------------------------------ */

/** Room shell in world units: two back walls on a floor slab. */
export const ROOM_SHELL = { x0: 430, y0: 440, x1: 860, y1: 790, h: 180, t: 6, slab: 12 } as const;

/** The 6 outer corners of the shell whose projection defines ROOM. */
export const ROOM_SHELL_CORNERS: readonly Vec3[] = (() => {
  const { x0, y0, x1, y1, h, t, slab } = ROOM_SHELL;
  return [
    [x0 - t, y0 - t, h],
    [x0 - t, y1, h],
    [x1, y0 - t, h],
    [x1, y1, -slab],
    [x0 - t, y1, -slab],
    [x1, y0 - t, -slab],
  ] as Vec3[];
})();

/**
 * Screen-space (SVG user units) bounding box of the projected shell.
 * Equals { x: 381.61, y: 368.68, w: 905.38, h: 776.16 }.
 */
export const ROOM: Rect = (() => {
  const p = ROOM_SHELL_CORNERS.map(([x, y, z]) => iso(x, y, z));
  const xs = p.map((q) => q[0]);
  const ys = p.map((q) => q[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
})();

/** Static viewBox attribute on every svg[data-cam] before the camera takes over (ROOM grown by 60). */
export const ROOM_PAD = 60;
export const INITIAL_VIEWBOX = "322 309 1025 896";

/** World point the step-in framing centres on; projects to (782.85, 696.70). */
export const STEP_IN_TARGET: Vec3 = [560, 575, 70];

/** Camera framing constants (spec 05 section 4.1). Pixels are hero-section pixels. */
export const CAMERA = {
  /** Fit (REST) box margins inside the hero. */
  fitMargin: { left: 16, right: 16, top: 64, bottom: 48 },
  /** Zooming out to <= exitScale * minScale leaves the room. */
  exitScale: 1.04,
  /** Pan clamp margin in screen px. */
  panMargin: 24,
  /** Drag threshold before a pointer gesture pans, in px. */
  dragThreshold: 6,
  /** Hotspots smaller than this on coarse pointers zoom first (px). */
  tapZoomMin: 28,
  tapZoomFactor: 2.2,
  durations: {
    enter: 1.15,
    exit: 0.9,
    exitFits: 0.45,
    stepIn: 1.05,
    reset: 0.8,
    zoom: 0.35,
    pan: 0.4,
    tapZoom: 0.9,
  },
} as const;

/**
 * The landing still (spec 03, spec 04 section 9). 1700x1460 bitmap with a 10px
 * transparent margin; its inner 1680x1440 maps exactly onto ROOM.
 */
export const STILL = {
  src: ROOM_STILL_SRC,
  width: 1700,
  height: 1460,
  margin: 10,
  /** Horizontal and vertical inset fractions of the drawn room inside the bitmap. */
  insetX: 1 / 170,
  insetY: 1 / 146,
  /** Sky parallax depth of the still on the landing page (--d). */
  depth: 18,
  /** viewBox that renders the lit SVG to the still (ROOM padded by 5.39 units). */
  viewBox: "376.22 363.29 916.16 786.94",
  pxPerUnit: 1680 / ROOM.w,
} as const;

/** Inset a still image rect to the drawn room inside it. */
export function insetStill(r: Rect): Rect {
  return {
    x: r.x + r.w * STILL.insetX,
    y: r.y + r.h * STILL.insetY,
    w: r.w * (1 - 2 * STILL.insetX),
    h: r.h * (1 - 2 * STILL.insetY),
  };
}

/* ------------------------------------------------------------------------ */
/* Ids                                                                       */
/* ------------------------------------------------------------------------ */

/** Wall certificates, in wall order (u = 182, 224, 266, 308). cert-3 carries the colour band. */
export const CERT_IDS = ["cert-1", "cert-2", "cert-3", "cert-4"] as const;
export type CertHotspotId = (typeof CERT_IDS)[number];

/**
 * Rack hotspots: the rack itself, then its devices top to bottom; also the
 * inspector tab order (PART_ORDER). "zima" is the shelf of two ZimaBoards.
 * Rack positions (U numbers) come from RACK_SLOTS in src/lib/rack.tsx.
 */
export const RACK_PART_IDS = [
  "rack",
  "switch-5",
  "switch-8",
  "pve1",
  "pve2",
  "pve3",
  "pve4",
  "pi",
  "zima",
  "nas",
  "pdu",
] as const;
export type RackPartId = (typeof RACK_PART_IDS)[number];
/** A device in the rack (every rack part except the rack). */
export type RackDeviceId = Exclude<RackPartId, "rack">;
export const RACK_DEVICE_IDS = RACK_PART_IDS.filter((id): id is RackDeviceId => id !== "rack");

/**
 * Rack devices that get a callout tag during the power-up (4 tags, drawn top
 * to bottom in rack order). Every device lights up; see BootStage.
 */
export const BOOT_PART_IDS = ["switch-8", "pve1", "pi", "pdu"] as const;
export type BootPartId = (typeof BOOT_PART_IDS)[number];

export function isBootPart(id: string): id is BootPartId {
  return (BOOT_PART_IDS as readonly string[]).includes(id);
}

/** One console boot row: "[  OK  ] {host padded to 11} {msg}". */
export interface BootRow {
  host: string;
  msg: string;
}

/**
 * One step of the rack power-up: its devices flicker on together (lightly
 * staggered) and its rows print to the console. Data: RACK_BOOT in
 * src/content/homelab.ts.
 */
export interface BootStage {
  parts: readonly RackDeviceId[];
  rows: readonly BootRow[];
}

/** Objects that open a lifted focus panel (everything that is not a rack part). */
export const PANEL_IDS = [
  "monitor",
  "resume",
  "badge",
  "phone",
  "record",
  "print",
  "map",
  "poster",
  "firewall",
  "pc",
  "ups",
  ...CERT_IDS,
] as const;
export type PanelId = (typeof PANEL_IDS)[number];

/** Room panels, side hardware, the rack and its devices. */
export const LIGHT_IDS = ["light-left", "light-right", "floor-lamp", "ambient"] as const;
export type LightId = (typeof LIGHT_IDS)[number];
export const isLight = (id: HotspotId): id is LightId => (LIGHT_IDS as readonly string[]).includes(id);
export type HotspotId = PanelId | RackPartId | LightId;
export const HOTSPOT_IDS: readonly HotspotId[] = [...PANEL_IDS, ...RACK_PART_IDS, ...LIGHT_IDS];

export function isRackPart(id: HotspotId): id is RackPartId {
  return (RACK_PART_IDS as readonly string[]).includes(id);
}
export function isCert(id: HotspotId): id is CertHotspotId {
  return (CERT_IDS as readonly string[]).includes(id);
}

/** Hotspots with a pulsing hint marker, in this order (marker i gets animation-delay 0.43s * i). */
export const MARKED: readonly HotspotId[] = [
  "monitor",
  "resume",
  "badge",
  "rack",
  "map",
  "cert-3",
];

/**
 * Header nav in room view: section -> hotspot to open (dispatched as yg:pick).
 * Follows the section toggles in src/content/site.ts: disabled sections have
 * no entry.
 */
export const ROOM_PICK: Partial<Record<SectionId, HotspotId>> = Object.fromEntries(
  ENABLED_SECTIONS.map((s) => [s.id, s.room]),
);

/* ------------------------------------------------------------------------ */
/* Hotspots (data produced by src/components/lab/art/hotspots.ts, B3)        */
/* ------------------------------------------------------------------------ */

/** Three world points spanning a flat surface: origin, width-axis end, height-axis end. */
export type Face3 = [Vec3, Vec3, Vec3];

export interface Hotspot {
  id: HotspotId;
  /** aria-label and <title> text, "Section: object" style, 3 to 40 chars. */
  title: string;
  /**
   * Short tooltip text (3 to 22 chars). null means quiet: no tooltip and no
   * <title> (the record player). The tooltip anchor is derived from the
   * polygon bbox: top centre, or bottom centre when too close to the top.
   */
  tip: string | null;
  /** Polygon in SVG user units ("x,y x,y ..."), usually pts(boxHull(...)). */
  points: string;
  /** Surface the focus panel lifts off (every non-rack hotspot has one). */
  face?: Face3;
  /** Hint marker anchor in SVG user units (centre of the face, else bbox centre). */
  marker?: Vec2;
}

/** World box of a rack part, used by poseOf() and the inspector's scene pose. */
export interface PartBox {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
}

/* ------------------------------------------------------------------------ */
/* Art data-attribute vocabulary (spec 01 section 4.3, spec 04 section 4.4)  */
/* ------------------------------------------------------------------------ */

/**
 * Attributes the art must expose so the engine's GSAP timelines can find
 * things. Initial render state: every [data-base] group opacity 0.42, every
 * [data-lights], [data-unit], [data-pool], [data-cable], [data-tag], packet
 * and alert group opacity 0.
 */
export const ART_ATTR = {
  /** Furniture group, value BaseGroup. Dark at 0.42 opacity, 1 when lit. */
  base: "data-base",
  /** Floor light pool group, value PoolGroup. */
  pool: "data-pool",
  /** Lit-layer group, value BaseGroup ("myrack" is always visible; its children are units). */
  lights: "data-lights",
  /** Rack element faded in one by one, value "spot" | RackDeviceId. */
  part: "data-part",
  /** Any individually lit rack unit (fades out on power down, stagger from end). */
  unit: "data-unit",
  /** Cable group, value CableId; contains the <path id="lab-cable-..."> drawn with DrawSVG. */
  cable: "data-cable",
  /** Rack callout tag, value BootPartId (only visible during the power-up). */
  tag: "data-tag",
  /** Data packet group travelling along a cable (MotionPath). */
  pkt: "data-pkt",
  /** The red packet that dies halfway along the WAN cable. */
  blockedPkt: "data-blocked-pkt",
  /** Firewall label that flashes when the blocked packet dies. */
  fwAlert: "data-fw-alert",
  /** Burst ring circle whose r is tweened. */
  fwBurst: "data-fw-burst",
  /** CRT text node(s) showing the blocked-packet counter. */
  blockedCount: "data-blocked-count",
  /** CRT bar graph rects (scaleY loops). */
  bar: "data-bar",
  /** CRT screen group. */
  screen: "data-screen",
  /** In-scene vinyl group (hidden while the record panel is lifted). */
  vinyl: "data-vinyl",
  /** Every camera-driven <svg>: they all share one viewBox. */
  cam: "data-cam",
} as const;

export type BaseGroup = "room" | "desk" | "deskitems" | "record" | "myrack";
export type PoolGroup = "room" | "desk" | "myrack";
export type CableId = "wan" | "desk";
export type RackPartAttr = "spot" | RackDeviceId;

/** Packet groups carry data-pkt plus these to describe their route. */
export const PACKET_ATTRS = { cable: "data-pkt-cable", dir: "data-pkt-dir", color: "data-pkt-color" } as const;

/** Element ids of the lit cable paths (MotionPath and DrawSVG targets). */
export const CABLE_PATH_ID: Record<CableId, string> = { wan: "lab-cable-wan", desk: "lab-cable-desk" };

/** Power-up groups after the rack: group 0 then group 1, 0.35s apart (0.1s fast). */
export const POWER_GROUPS: readonly (readonly BaseGroup[])[] = [["room"], ["desk", "deskitems", "record"]];
/** Which cable draws with which power group. */
export const POWER_GROUP_CABLE: readonly CableId[] = ["wan", "desk"];

/** Global SVG ids defined once by the art (document-global, do not duplicate). */
export const ART_IDS = {
  shadow: "lab-shadow",
  halo: "lab-halo",
  lens: "lab-lens",
  sky: "lab-sky",
  perf: "lab-perf",
  occlude: "lab-occlude",
  beam: "lab-beam",
  crtGlow: "lab-crt-glow",
  scan: "lab-scan",
  vinylSheen: "lab-vinyl-sheen",
  /** lab-glow-{color} and lab-pool-{color} for every LedColor. */
  glow: (c: LedColor) => `lab-glow-${c}`,
  pool: (c: LedColor) => `lab-pool-${c}`,
} as const;

/** Attribute selector helper, e.g. sel("base", "desk") -> '[data-base="desk"]'. */
export function sel(attr: keyof typeof ART_ATTR, value?: string): string {
  const name = ART_ATTR[attr];
  return value === undefined ? `[${name}]` : `[${name}="${value}"]`;
}

/* ------------------------------------------------------------------------ */
/* LEDs and palette (spec 04 section 3.1)                                    */
/* ------------------------------------------------------------------------ */

export type LedColor = "green" | "emerald" | "cyan" | "blue" | "amber" | "red" | "white" | "warm";
export const LED: Record<LedColor, string> = {
  green: "#4ade80",
  emerald: "#34d399",
  cyan: "#22d3ee",
  blue: "#60a5fa",
  amber: "#fbbf24",
  red: "#fb7185",
  white: "#f1f5f9",
  warm: "#fdba74",
};
export type BlinkKind = "act" | "disk" | "pulse";
/** Duration ranges in seconds for seeded LED timing. */
export const BLINK_RANGE: Record<BlinkKind, [number, number]> = {
  act: [0.7, 1.9],
  disk: [1.8, 4.6],
  pulse: [2.6, 4.4],
};

/* ------------------------------------------------------------------------ */
/* Art components (B3)                                                       */
/* ------------------------------------------------------------------------ */

/**
 * RoomBase (SVG #1) and RoomLights (SVG #2) are server-compatible components
 * (no hooks, no "use client", deterministic output). page.tsx renders them and
 * passes them into LabHero as props so the static art ships as HTML once.
 * `lit` renders the fully lit end state (bases 1, lights/pools/cables 1); used
 * by the room-still render route. Default: dark initial state.
 * Each root is <svg data-cam viewBox={INITIAL_VIEWBOX} preserveAspectRatio="xMidYMid meet"
 * className="absolute inset-0 h-full w-full" aria-hidden>.
 */
export interface RoomArtProps {
  lit?: boolean;
}

/** Ambient loops (packets, firewall alert, CRT bars). Created by useAmbient (B3). */
export interface AmbientControls {
  /** Start the loops, or resume them if paused. No-op under reduced motion. */
  start(): void;
  /** Pause without resetting (leaving the room view). */
  pause(): void;
  /** Kill and reset to the hidden state (power down). */
  kill(): void;
}

/* ------------------------------------------------------------------------ */
/* Terminal (B5)                                                             */
/* ------------------------------------------------------------------------ */

export type TerminalMode = "intro" | "shell" | "busy";
export type LabPhase = "init" | "intro" | "booting" | "live" | "off";

export interface TerminalHandle {
  /** Append entries (keeps the last ~200). */
  print(...nodes: ReactNode[]): void;
  /** Empty the scrollback. */
  clear(): void;
  /** Focus the hidden input with preventScroll. */
  focus(): void;
  /** Set the prompt user if none is set yet; clears the input. */
  login(name: string): void;
  /** User null, input empty, scrollback = tty header only. */
  reset(): void;
}

export interface TerminalProps {
  mode: TerminalMode;
  /** First-visit autoplay: the user name to type, or null for an interactive login. */
  autoplay?: string | null;
  /** "boot"/Enter (skip=false) or "gui"/"skip" (skip=true) from the login screen. */
  onBoot: (skip: boolean, user: string) => void;
  /** "exit"/"logout" or "reboot" typed in the shell: the lab powers down. */
  onExit: (kind: "logout" | "reboot") => void;
  /** Shell footer close button. */
  onClose?: () => void;
  /** Optional observer for every submitted command (lower-cased first word, rest). */
  onCommand?: (cmd: string, arg: string) => void;
  ref?: Ref<TerminalHandle>;
}

/**
 * Line templates the engine prints during consoleBoot / powerUp / enter.
 * Exported by src/components/lab/terminal/lines.tsx (B5) as React components
 * with these names and props.
 */
export interface TerminalLineProps {
  BootStart: Record<string, never>; // "powering on the homelab…"
  BootOk: { host: string; msg: string }; // "[  OK  ] host  msg"
  BootTarget: Record<string, never>; // "[  OK  ] Reached target graphical.target - the room."
  LabOnline: { user: string }; // "lab online. welcome, {user}."
  SessionRestored: { user: string; at: number }; // "Last login: ..." + "session restored. ..." + blank
  SystemRestarted: Record<string, never>; // "System restarted."
}

/* ------------------------------------------------------------------------ */
/* Focus panels (B6) and rack inspector (B7)                                 */
/* ------------------------------------------------------------------------ */

/**
 * Props every focus panel receives from the engine's FocusLayer. Panels render
 * their own shell with this DOM contract (spec 05 section 2.4):
 *   div[data-focus-layer]  pointer-events-none absolute inset-0 z-40 ...
 *     div[data-lift]       the panel body; GSAP writes style.transform = matrix(...)
 *     div[data-chrome]     caption + actions + "✕ close" key (starts invisible)
 * The record panel's spinning disc carries [data-spin] (the engine sets its
 * animation-delay to phase-match the in-scene vinyl before lifting).
 */
export interface PanelProps {
  id: PanelId;
  /** Start the close timeline (ignored while busy). */
  onClose: () => void;
  /** "classic view ↓" / "full gallery ↓". Defaults to goToSection() from view-store. */
  onNavigate?: (section: SectionId) => void;
  /** Record panel: "■ stop the music" (stops and closes). */
  onStopMusic?: () => void;
}
export type PanelComponent = (props: PanelProps) => ReactNode;
/** src/components/lab/panels/index.ts exports PANELS: PanelRegistry. */
export type PanelRegistry = Record<PanelId, PanelComponent>;

/** Screen pose of a rack part: centre in hero-section px and px per world unit. */
export interface ScenePose {
  x: number;
  y: number;
  px: number;
}

export interface RackInspectorHandle {
  /** Run the lift from the scene pose to the stage pose (1s power3.inOut) and show the dialog. */
  enter(): void;
  /** Reverse to the scene pose (0.75s), then call done. */
  leave(done: () => void): void;
}

export interface RackInspectorProps {
  initial: RackPartId;
  /** Engine-provided: where the part currently sits in the scene. */
  poseOf: (id: RackPartId) => ScenePose;
  onClose: () => void;
  /** Close and chain into another focus ("open the homelab map →" passes "map"). */
  onGo: (next: HotspotId) => void;
  ref?: Ref<RackInspectorHandle>;
}

/* ------------------------------------------------------------------------ */
/* Engine (B4)                                                               */
/* ------------------------------------------------------------------------ */

export interface LabHeroProps {
  /** Server-rendered <RoomBase/> (SVG #1). */
  base: ReactNode;
  /** Server-rendered <RoomLights/> (SVG #2). */
  lights: ReactNode;
}

export interface PowerUpOptions {
  fast: boolean;
  user: string;
  /** Do not print the per-part OK rows (the console is already gone). */
  silent?: boolean;
  onComplete?: () => void;
}

/**
 * Imperative API of the room engine (exposed through a ref inside LabHero,
 * like the original). All durations are multiplied by 0 under reduced motion.
 */
export interface LabApi {
  /** Enter from the page; entry is the still's inset rect (viewport px) or null. */
  enter(entry: Rect | null): void;
  /** Esc chain: close focus, else close terminal, else exit fullscreen and leave the room. */
  home(): void;
  openFocus(id: HotspotId): void;
  /** Close the open focus; `next` chains into another focus after the close. */
  closeFocus(id: HotspotId, next?: HotspotId | null): void;
  openTerm(): void;
  closeTerm(): void;
  /** Zoom around the hero centre (HUD keys 1.4, keyboard 1.3). */
  zoomBy(factor: number, duration?: number): void;
  /** Zoom about a client point and move it to the centre (coarse tap on tiny hotspots). */
  zoomAt(clientX: number, clientY: number, factor: number): void;
  /** Tween to the step-in framing. */
  resetView(duration?: number): void;
  stepIn(duration?: number): void;
  /** Pan by screen px. */
  nudge(dx: number, dy: number): void;
  /** Show the tooltip for a hotspot (null hides); autoHideMs for coarse taps. */
  showTip(id: HotspotId | null, autoHideMs?: number): void;
  /** Smaller on-screen side of a hotspot's bbox in px. */
  hotspotPx(id: HotspotId): number;
  poseOf(id: RackPartId): ScenePose;
  /** Leaving the room view: pause ambient, kill camera tweens, reset UI state. */
  sleep(): void;
  /**
   * Console boot log (fast 0.15/0.12 step, slow 0.35/0.32), then fade the
   * console. rows: false skips the log and only fades (the first-visit
   * session ends on its own launch line).
   */
  consoleBoot(opts: { fast: boolean; rows?: boolean; onComplete?: () => void }): void;
  powerUp(opts: PowerUpOptions): void;
  powerDown(opts: { reboot: boolean; onComplete?: () => void }): void;
  hideConsole(duration?: number, onComplete?: () => void): void;
  showLogin(): void;
  /** Place the camera on the landing still's rest rect; returns true when it fits on screen. */
  frameOpening(): boolean;
  /** Camera to the still rect, then setView("classic") and swallow wheel for 700ms. */
  toPage(): void;
  /** Everything lit instantly and ambient started. */
  lightUp(): void;
  /** Jump all running boot timelines to completion. */
  skipBoot(): void;
}

/** DOM hooks used across the room UI. */
export const LAB_DOM = {
  hero: "hero",
  term: "data-term",
  tip: "data-tip",
  dock: "data-dock",
  hud: "data-hud",
  hotspots: "data-hotspots",
  hot: "data-hot",
  marker: "data-mk",
  focusLayer: "data-focus-layer",
  lift: "data-lift",
  chrome: "data-chrome",
  spin: "data-spin",
  stage: "data-stage",
  musicCard: "data-music-card",
  door: "data-room-door",
  skyVars: "data-sky-vars",
} as const;

/** <html> data attributes driven by the lab (presence flags unless noted). */
export const HTML_FLAGS = {
  view: "view", // "room" | "classic"
  labIntro: "labIntro",
  opening: "opening",
  labFocus: "labFocus",
  labZoomed: "labZoomed",
  labMusic: "labMusic",
  beenInside: "beenInside",
} as const;
