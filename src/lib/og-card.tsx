import { ImageResponse } from "next/og";
import { RAIN_GLYPHS } from "@/components/sky/rain";
import { SITE } from "@/content/site";
import { mulberry32 } from "@/lib/rng";

/**
 * Shared 1200x630 social card for opengraph-image.tsx and twitter-image.tsx,
 * in the Mint Terminal look (docs/theme/b.md 3.12): a flat near-black base,
 * the page's 64px grid with mint intersection dots, a few static glyph
 * columns in the side gutters, the name in title ink and the role line in
 * mint. Uses the font bundled with next/og, so no network access.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = SITE.ogAlt;

const W = OG_SIZE.width;
const H = OG_SIZE.height;
const CELL = 64;

/** Palette (base.css tokens; satori cannot read CSS variables). */
const C = {
  bg: "#050807",
  title: "#eef5f1",
  mint: "#3dfc9a",
  head: "#d4ffe8",
  gray2: "#8a958f",
  shadow: "#0b1812",
  line: "rgba(214,255,233,0.045)",
  dot: "rgba(61,252,154,0.2)",
} as const;

/** Grid lines centred like the page grid: one line on the card's centre. */
const X0 = (W / 2) % CELL;
const V_LINES = Array.from({ length: Math.ceil(W / CELL) + 1 }, (_, i) => X0 + i * CELL).filter((x) => x < W);
const H_LINES = Array.from({ length: Math.ceil(H / CELL) }, (_, i) => i * CELL);

interface Glyph {
  ch: string;
  y: number;
  a: number;
  head: boolean;
}

interface Column {
  x: number;
  glyphs: Glyph[];
}

/**
 * Frozen drops in the gutters: each column is a trail of glyphs fading
 * upward from a brighter lead glyph, like one frame of the page rain.
 */
const COLUMNS: Column[] = (() => {
  const r = mulberry32(0x0c4d);
  const chars = Array.from(RAIN_GLYPHS);
  const xs = [22, 46, 70, 1118, 1142, 1166, 1190];
  const rowH = 26;
  return xs
    .filter(() => r() < 0.8)
    .map((x) => {
      const len = 6 + Math.floor(r() * 12);
      const headRow = len + Math.floor(r() * (H / rowH - len));
      const glyphs: Glyph[] = [];
      for (let k = 0; k <= len; k++) {
        const row = headRow - k;
        if (row < 0) break;
        const fade = 1 - k / (len + 1);
        glyphs.push({
          ch: chars[Math.floor(r() * chars.length)],
          y: row * rowH,
          a: k === 0 ? 0.85 : Math.round(0.5 * fade * fade * 100) / 100,
          head: k === 0,
        });
      }
      return { x, glyphs };
    });
})();

export function ogCard(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: C.bg,
          color: C.title,
        }}
      >
        {V_LINES.map((x) => (
          <div key={`v${x}`} style={{ position: "absolute", left: x, top: 0, width: 1, height: H, background: C.line }} />
        ))}
        {H_LINES.map((y) => (
          <div key={`h${y}`} style={{ position: "absolute", left: 0, top: y, width: W, height: 1, background: C.line }} />
        ))}
        {V_LINES.flatMap((x) =>
          H_LINES.map((y) => (
            <div
              key={`d${x}-${y}`}
              style={{ position: "absolute", left: x - 1, top: y - 1, width: 3, height: 3, borderRadius: 9999, background: C.dot }}
            />
          )),
        )}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: W,
            height: H,
            background: "radial-gradient(70% 60% at 50% 0%, rgba(61,252,154,0.06), transparent 70%)",
          }}
        />
        {COLUMNS.flatMap((col) =>
          col.glyphs.map((g, i) => (
            <div
              key={`g${col.x}-${i}`}
              style={{
                position: "absolute",
                left: col.x - 8,
                top: g.y,
                width: 16,
                display: "flex",
                justifyContent: "center",
                fontSize: 18,
                color: g.head ? C.head : C.mint,
                opacity: g.a,
              }}
            >
              {g.ch}
            </div>
          )),
        )}
        <div
          style={{
            position: "absolute",
            left: 128,
            top: 150,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", fontSize: 26, color: C.gray2, letterSpacing: 1 }}>
            <span style={{ color: C.mint }}>{`guest@${SITE.host}`}</span>
            <span>:~$ whoami</span>
            <div style={{ display: "flex", width: 15, height: 30, marginLeft: 10, background: C.mint }} />
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 18,
              fontSize: 132,
              lineHeight: 1,
              letterSpacing: -4,
              color: C.title,
              textTransform: "uppercase",
              textShadow: `5px 7px 0 ${C.shadow}`,
            }}
          >
            {SITE.name}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 30,
              fontSize: 26,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: C.mint,
            }}
          >
            {`${SITE.role} · Proxmox homelab`}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: W,
            height: 1,
            background: "linear-gradient(to right, transparent, rgba(61,252,154,0.3) 30%, rgba(61,252,154,0.3) 70%, transparent)",
          }}
        />
      </div>
    ),
    { ...OG_SIZE },
  );
}
