// Generates the About asset (spec 09 section 9).
//
//   node scripts/assets/about.mjs            (all assets)
//   node scripts/assets/about.mjs portrait   (one asset by name)
//
// Output:
//   public/about/portrait.webp   840 x 1120 (3:4) PLACEHOLDER portrait: a faceless
//                                silhouette until the owner supplies a portrait image
//
// Painted on a <canvas> in headless Chrome (scripts/lib/render.mjs), seeded so
// reruns are identical. HELPERS is a small shared canvas toolkit injected into
// every page; not every helper is used by the current scene.

import { renderHtml, closeBrowser } from "../lib/render.mjs";

/* ------------------------------------------------------------------------ */
/* Shared canvas helpers, injected into every page                           */
/* ------------------------------------------------------------------------ */

const HELPERS = String.raw`
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const c = document.getElementById("c");
const W = c.width, H = c.height;
const g = c.getContext("2d");
const R = mulberry32(SEED);
const rand = (a, b) => a + R() * (b - a);
const pick = (arr) => arr[Math.floor(R() * arr.length)];
const gauss = () => (R() + R() + R() + R() - 2) / 2;
const rgba = (col, a) => "rgba(" + col[0] + "," + col[1] + "," + col[2] + "," + a + ")";
const TAU = Math.PI * 2;

function vgrad(y0, y1, stops) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  return gr;
}
function fillV(y0, y1, stops, x = 0, w = W) {
  g.fillStyle = vgrad(y0, y1, stops);
  g.fillRect(x, y0, w, y1 - y0);
}
function glow(x, y, r, col, a, ctx = g) {
  const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(col, a));
  gr.addColorStop(0.35, rgba(col, a * 0.45));
  gr.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}
function softGlow(x, y, r, col, a, ctx = g) {
  const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(col, a));
  gr.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}
function stars(n, y0, y1, maxA, tint) {
  for (let i = 0; i < n; i++) {
    const x = rand(0, W), y = rand(y0, y1);
    const a = Math.pow(R(), 3) * maxA;
    const r = R() < 0.04 ? rand(1.2, 2) : rand(0.4, 1.1);
    g.fillStyle = rgba(tint ? pick(tint) : [255, 255, 255], a);
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    if (r > 1.3) softGlow(x, y, r * 5, [200, 215, 255], a * 0.25);
  }
}
/** Slight lens softness so vector edges read as optics, not graphics. */
function soften(px) {
  const [o, oc] = offscreen();
  oc.drawImage(c, 0, 0);
  g.save(); g.filter = "blur(" + px + "px)"; g.drawImage(o, 0, 0); g.restore();
}
function grain(amount) {
  soften(0.8);
  const d = g.getImageData(0, 0, W, H), a = d.data;
  for (let i = 0; i < a.length; i += 4) {
    const n = (R() - 0.5) * amount;
    a[i] += n; a[i + 1] += n; a[i + 2] += n;
  }
  g.putImageData(d, 0, 0);
}
function vignette(strength, inner = 0.35) {
  const gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * inner, W / 2, H / 2, Math.hypot(W, H) / 2);
  gr.addColorStop(0, "rgba(0,0,0,0)");
  gr.addColorStop(1, "rgba(0,0,0," + strength + ")");
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
}
/** Ridge line by midpoint displacement, returns y values for x = 0..W step. */
function ridge(n, base, rough, peakX, peakH, peakW) {
  let pts = [base + gauss() * rough, base + gauss() * rough];
  let amp = rough;
  while (pts.length < n) {
    const next = [];
    for (let i = 0; i < pts.length - 1; i++) {
      next.push(pts[i], (pts[i] + pts[i + 1]) / 2 + gauss() * amp);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
    amp *= 0.55;
  }
  return pts.map((y, i) => {
    const x = (i / (pts.length - 1)) * W;
    const d = (x - peakX) / peakW;
    return y - peakH * Math.exp(-d * d);
  });
}
function fillRidge(ys, col, bottom = H) {
  g.fillStyle = col;
  g.beginPath(); g.moveTo(0, bottom);
  ys.forEach((y, i) => g.lineTo((i / (ys.length - 1)) * W, y));
  g.lineTo(W, bottom); g.closePath(); g.fill();
}
function offscreen() {
  const o = document.createElement("canvas");
  o.width = W; o.height = H;
  return [o, o.getContext("2d")];
}
/** Mirror everything above y into the area below it (water reflection). */
function reflect(y, { blur = 4, alpha = 0.55, squash = 1 } = {}) {
  const [o, oc] = offscreen();
  oc.drawImage(c, 0, 0);
  g.save();
  g.beginPath(); g.rect(0, y, W, H - y); g.clip();
  g.globalAlpha = alpha;
  g.filter = "blur(" + blur + "px)";
  g.translate(0, y);
  g.scale(1, -squash);
  g.drawImage(o, 0, -y);
  g.restore();
}
function ripples(y0, y1, n, col, maxA) {
  for (let i = 0; i < n; i++) {
    const t = R();
    const y = y0 + (y1 - y0) * Math.pow(t, 1.6);
    const w = rand(40, 260) * (0.4 + t);
    const x = rand(-50, W);
    g.fillStyle = rgba(col, rand(0.1, 1) * maxA);
    g.fillRect(x, y, w, rand(1, 2 + t * 3));
  }
}
`;

