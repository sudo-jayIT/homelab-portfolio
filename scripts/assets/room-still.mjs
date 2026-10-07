// Renders the landing still of the lit room (spec 03 "Room still composition",
// spec 04 section 9) from the /dev/room-still route on the running dev server:
// 1700 x 1460 WebP with a transparent background, the room bounds landing
// exactly 10 px inside every edge (STILL.viewBox in contracts.ts).
//
//   node scripts/assets/room-still.mjs [baseUrl]
//
// Rerun after changing the room art, the wall art rasters (/lab/print.webp,
// /lab/poster.webp) or the certificate wall config.

import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { closeBrowser, renderUrl } from "../lib/render.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const base = process.argv[2] || process.env.DEV_URL || "http://localhost:3000";
const out = path.join(root, "public/room/room-still.webp");

try {
  await renderUrl(`${base}/dev/room-still`, out, {
    width: 1700,
    height: 1460,
    selector: "[data-still]",
    waitFor: "[data-still] svg[data-cam]",
    transparent: true,
    reducedMotion: "reduce",
    format: "webp",
    quality: 90,
    wait: 800,
  });

  // Report the opaque bounds so the 10 px margin can be checked at a glance.
  const { data, info } = await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  console.log(`${path.relative(root, out)}: ${info.width}x${info.height}, opaque bounds x ${minX}..${maxX}, y ${minY}..${maxY}`);
} finally {
  await closeBrowser();
}
