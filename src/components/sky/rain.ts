/**
 * Mint Terminal background: the values the canvas rain and the divider read
 * from JS (docs/theme/b.md sections 4 and 6). The CSS side of the palette is
 * the token set in src/styles/base.css; keep the two in sync.
 */

/** JS copies of the palette tokens the canvas needs (a canvas cannot read var()). */
export const RAIN_COLOR = {
  accent: "#3dfc9a",
  head: "#d4ffe8",
} as const;

/**
 * Rain glyph set: uppercase hex plus a few operators, so the rain reads as a
 * scrolling hex dump. Hex appears twice so it dominates.
 */
export const RAIN_GLYPHS = "0123456789ABCDEF0123456789ABCDEF:./<>{}[]=+*#$%~^" as const;

export interface RainProfile {
  /** Column pitch and row height in CSS px. */
  colW: number;
  rowH: number;
  /** Glyph size in CSS px. */
  font: number;
  /** Alpha multiplier for cells over the quiet zone (elsewhere 1). */
  contentAlpha: number;
  /** Spawn weight for columns over the quiet zone (elsewhere 1). */
  contentSpawn: number;
  /**
   * Smoothstep feather around the quiet zone edge, in px: from feather inside
   * the zone (quiet level) to featherOut outside it (full level).
   */
  feather: number;
  featherOut: number;
}

/** Which mask a field uses: the page's content column, or an ellipse around the room. */
export type RainMode = "page" | "room";

/**
 * Rain parameters. Speeds are in rows per second, so a drop crosses a 900px
 * viewport in roughly 7 to 18 seconds: sparse and slow by design.
 */
export const RAIN = {
  glyphs: RAIN_GLYPHS,
  color: RAIN_COLOR.accent,
  headColor: RAIN_COLOR.head,
  /** Peak alpha of a trail cell (before the column multiplier). */
  trailAlpha: 0.5,
  /** Alpha of the lead glyph. */
  headAlpha: 0.92,
  /** Trail cells fainter than this are not drawn (invisible on the base, still simulated). */
  minAlpha: 0.012,
  /** Rows per second. */
  speed: [2.2, 5.6] as const,
  /** Trail length in rows (sets the per-cell fade rate). */
  trail: [7, 18] as const,
  /** Seconds a column rests between drops, divided by its spawn weight. */
  gap: [2.5, 14] as const,
  /** Chance per second that a lit trail glyph swaps to another glyph. */
  mutate: 0.7,
  /** Chance per second that the lead glyph swaps while it sits in a cell. */
  headFlicker: 9,
  /** Fast drops in full-strength columns: seconds between bursts, speed and trail. */
  burst: { every: [12, 22] as const, speed: [16, 24] as const, trail: [26, 36] as const },
  /** Frame cap; the rain moves a whole row at a time, so 30 fps is plenty. */
  fps: 30,
  /** DPR cap for the backing store. */
  maxDpr: 2,
  /** Seconds simulated before the first paint so the page never loads empty. */
  prewarm: 9,
  /** Half the content column (max-w-6xl = 72rem), in px. */
  contentHalf: 576,
  /** Static field (reduced motion): seeded, share of full-strength columns that hold a frozen drop. */
  staticSeed: 0x5eedb,
  staticDensity: 0.42,
  desktop: { colW: 20, rowH: 22, font: 14, contentAlpha: 0.14, contentSpawn: 0.12, feather: 40, featherOut: 110 } satisfies RainProfile,
  mobile: { colW: 16, rowH: 18, font: 12, contentAlpha: 0.2, contentSpawn: 0.26, feather: 140, featherOut: 24 } satisfies RainProfile,
  /** Below this width the mobile profile applies. */
  mobileBelow: 768,
  /**
   * Room view: rain across the full width, dimmed to 35% inside an ellipse
   * around the room's projected bounds. Columns spawn in proportion to how
   * much of them lies outside the ellipse (down to the same 35%), since the
   * room hides most of the rest. The room is placed like the camera's
   * REST framing: ROOM (contracts) fitted into the viewport minus
   * CAMERA.fitMargin, contained and centred.
   */
  room: {
    alpha: 0.35,
    /** Ellipse radii as multiples of the room's half extents. */
    reach: 1.02,
    /** Feather of the ellipse edge, in units of its normalised radius. */
    feather: 0.22,
  },
} as const;