/* ------------------------------------------------------------------------ */
/* Scenes                                                                    */
/* ------------------------------------------------------------------------ */

const SCENES = {
  /* 3:4 Placeholder portrait: a faceless head-and-shoulders silhouette with rim light. */
  portrait: {
    w: 840, h: 1120, seed: 1001, out: "public/about/portrait.webp",
    draw: String.raw`
      // studio backdrop
      g.fillStyle = "#2c2f38"; g.fillRect(0, 0, W, H);
      const bg = g.createRadialGradient(W * 0.46, H * 0.3, 40, W * 0.5, H * 0.4, H * 0.8);
      bg.addColorStop(0, "#7d7a86"); bg.addColorStop(0.45, "#4c4d5a"); bg.addColorStop(1, "#1d1f27");
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      // figure mask: head, neck and shoulders filled as separate shapes (a clean union)
      const cx = W * 0.5, headY = H * 0.34;
      function figure(ctx, fill) {
        ctx.fillStyle = fill;
        ctx.beginPath(); ctx.ellipse(cx, headY, 116, 148, 0, 0, TAU); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - 60, headY + 100);
        ctx.lineTo(cx - 70, headY + 230);
        ctx.bezierCurveTo(cx - 190, headY + 255, cx - 330, headY + 300, cx - 380, headY + 470);
        ctx.lineTo(cx - 420, H + 10);
        ctx.lineTo(cx + 420, H + 10);
        ctx.lineTo(cx + 380, headY + 470);
        ctx.bezierCurveTo(cx + 330, headY + 300, cx + 190, headY + 255, cx + 70, headY + 230);
        ctx.lineTo(cx + 60, headY + 100);
        ctx.closePath(); ctx.fill();
      }
      const [mask, mc] = offscreen();
      figure(mc, "#000");
      // soft shadow on the backdrop
      g.save(); g.filter = "blur(30px)"; g.globalAlpha = 0.45; g.drawImage(mask, 26, 18); g.restore();
      // body with a vertical gradient (source-in on a copy of the mask)
      const [bodyC, bc] = offscreen();
      bc.drawImage(mask, 0, 0);
      bc.globalCompositeOperation = "source-in";
      const body = bc.createLinearGradient(0, headY - 160, 0, H);
      body.addColorStop(0, "#2a2d39"); body.addColorStop(0.5, "#1c1f29"); body.addColorStop(1, "#121419");
      bc.fillStyle = body; bc.fillRect(0, 0, W, H);
      g.drawImage(bodyC, 0, 0);
      // rim light from the upper left: mask minus the mask shifted down-right
      const [rim, rc] = offscreen();
      rc.drawImage(mask, 0, 0);
      rc.globalCompositeOperation = "source-in";
      rc.fillStyle = "rgba(235,220,196,1)"; rc.fillRect(0, 0, W, H);
      rc.globalCompositeOperation = "destination-out";
      rc.drawImage(mask, 16, 12);
      const [rimSoft, rs] = offscreen();
      rs.filter = "blur(10px)"; rs.drawImage(rim, 0, 0); rs.filter = "none";
      rs.globalCompositeOperation = "destination-in"; rs.drawImage(mask, 0, 0);
      g.save(); g.globalAlpha = 0.4; g.drawImage(rimSoft, 0, 0); g.restore();
      // collar hint
      g.strokeStyle = "rgba(255,255,255,0.06)"; g.lineWidth = 6;
      g.beginPath(); g.moveTo(cx - 70, headY + 232); g.lineTo(cx, headY + 330); g.lineTo(cx + 70, headY + 232); g.stroke();
      vignette(0.45, 0.4);
      grain(8);
    `,
  },
};

function pageFor(name) {
  const s = SCENES[name];
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:#000}
    canvas{display:block}
  </style></head><body>
  <canvas id="c" width="${s.w}" height="${s.h}"></canvas>
  <script>
    const SEED = ${s.seed};
    ${HELPERS}
    ${s.draw}
  </script></body></html>`;
}

const only = process.argv[2];
const names = Object.keys(SCENES).filter((n) => !only || n === only);
for (const name of names) {
  const s = SCENES[name];
  const out = s.out;
  await renderHtml(pageFor(name), out, {
    width: s.w,
    height: s.h,
    format: "webp",
    quality: 80,
    transparent: false,
    selector: "canvas",
  });
  console.log("wrote", out);
}
await closeBrowser();
