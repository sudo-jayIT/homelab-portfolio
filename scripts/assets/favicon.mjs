// Favicon generator: the header's "KG" monogram keycap (Mint Terminal,
// docs/theme/b.md) as a 16/32/48 px ICO at src/app/favicon.ico.
//
//   node scripts/assets/favicon.mjs        (the dev server must be running)
//
// The page is rendered on the dev server so it gets the site's Geist Mono
// (next/font); each size is drawn at 8x and downscaled with sharp, then the
// PNGs are packed into one ICO. Env: BASE_URL (default http://localhost:3000).

import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getBrowser, closeBrowser } from "../lib/render.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const out = path.join(root, "src/app/favicon.ico");
const base = process.env.BASE_URL || "http://localhost:3000";
const SIZES = [16, 32, 48];
const SCALE = 8;

const browser = await getBrowser();
const page = await browser.newPage({ viewport: { width: 400, height: 400 }, deviceScaleFactor: 1 });
await page.goto(`${base}/dev`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

/** Draw the keycap at `size` CSS px; the 16 px icon gets larger, tighter letters. */
async function draw(size, small) {
  await page.evaluate(
    ({ size, small }) => {
      document.documentElement.style.background = "transparent";
      document.body.style.background = "transparent";
      document.body.innerHTML = "";
      const el = document.createElement("div");
      el.id = "favicon";
      const rim = Math.max(1, Math.round(size / 32));
      Object.assign(el.style, {
        position: "fixed",
        left: "0",
        top: "0",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${Math.round(size * 0.22)}px`,
        background: "linear-gradient(#202825, #151b18)",
        boxShadow: `inset 0 0 0 ${rim}px rgba(61, 252, 154, ${small ? 0.55 : 0.4})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        fontWeight: "800",
        color: "#3dfc9a",
        fontSize: `${Math.round(size * (small ? 0.58 : 0.42))}px`,
        letterSpacing: small ? "-0.1em" : "-0.02em",
        lineHeight: "1",
      });
      el.textContent = "KG";
      document.body.appendChild(el);
    },
    { size, small },
  );
  return page.locator("#favicon").screenshot({ omitBackground: true });
}

const pngs = [];
for (const s of SIZES) {
  const big = await draw(s * SCALE, s <= 16);
  pngs.push(await sharp(big).resize(s, s, { kernel: "lanczos3" }).png().toBuffer());
}
await closeBrowser();

// ICO container: 6-byte header, one 16-byte entry per image, then the PNGs.
const head = Buffer.alloc(6);
head.writeUInt16LE(0, 0);
head.writeUInt16LE(1, 2);
head.writeUInt16LE(pngs.length, 4);
const dir = Buffer.alloc(16 * pngs.length);
let offset = head.length + dir.length;
pngs.forEach((png, i) => {
  const o = i * 16;
  dir.writeUInt8(SIZES[i], o);
  dir.writeUInt8(SIZES[i], o + 1);
  dir.writeUInt16LE(1, o + 4);
  dir.writeUInt16LE(32, o + 6);
  dir.writeUInt32LE(png.length, o + 8);
  dir.writeUInt32LE(offset, o + 12);
  offset += png.length;
});
await fs.writeFile(out, Buffer.concat([head, dir, ...pngs]));
console.log(`${path.relative(root, out)}: ${SIZES.join(", ")} px, ${offset} bytes`);
