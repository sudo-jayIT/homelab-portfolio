// Generates the Projects and Websites preview images (spec 06 section 9, spec 08 section 9).
//
//   node scripts/assets/work.mjs                     (all assets)
//   node scripts/assets/work.mjs ai-agent-jumpbox    (one asset by name)
//
// Output:
//   public/previews/ai-agent-jumpbox.png       1280 x 800 PNG: architecture diagram (project 1)
//   public/previews/pentest-report.png         1280 x 800 PNG: report cover page (project 2)
//   public/previews/merged-network-design.png  1280 x 800 PNG: topology diagram (project 3)
//   (project 4, the homelab, uses the CSS placeholder strip)
//   public/sites/harbor-bakery.webp            1400 x 875 WebP (client site 1, websites section)
//   public/sites/northgate-bikes.webp          1400 x 875 WebP (client site 2, websites section)
//
// Every image is an original illustration written as HTML + inline SVG and
// rendered in headless Chrome (scripts/lib/render.mjs). Randomness is seeded,
// so reruns are identical. Project previews are dark (they fade into the
// #0a0d19 card) and keep their key content in the top half, because the
// desktop card shows only the top ~54% of a 16:10 image. Site previews are
// shown uncropped. Fonts come from Google Fonts (OFL); nothing references a
// real brand's artwork.

import { renderHtml, closeBrowser } from "../lib/render.mjs";

/* ------------------------------------------------------------------------ */
/* Helpers                                                                   */
/* ------------------------------------------------------------------------ */

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (n) => Math.round(n * 100) / 100;

/** Full HTML document at a fixed size with Google Fonts loaded. */
function doc({ fonts, css, body, width, height }) {
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?${fonts}&display=block" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${width}px;height:${height}px;overflow:hidden;-webkit-font-smoothing:antialiased}
${css}
</style></head><body>${body}</body></html>`;
}

/* ------------------------------------------------------------------------ */
/* Project previews: shared dark diagram style (1280 x 800)                  */
/* ------------------------------------------------------------------------ */

// Neutral dark palette shared by the three project illustrations. Each one is
// an honest, original drawing of what the resume describes (an architecture,
// a report cover, a topology), not a screenshot of a real product.
const INK = {
  bg: "#0a0d17",
  panel: "#111726",
  panel2: "#0e1320",
  line: "#273047",
  text: "#e6e9f0",
  muted: "#8a93a8",
  faint: "#566079",
  teal: "#5eead4",
  amber: "#f5b84a",
  violet: "#a78bfa",
  sky: "#7dd3fc",
  rose: "#fb7185",
};

const PREVIEW_FONTS = "family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600";

/** Page chrome: dark background with a soft top glow and a dot grid that fades out. */
const PREVIEW_CSS = `
body{background:${INK.bg};color:${INK.text};font-family:Inter,system-ui,sans-serif;position:relative}
.bg{position:absolute;inset:0;background:
  radial-gradient(70% 55% at 50% 0%,rgba(125,211,252,.07),transparent 70%),
  radial-gradient(rgba(255,255,255,.06) 1px,transparent 1.2px) 0 0/22px 22px;
  -webkit-mask-image:linear-gradient(180deg,#000 55%,transparent);mask-image:linear-gradient(180deg,#000 55%,transparent)}
.mono{font-family:"JetBrains Mono",ui-monospace,monospace}
.kick{position:absolute;left:56px;top:34px;font:500 13px/1 "JetBrains Mono",monospace;letter-spacing:.24em;text-transform:uppercase;color:${INK.muted}}
.kick b{color:${INK.teal};font-weight:600}
svg text{font-family:"JetBrains Mono",ui-monospace,monospace}
`;

/** Rounded node box with a title and sub lines (SVG). */
function node(x, y, w, h, { title, sub = [], accent = INK.sky, tag = null }) {
  const lines = sub
    .map((s, i) => `<text x="${x + 22}" y="${y + 66 + i * 22}" font-size="14" fill="${INK.muted}">${s}</text>`)
    .join("");
  const tagEl = tag
    ? `<text x="${x + w - 18}" y="${y + h - 16}" font-size="11" fill="${accent}" text-anchor="end" letter-spacing="2">${tag}</text>`
    : "";
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${INK.panel}" stroke="${INK.line}" stroke-width="1.5"/>
    <rect x="${x}" y="${y + 14}" width="4" height="${h - 28}" rx="2" fill="${accent}"/>
    <text x="${x + 22}" y="${y + 38}" font-size="19" font-weight="600" fill="${INK.text}" style="font-family:Inter,sans-serif">${title}</text>
    ${tagEl}${lines}
  </g>`;
}

/** Arrow from (x1,y1) to (x2,y2) with an optional label above its middle. */
function arrow(x1, y1, x2, y2, { label = "", color = INK.faint, dashed = false, dy = -10 } = {}) {
  const id = `ah${Math.round(x1)}${Math.round(y1)}${Math.round(x2)}${Math.round(y2)}`;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="${color}"/></marker></defs>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" ${dashed ? 'stroke-dasharray="6 6"' : ""} marker-end="url(#${id})"/>
    ${label ? `<text x="${r2(mx)}" y="${r2(my + dy)}" font-size="12.5" fill="${INK.muted}" text-anchor="middle" letter-spacing="1">${label}</text>` : ""}`;
}

/* ------------------------------------------------------------------------ */
/* 1. Self-hosted AI agent jumpbox: architecture diagram                     */
/* ------------------------------------------------------------------------ */

function jumpboxArchitecture() {
  const W = 1280;
  const H = 800;
  const R = mulberry32(3841);

  // 384-dim embedding as a 24 x 16 cell strip (values are decorative).
  let cells = "";
  for (let i = 0; i < 384; i++) {
    const c = i % 24;
    const r = Math.floor(i / 24);
    const v = R();
    const col = v > 0.82 ? INK.teal : v > 0.55 ? "#2b6b66" : v > 0.3 ? "#1d3a44" : "#151d2c";
    cells += `<rect x="${60 + c * 14}" y="${520 + r * 14}" width="11" height="11" rx="2" fill="${col}"/>`;
  }

  // HNSW: three layers of a small proximity graph, sparse on top, dense below.
  const layers = [
    { y: 520, n: 3 },
    { y: 600, n: 6 },
    { y: 680, n: 11 },
  ];
  const pts = layers.map(({ y, n }, li) =>
    Array.from({ length: n }, (_, i) => [r2(520 + (i + 0.5) * (300 / n) + (R() - 0.5) * 10), r2(y + (R() - 0.5) * 14), li]),
  );
  let graph = "";
  pts.forEach((layer, li) => {
    graph += `<rect x="500" y="${layers[li].y - 26}" width="340" height="52" rx="10" fill="none" stroke="${INK.line}" stroke-dasharray="3 5"/>`;
    for (let i = 0; i < layer.length - 1; i++) {
      const [ax, ay] = layer[i];
      const [bx, by] = layer[i + 1];
      graph += `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="#2f4d5a" stroke-width="1.6"/>`;
      if (i + 2 < layer.length && R() > 0.5) {
        const [cx, cy] = layer[i + 2];
        graph += `<path d="M${ax} ${ay} Q${r2((ax + cx) / 2)} ${r2(ay - 18)} ${cx} ${cy}" fill="none" stroke="#2f4d5a" stroke-width="1.2"/>`;
      }
    }
  });
  // The search path drops from the top layer to the nearest neighbour below.
  const path = [pts[0][1], pts[1][3], pts[2][6]];
  graph += `<polyline points="${path.map(([x, y]) => `${x},${y}`).join(" ")}" fill="none" stroke="${INK.amber}" stroke-width="2.2" stroke-dasharray="5 4"/>`;
  pts.flat().forEach(([x, y]) => {
    graph += `<circle cx="${x}" cy="${y}" r="5" fill="${INK.panel}" stroke="#4b8f8a" stroke-width="1.6"/>`;
  });
  path.forEach(([x, y]) => {
    graph += `<circle cx="${x}" cy="${y}" r="6.5" fill="${INK.amber}"/>`;
  });

  const checks = ["view-only firewall user", "no shell access", "random, unrecoverable password", "no standing write credentials"]
    .map(
      (t, i) => `<g transform="translate(900 ${510 + i * 44})">
        <rect width="26" height="26" rx="7" fill="rgba(94,234,212,.12)" stroke="rgba(94,234,212,.45)"/>
        <path d="M7 13.5 L11.5 18 L19.5 8.5" fill="none" stroke="${INK.teal}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="40" y="18" font-size="15" fill="${INK.text}">${t}</text>
      </g>`,
    )
    .join("");

  const svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="position:absolute;inset:0">
    <!-- jumpbox boundary around the MCP server and its memory store -->
    <rect x="392" y="74" width="846" height="196" rx="20" fill="rgba(94,234,212,.025)" stroke="rgba(94,234,212,.35)" stroke-dasharray="7 7"/>
    <text x="414" y="98" font-size="12" fill="${INK.teal}" letter-spacing="3">SELF-HOSTED JUMPBOX</text>

    ${node(56, 140, 270, 150, { title: "LLM agents", sub: ["call tools over MCP", "remember across sessions"], accent: INK.violet, tag: "CLIENT" })}
    ${node(430, 116, 296, 136, { title: "Custom MCP server", sub: ["memory: write · search", "firewall: read-only"], accent: INK.teal, tag: "MCP" })}
    ${node(886, 116, 330, 136, { title: "PostgreSQL 17 + pgvector", sub: ["HNSW index", "384-dim embeddings"], accent: INK.sky, tag: "MEMORY" })}
    ${node(886, 300, 330, 120, { title: "OPNsense API", sub: ["view-only user", "scoped API key"], accent: INK.amber, tag: "FIREWALL" })}

    ${arrow(326, 200, 428, 192, { label: "MCP" })}
    ${arrow(726, 184, 884, 184, { label: "similarity search" })}
    <path d="M680 252 V360 H882" fill="none" stroke="${INK.faint}" stroke-width="2" stroke-dasharray="6 6"/>
    <path d="M874 354 L884 360 L874 366 Z" fill="${INK.faint}"/>
    <text x="694" y="346" font-size="12.5" fill="${INK.muted}" letter-spacing="1">read-only key</text>

    <!-- lower band: what the memory and the integration look like -->
    <text x="60" y="494" font-size="12" fill="${INK.muted}" letter-spacing="3">384-DIM EMBEDDING</text>
    ${cells}
    <text x="500" y="474" font-size="12" fill="${INK.muted}" letter-spacing="3">HNSW LAYERS</text>
    ${graph}
    <text x="900" y="474" font-size="12" fill="${INK.muted}" letter-spacing="3">LEAST PRIVILEGE</text>
    ${checks}
  </svg>`;

  const body = `<div class="bg"></div>
<div class="kick"><b>Architecture</b> · self-hosted AI agent jumpbox</div>
${svg}`;
  return doc({ fonts: PREVIEW_FONTS, css: PREVIEW_CSS, body, width: W, height: H });
}

/* ------------------------------------------------------------------------ */
/* 2. Penetration test report: cover page                                    */
/* ------------------------------------------------------------------------ */

function pentestReportCover() {
  const W = 1280;
  const H = 800;
  const sections = [
    ["01", "Affected systems & attack surface"],
    ["02", "Root cause & exploit path"],
    ["03", "Business & technical impact"],
    ["04", "Prioritized remediation"],
  ]
    .map(([n, t]) => `<li><span class="n">${n}</span><span class="t">${t}</span><span class="dots"></span></li>`)
    .join("");
  const scale = [
    ["Critical", INK.rose],
    ["High", INK.amber],
    ["Medium", "#facc15"],
    ["Low", INK.sky],
  ]
    .map(([t, c]) => `<span class="sev"><i style="background:${c}"></i>${t}</span>`)
    .join("");
  const css = `${PREVIEW_CSS}
.desk{position:absolute;inset:0;background:radial-gradient(60% 70% at 50% 18%,rgba(245,184,74,.06),transparent 70%)}
.page{position:absolute;left:170px;top:58px;width:940px;height:900px;border-radius:10px;background:linear-gradient(180deg,#141a2a,#0f1422);
  border:1.5px solid ${INK.line};box-shadow:0 40px 90px -30px rgba(0,0,0,.9),inset 0 1px 0 rgba(255,255,255,.04);padding:46px 64px}
.page:before{content:"";position:absolute;left:0;top:0;bottom:0;width:10px;border-radius:10px 0 0 10px;background:${INK.rose};opacity:.8}
.top{display:flex;justify-content:space-between;font:500 12.5px/1 "JetBrains Mono",monospace;letter-spacing:.26em;text-transform:uppercase;color:${INK.muted}}
.top b{color:${INK.rose};font-weight:600}
h1{margin-top:44px;font:800 76px/.92 Inter,sans-serif;letter-spacing:-.025em;text-transform:uppercase;color:${INK.text}}
.sub{margin-top:18px;font:500 20px/1.4 Inter,sans-serif;color:#b9c0d0}
.meta{margin-top:26px;display:flex;gap:12px;flex-wrap:wrap}
.chip{font:500 13px/1 "JetBrains Mono",monospace;letter-spacing:.06em;padding:9px 13px;border-radius:999px;border:1px solid ${INK.line};color:${INK.text};background:rgba(255,255,255,.03)}
.chip.hot{border-color:rgba(251,113,133,.5);color:${INK.rose};background:rgba(251,113,133,.08)}
.scale{margin-top:30px;padding-top:22px;border-top:1px solid ${INK.line};display:flex;align-items:center;gap:22px;font:500 13px/1 "JetBrains Mono",monospace;color:${INK.muted}}
.scale .lbl{letter-spacing:.2em;text-transform:uppercase;margin-right:6px}
.sev{display:inline-flex;align-items:center;gap:8px;color:${INK.text}}
.sev i{width:12px;height:12px;border-radius:3px}
ul{list-style:none;margin-top:34px}
li{display:flex;align-items:baseline;gap:18px;padding:13px 0;border-bottom:1px dashed ${INK.line};font:500 19px/1.2 Inter,sans-serif;color:${INK.text}}
li .n{font:600 14px/1 "JetBrains Mono",monospace;color:${INK.rose};width:28px}
li .dots{flex:1}
.redact{margin-top:30px;display:grid;gap:10px}
.redact i{display:block;height:12px;border-radius:3px;background:#1c2335}
`;
  const body = `<div class="bg"></div><div class="desk"></div>
<div class="page">
  <div class="top"><span><b>Lab exercise</b> · controlled environment</span><span>Report</span></div>
  <h1>Penetration<br>test report</h1>
  <p class="sub">Windows 10 targets in an isolated lab: exploitation, a risk assessment for every finding, and a remediation plan.</p>
  <div class="meta"><span class="chip hot">5+ known vulnerabilities exploited</span><span class="chip">Windows 10</span><span class="chip">risk per finding</span></div>
  <div class="scale"><span class="lbl">Risk rating</span>${scale}</div>
  <ul>${sections}</ul>
  <div class="redact"><i style="width:92%"></i><i style="width:78%"></i><i style="width:85%"></i></div>
</div>`;
  return doc({ fonts: PREVIEW_FONTS, css, body, width: W, height: H });
}

/* ------------------------------------------------------------------------ */
/* 3. Capstone: merged network design topology                               */
/* ------------------------------------------------------------------------ */

function mergedNetworkTopology() {
  const W = 1280;
  const H = 800;

  /** A small device glyph: firewall (brick), switch (ports), server (stack) or endpoint (screen). */
  const dev = (kind, x, y, color) => {
    if (kind === "fw") {
      return `<g transform="translate(${x - 26} ${y - 18})"><rect width="52" height="36" rx="6" fill="${INK.panel}" stroke="${color}" stroke-width="1.8"/>
        <path d="M0 12 H52 M0 24 H52 M17 0 V12 M35 12 V24 M17 24 V36" stroke="${color}" stroke-opacity=".7" stroke-width="1.4"/></g>`;
    }
    if (kind === "sw") {
      let ports = "";
      for (let i = 0; i < 6; i++) ports += `<rect x="${7 + i * 10}" y="12" width="6" height="6" rx="1" fill="${color}" fill-opacity=".8"/>`;
      return `<g transform="translate(${x - 36} ${y - 15})"><rect width="72" height="30" rx="6" fill="${INK.panel}" stroke="${color}" stroke-width="1.8"/>${ports}</g>`;
    }
    if (kind === "srv") {
      return `<g transform="translate(${x - 22} ${y - 26})">${[0, 18, 36]
        .map((dy) => `<rect y="${dy}" width="44" height="15" rx="3" fill="${INK.panel}" stroke="${color}" stroke-width="1.6"/><circle cx="36" cy="${dy + 7.5}" r="2.2" fill="${color}"/>`)
        .join("")}</g>`;
    }
    return `<g transform="translate(${x - 18} ${y - 14})"><rect width="36" height="24" rx="3" fill="${INK.panel}" stroke="${color}" stroke-width="1.6"/><path d="M12 30 H24 M18 24 V30" stroke="${color}" stroke-width="1.6"/></g>`;
  };
  const wire = (x1, y1, x2, y2, color = "#34405c", dashed = false) =>
    `<path d="M${x1} ${y1} C${r2((x1 + x2) / 2)} ${y1} ${r2((x1 + x2) / 2)} ${y2} ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="2" ${dashed ? 'stroke-dasharray="6 6"' : ""}/>`;
  const label = (x, y, t, color = INK.muted, anchor = "middle", size = 12.5) =>
    `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" letter-spacing="1.5">${t}</text>`;

  const A = INK.sky;
  const B = INK.violet;
  const C = INK.teal;

  const svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="position:absolute;inset:0">
    <!-- site A -->
    <rect x="48" y="78" width="300" height="330" rx="18" fill="rgba(125,211,252,.03)" stroke="rgba(125,211,252,.35)"/>
    ${label(70, 104, "SITE A · SATELLITE CO.", A, "start", 12)}
    ${wire(198, 168, 198, 232)}
    ${dev("fw", 198, 150, A)}
    ${dev("sw", 198, 246, A)}
    ${wire(170, 261, 110, 330)}${wire(198, 261, 198, 330)}${wire(226, 261, 286, 330)}
    ${dev("ep", 110, 344, A)}${dev("ep", 198, 344, A)}${dev("srv", 286, 352, A)}

    <!-- site B -->
    <rect x="932" y="78" width="300" height="330" rx="18" fill="rgba(167,139,250,.03)" stroke="rgba(167,139,250,.35)"/>
    ${label(954, 104, "SITE B · IMAGING CO.", B, "start", 12)}
    ${wire(1082, 168, 1082, 232)}
    ${dev("fw", 1082, 150, B)}
    ${dev("sw", 1082, 246, B)}
    ${wire(1054, 261, 994, 330)}${wire(1082, 261, 1082, 330)}${wire(1110, 261, 1170, 330)}
    ${dev("srv", 994, 352, B)}${dev("srv", 1082, 352, B)}${dev("ep", 1170, 344, B)}

    <!-- merged core with the compliant segment -->
    <rect x="420" y="96" width="440" height="310" rx="20" fill="rgba(94,234,212,.035)" stroke="rgba(94,234,212,.5)" stroke-width="1.6"/>
    ${label(640, 126, "MERGED CORE · ONE ARCHITECTURE", C, "middle", 12.5)}
    ${wire(348, 150, 520, 186, "#3c4a68")}${wire(932, 150, 760, 186, "#3c4a68")}
    ${dev("fw", 520, 186, C)}${dev("fw", 760, 186, C)}
    ${wire(546, 186, 610, 250, "#3c4a68")}${wire(734, 186, 670, 250, "#3c4a68")}
    ${dev("sw", 640, 252, C)}
    <rect x="470" y="290" width="340" height="98" rx="12" fill="rgba(251,113,133,.05)" stroke="rgba(251,113,133,.55)" stroke-dasharray="6 5"/>
    ${label(640, 312, "HIPAA-COMPLIANT ZONE", INK.rose, "middle", 12)}
    ${wire(640, 267, 640, 290, "#3c4a68")}
    ${dev("srv", 590, 358, INK.rose)}${dev("srv", 690, 358, INK.rose)}

    <!-- disaster recovery -->
    <rect x="500" y="452" width="280" height="96" rx="16" fill="${INK.panel2}" stroke="${INK.line}" stroke-width="1.5"/>
    ${label(640, 480, "DR SITE · RECOVERY COPY", INK.amber, "middle", 12)}
    ${dev("srv", 600, 518, INK.amber)}${dev("srv", 680, 518, INK.amber)}
    ${wire(640, 406, 640, 452, INK.amber, true)}
    ${label(652, 430, "replication", INK.muted, "start", 12)}
  </svg>`;

  const plan = ["HIPAA-compliant topology", "disaster recovery procedures", "risk analysis"]
    .map((t) => `<span class="pl"><i></i>${t}</span>`)
    .join("");
  const css = `${PREVIEW_CSS}
.plan{position:absolute;left:56px;right:56px;top:596px;display:flex;align-items:center;gap:18px;flex-wrap:wrap;padding-top:22px;border-top:1px solid ${INK.line}}
.plan .lbl{font:500 12.5px/1 "JetBrains Mono",monospace;letter-spacing:.24em;text-transform:uppercase;color:${INK.muted};margin-right:8px}
.pl{display:inline-flex;align-items:center;gap:10px;font:500 15px/1 Inter,sans-serif;color:${INK.text};padding:10px 14px;border:1px solid ${INK.line};border-radius:999px;background:rgba(255,255,255,.025)}
.pl i{width:9px;height:9px;border-radius:99px;background:${INK.teal}}
`;
  const body = `<div class="bg"></div>
<div class="kick"><b>Capstone</b> · merged network design</div>
${svg}
<div class="plan"><span class="lbl">Security plan</span>${plan}</div>`;
  return doc({ fonts: PREVIEW_FONTS, css, body, width: W, height: H });
}

/* ------------------------------------------------------------------------ */
/* Client site 1: Harbor Street Bakery (light, 1400 x 875)                   */
/* ------------------------------------------------------------------------ */

/** Round scored loaf (boule) centred at 0,0, radius ~1 unit scaled by s. */
function boule(x, y, s, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <ellipse cx="4" cy="62" rx="98" ry="16" fill="#3b2414" opacity=".18"/>
    <path d="M-100 20C-100-48-54-86 0-86S100-48 100 20C100 52 60 66 0 66S-100 52-100 20Z" fill="url(#crust)"/>
    <path d="M-100 20C-100-48-54-86 0-86S100-48 100 20" fill="none" stroke="#6e3a17" stroke-opacity=".35" stroke-width="3"/>
    <path d="M-62-30C-30-58 30-58 62-30" fill="none" stroke="#f3dcb2" stroke-width="9" stroke-linecap="round"/>
    <path d="M-66-30C-32-62 32-62 66-30" fill="none" stroke="#9a5a26" stroke-width="2" stroke-linecap="round" opacity=".6"/>
    <path d="M-46 4C-18-14 18-14 46 4" fill="none" stroke="#f3dcb2" stroke-width="7" stroke-linecap="round"/>
    <path d="M-30 32C-10 22 10 22 30 32" fill="none" stroke="#efd2a2" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="-30" cy="-58" rx="36" ry="14" fill="#fff6e2" opacity=".28"/>
  </g>`;
}

/** Croissant: seven pillow segments along an arch, largest in the middle, tips drooping. */
function croissant(x, y, s, rot = 0) {
  const rx = [14, 20, 24, 28, 24, 20, 14];
  const ry = [16, 24, 30, 36, 30, 24, 16];
  const segs = rx.map((w, i) => {
    const deg = 215 + (i * (325 - 215)) / 6;
    const a = (deg * Math.PI) / 180;
    const rad = i === 0 || i === 6 ? 92 : 100;
    const cx = Math.cos(a) * rad;
    const cy = 110 + Math.sin(a) * rad;
    return `<ellipse cx="${r2(cx)}" cy="${r2(cy)}" rx="${w}" ry="${ry[i]}" transform="rotate(${r2(deg - 270)} ${r2(cx)} ${r2(cy)})" fill="url(#flake)" stroke="#7a3f14" stroke-opacity=".5" stroke-width="2"/>`;
  });
  // Tips first, centre last, so the middle segment sits in front.
  const order = [0, 6, 1, 5, 2, 4, 3];
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <ellipse cx="0" cy="78" rx="96" ry="12" fill="#3b2414" opacity=".16"/>
    ${order.map((i) => segs[i]).join("")}
    <ellipse cx="-4" cy="-4" rx="9" ry="18" fill="#fff3d6" opacity=".3"/>
  </g>`;
}

/** Baguette with diagonal scores. */
function baguette(x, y, s, rot = 0) {
  const cuts = [-90, -45, 0, 45, 90]
    .map((c) => `<path d="M${c - 16} -6Q${c} -16 ${c + 18} -10" fill="none" stroke="#f1d6a8" stroke-width="6" stroke-linecap="round"/>`)
    .join("");
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <ellipse cx="0" cy="26" rx="150" ry="10" fill="#3b2414" opacity=".14"/>
    <rect x="-150" y="-24" width="300" height="46" rx="23" fill="url(#crust2)"/>
    ${cuts}
    <rect x="-130" y="-20" width="240" height="8" rx="4" fill="#fff4dc" opacity=".22"/>
  </g>`;
}

function harborBakery() {
  const W = 1400;
  const H = 875;
  const R = mulberry32(911);
  let flour = "";
  for (let i = 0; i < 70; i++) {
    flour += `<circle cx="${r2(60 + R() * 440)}" cy="${r2(80 + R() * 420)}" r="${r2(0.8 + R() * 1.8)}" fill="#fffaf0" opacity="${r2(0.35 + R() * 0.5)}"/>`;
  }
  const art = `<svg width="560" height="600" viewBox="0 0 560 600">
    <defs>
      <radialGradient id="crust" cx=".4" cy=".25" r=".9"><stop offset="0" stop-color="#e2a35c"/><stop offset=".55" stop-color="#b8692b"/><stop offset="1" stop-color="#7c3f15"/></radialGradient>
      <linearGradient id="crust2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfa158"/><stop offset=".6" stop-color="#b56a2c"/><stop offset="1" stop-color="#83451a"/></linearGradient>
      <radialGradient id="flake" cx=".45" cy=".3" r=".8"><stop offset="0" stop-color="#f6c579"/><stop offset=".6" stop-color="#d48a3c"/><stop offset="1" stop-color="#9c5520"/></radialGradient>
      <linearGradient id="arch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9b48f"/><stop offset="1" stop-color="#d48c62"/></linearGradient>
      <pattern id="cloth" width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="#f4ecdf"/><rect width="14" height="28" fill="#1f3f63" opacity=".14"/><rect width="28" height="14" fill="#1f3f63" opacity=".14"/></pattern>
    </defs>
    <path d="M40 600V250C40 120 150 30 280 30S520 120 520 250V600Z" fill="url(#arch)"/>
    <path d="M40 600V250C40 120 150 30 280 30S520 120 520 250V600Z" fill="none" stroke="#1f3f63" stroke-opacity=".12" stroke-width="2"/>
    ${flour}
    <path d="M70 470 L300 420 L520 470 L520 600 L40 600Z" fill="url(#cloth)" opacity=".95"/>
    <path d="M70 470 L300 420 L520 470" fill="none" stroke="#1f3f63" stroke-opacity=".15" stroke-width="2"/>
    ${baguette(285, 300, 0.95, -24)}
    ${boule(200, 430, 1.05)}
    ${croissant(392, 452, 0.95, -6)}
  </svg>`;
  const css = `
body{background:#f6efe3;color:#2b2118;font-family:"DM Sans",system-ui,sans-serif;position:relative}
.nav{height:84px;display:flex;align-items:center;padding:0 64px;gap:40px;border-bottom:1px solid #e6dac6}
.logo{display:flex;align-items:center;gap:12px}
.logo .t{font-family:Fraunces,serif;font-weight:600;font-size:24px;letter-spacing:-.01em;color:#1f3f63;line-height:1}
.logo .s{font-size:10.5px;letter-spacing:.24em;text-transform:uppercase;color:#a0643a;margin-top:4px}
.links{display:flex;gap:30px;margin-left:30px;font-size:15px;color:#4e4135}
.links .on{color:#1f3f63;font-weight:600;box-shadow:0 2px 0 #d48c62;padding-bottom:4px}
.sp{flex:1}
.ph{font-size:14px;color:#6f6152}
.cta{background:#1f3f63;color:#f6efe3;font-weight:600;font-size:14.5px;padding:13px 22px;border-radius:999px}
.hero{display:grid;grid-template-columns:1fr 560px;gap:40px;padding:42px 64px 0 64px;height:620px}
.eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:12.5px;letter-spacing:.2em;text-transform:uppercase;color:#a0643a;margin-top:64px}
.eyebrow i{width:28px;height:1.5px;background:#a0643a}
h1{font-family:Fraunces,serif;font-weight:500;font-size:76px;line-height:1.02;letter-spacing:-.025em;color:#1f2a38;margin-top:22px;font-variation-settings:"SOFT" 50,"opsz" 120}
h1 em{font-style:italic;color:#b5602e;font-weight:400}
.lead{font-size:18.5px;line-height:1.6;color:#5d4e40;max-width:520px;margin-top:24px}
.row{display:flex;gap:14px;margin-top:34px;align-items:center}
.b1{background:#b5602e;color:#fff8ee;font-weight:600;font-size:15.5px;padding:15px 26px;border-radius:999px}
.b2{border:1.5px solid #2b2118;font-weight:600;font-size:15.5px;padding:13.5px 24px;border-radius:999px}
.note{display:flex;align-items:center;gap:12px;margin-top:40px;font-size:14px;color:#6f6152}
.note .dots{display:flex}
.note .dots span{width:34px;height:34px;border-radius:50%;border:2px solid #f6efe3;margin-left:-8px;background:#d9b48c}
.note .dots span:first-child{margin-left:0;background:#c98b5c}
.note .dots span:nth-child(3){background:#8aa1b8}
.art{position:relative}
.badge{position:absolute;left:-26px;top:120px;background:#fffaf2;border-radius:16px;padding:14px 18px;box-shadow:0 18px 40px -18px rgba(60,35,15,.45);display:flex;gap:12px;align-items:center}
.badge .sun{width:38px;height:38px;border-radius:50%;background:#f3c66b;display:grid;place-items:center}
.badge b{display:block;font-size:14.5px;color:#1f2a38}
.badge small{font-size:12px;color:#7a6a5a}
.stamp{position:absolute;right:6px;top:70px;width:104px;height:104px;border-radius:50%;background:#1f3f63;color:#f6efe3;display:grid;place-items:center;text-align:center;font-family:Fraunces,serif;font-size:13px;line-height:1.2;transform:rotate(10deg)}
.stamp b{display:block;font-size:26px;font-weight:600}
.strip{position:absolute;left:0;right:0;bottom:0;height:130px;background:#1f3f63;display:grid;grid-template-columns:repeat(4,1fr);padding:0 64px;align-items:center;color:#e9e1d2}
.f{display:flex;gap:14px;align-items:center;padding-right:20px}
.f i{width:44px;height:44px;border-radius:50%;border:1.5px solid #d48c62;display:grid;place-items:center;flex-shrink:0}
.f b{display:block;font-size:15px;color:#fff8ee;font-weight:600}
.f small{font-size:13px;color:#b6c2d1}
`;
  const icon = (d) =>
    `<i><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e9b48f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg></i>`;
  const body = `
<div class="nav">
  <div class="logo"><svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="#1f3f63"/><path d="M20 9v22M20 14c-4-2-6 0-7 2 3 1 5 0 7-2zm0 0c4-2 6 0 7 2-3 1-5 0-7-2zm0 6c-4-2-6 0-7 2 3 1 5 0 7-2zm0 0c4-2 6 0 7 2-3 1-5 0-7-2zm0 6c-4-2-6 0-7 2 3 1 5 0 7-2zm0 0c4-2 6 0 7 2-3 1-5 0-7-2z" fill="#f3c66b" stroke="#f3c66b" stroke-width="1"/></svg>
    <div><div class="t">Harbor Street</div><div class="s">bakery &amp; coffee</div></div></div>
  <div class="links"><span class="on">Today's case</span><span>Cakes</span><span>Catering</span><span>Our story</span><span>Visit</span></div>
  <div class="sp"></div>
  <div class="ph">(253) 555-0142</div>
  <div class="cta">Order for pickup</div>
</div>
<div class="hero">
  <div>
    <div class="eyebrow"><i></i>Baked on Harbor Street since 1998</div>
    <h1>Bread worth <em>getting up</em> early for.</h1>
    <p class="lead">Naturally leavened loaves, buttery pastries and celebration cakes, baked before sunrise and gone by mid-afternoon.</p>
    <div class="row"><span class="b1">Reserve a cake</span><span class="b2">See today's case →</span></div>
    <div class="note"><div class="dots"><span></span><span></span><span></span></div>Loved by 2,400 neighbors · 4.9 average rating</div>
  </div>
  <div class="art">${art}
    <div class="badge"><span class="sun"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7a4a12" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></span><div><b>Fresh at 6:00 a.m.</b><small>Sourdough sells out by noon</small></div></div>
    <div class="stamp"><div><b>25</b>years on<br>the harbor</div></div>
  </div>
</div>
<div class="strip">
  <div class="f">${icon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')}<div><b>Open daily</b><small>6 a.m. to 3 p.m.</small></div></div>
  <div class="f">${icon('<path d="M4 20h16M6 20V11h12v9M9 11V8m6 3V8M12 11V6"/>')}<div><b>Custom cakes</b><small>Reserve 48 hours ahead</small></div></div>
  <div class="f">${icon('<path d="M12 21c-5-3-8-7-8-11a8 8 0 0 1 16 0c0 4-3 8-8 11z"/><path d="M12 7v7"/>')}<div><b>Local flour</b><small>Milled two hours away</small></div></div>
  <div class="f">${icon('<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 17v2m10-2v2"/>')}<div><b>Easy pickup</b><small>Free parking out back</small></div></div>
</div>`;
  return doc({
    fonts: "family=Fraunces:ital,opsz,wght,SOFT@0,9..144,400..700,0..100;1,9..144,400..700,0..100&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600",
    css,
    body,
    width: W,
    height: H,
  });
}

/* ------------------------------------------------------------------------ */
/* Client site 2: Northgate Bicycle Repair (bold, 1400 x 875)                */
/* ------------------------------------------------------------------------ */

/** Line-art bicycle, wheels of radius 96 centred at (0,0) and (300,0). */
function bicycle(x, y, s, stroke = "#f4ead8") {
  const wheel = (cx) => {
    let spokes = "";
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      spokes += `<line x1="${cx}" y1="0" x2="${r2(cx + Math.cos(a) * 86)}" y2="${r2(Math.sin(a) * 86)}" stroke="${stroke}" stroke-opacity=".55" stroke-width="1.6"/>`;
    }
    return `<circle cx="${cx}" cy="0" r="96" fill="none" stroke="#141414" stroke-width="13"/>
      <circle cx="${cx}" cy="0" r="96" fill="none" stroke="${stroke}" stroke-width="3"/>
      <circle cx="${cx}" cy="0" r="86" fill="none" stroke="${stroke}" stroke-width="3"/>${spokes}
      <circle cx="${cx}" cy="0" r="9" fill="${stroke}"/>`;
  };
  let teeth = "";
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    teeth += `<circle cx="${r2(130 + Math.cos(a) * 30)}" cy="${r2(Math.sin(a) * 30)}" r="2.6" fill="${stroke}"/>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})" stroke-linecap="round" stroke-linejoin="round">
    ${wheel(0)}${wheel(300)}
    <path d="M0 0L130 0L95-120L0 0" fill="none" stroke="#ff7a3d" stroke-width="10"/>
    <path d="M130 0L245-110L95-120" fill="none" stroke="#ff7a3d" stroke-width="10"/>
    <path d="M300 0L245-110L232-150" fill="none" stroke="#ff7a3d" stroke-width="9"/>
    <path d="M232-150C250-160 270-162 284-150C292-142 286-130 274-128" fill="none" stroke="${stroke}" stroke-width="7"/>
    <path d="M95-120L86-150" fill="none" stroke="${stroke}" stroke-width="7"/>
    <path d="M58-158C72-166 104-166 118-156C108-150 76-150 58-158Z" fill="${stroke}" stroke="${stroke}" stroke-width="5"/>
    <circle cx="130" cy="0" r="30" fill="none" stroke="${stroke}" stroke-width="4"/>${teeth}
    <path d="M130-30L0-9M130 30L0 9" fill="none" stroke="${stroke}" stroke-opacity=".7" stroke-width="2.5"/>
    <path d="M130 0L150 30M144 30h18" fill="none" stroke="${stroke}" stroke-width="5"/>
  </g>`;
}

function northgateBikes() {
  const W = 1400;
  const H = 875;
  const tiers = [
    ["Quick check", "$35", "Brakes, gears, tire pressure and a safety once-over while you wait."],
    ["Full tune-up", "$95", "Everything in the quick check, plus hub, headset and drivetrain service.", true],
    ["Overhaul", "$210", "Strip, clean and rebuild. For bikes that spent the winter outside."],
  ]
    .map(
      ([n, p, d, hot]) =>
        `<div class="tier${hot ? " hot" : ""}">${hot ? '<span class="pop">Most booked</span>' : ""}<div class="tn">${n}</div><div class="tp">${p}</div><div class="td">${d}</div></div>`,
    )
    .join("");
  const css = `
body{background:#123528;color:#f4ead8;font-family:Inter,system-ui,sans-serif;position:relative}
.nav{height:86px;display:flex;align-items:center;padding:0 60px;gap:36px}
.logo{display:flex;align-items:center;gap:12px}
.mark{width:42px;height:42px;border-radius:11px;background:#ff7a3d;display:grid;place-items:center}
.wm{font-family:"Bricolage Grotesque",sans-serif;font-weight:800;font-size:23px;letter-spacing:-.01em;line-height:1;font-variation-settings:"wdth" 80}
.wm small{display:block;font-family:Inter,sans-serif;font-weight:500;font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:#9fc2b0;margin-top:4px}
.links{display:flex;gap:30px;margin-left:24px;font-size:15px;color:#cfe0d6}
.sp{flex:1}
.hours{display:flex;align-items:center;gap:8px;font-size:13.5px;color:#cfe0d6}
.hours i{width:8px;height:8px;border-radius:50%;background:#7ee08f}
.cta{background:#ff7a3d;color:#1b0d04;font-weight:700;font-size:14.5px;padding:13px 22px;border-radius:10px}
.hero{display:grid;grid-template-columns:1fr 600px;padding:30px 60px 0;height:500px}
.tag{display:inline-flex;gap:8px;align-items:center;font-size:12.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#ffb48c;border:1px solid #ff7a3d66;border-radius:99px;padding:7px 14px;margin-top:40px}
h1{font-family:"Bricolage Grotesque",sans-serif;font-weight:800;font-size:88px;line-height:.95;letter-spacing:-.02em;margin-top:24px;font-variation-settings:"wdth" 88}
h1 span{color:#ff7a3d}
.lead{font-size:18.5px;line-height:1.6;color:#c4d8cc;max-width:540px;margin-top:24px}
.row{display:flex;gap:14px;margin-top:32px}
.b1{background:#f4ead8;color:#123528;font-weight:700;font-size:15.5px;padding:15px 24px;border-radius:10px}
.b2{border:1.5px solid #f4ead866;font-weight:600;font-size:15.5px;padding:13.5px 22px;border-radius:10px}
.art{position:relative}
.disc{position:absolute;left:70px;top:10px;width:460px;height:460px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#1c4a39,#0f2e22 70%);border:1px solid #2b5c48}
.ring{position:absolute;left:40px;top:-20px;width:520px;height:520px;border-radius:50%;border:1.5px dashed #ff7a3d55}
.bike{position:absolute;left:0;top:0}
.chip{position:absolute;background:#f4ead8;color:#123528;border-radius:14px;padding:11px 15px;box-shadow:0 20px 40px -20px #000;font-size:13px}
.chip b{display:block;font-size:15px}
.c1{left:-56px;top:398px}
.c2{right:6px;top:40px}
.stars{color:#ff7a3d;letter-spacing:2px}
.tiers{position:absolute;left:60px;right:60px;bottom:0;height:250px;display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.tier{position:relative;background:#f4ead8;color:#163a2c;border-radius:18px 18px 0 0;padding:26px 28px}
.tier.hot{background:#ff7a3d;color:#1b0d04}
.pop{position:absolute;right:20px;top:22px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;background:#1b0d04;color:#ff7a3d;padding:5px 10px;border-radius:99px}
.tn{font-size:14px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;opacity:.75}
.tp{font-family:"Bricolage Grotesque",sans-serif;font-weight:800;font-size:58px;letter-spacing:-.03em;margin-top:8px;line-height:1}
.td{font-size:15px;line-height:1.55;margin-top:12px;max-width:330px;opacity:.85}
`;
  const body = `
<div class="nav">
  <div class="logo"><span class="mark"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1b0d04" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="16" r="4"/><circle cx="18" cy="16" r="4"/><path d="M6 16l4-8h5l3 8M10 8l2 8"/></svg></span>
    <div class="wm">NORTHGATE<small>bicycle repair co.</small></div></div>
  <div class="links"><span>Services</span><span>Pricing</span><span>Rentals</span><span>Visit the shop</span></div>
  <div class="sp"></div>
  <div class="hours"><i></i>Open today until 6 p.m.</div>
  <div class="cta">Book a tune-up</div>
</div>
<div class="hero">
  <div>
    <div class="tag">Olympia, WA · since 2015</div>
    <h1>Fixed this week,<br><span>not next month.</span></h1>
    <p class="lead">Two mechanics, honest prices and a booking calendar that shows real openings. Drop your bike off in the morning, ride it home the same week.</p>
    <div class="row"><span class="b1">See open slots</span><span class="b2">Compare services</span></div>
  </div>
  <div class="art">
    <div class="ring"></div><div class="disc"></div>
    <svg class="bike" width="600" height="500" viewBox="0 0 600 500">${bicycle(110, 330, 1.04)}</svg>
    <div class="chip c1"><span class="stars">★★★★★</span><b>“Back on the road in two days.”</b></div>
    <div class="chip c2"><b>3 slots left</b>this Thursday</div>
  </div>
</div>
<div class="tiers">${tiers}</div>`;
  return doc({
    fonts: "family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,600..800&family=Inter:wght@400;500;600;700",
    css,
    body,
    width: W,
    height: H,
  });
}

/* ------------------------------------------------------------------------ */
/* Run                                                                       */
/* ------------------------------------------------------------------------ */

const JOBS = {
  "ai-agent-jumpbox": () =>
    renderHtml(jumpboxArchitecture(), "public/previews/ai-agent-jumpbox.png", { width: 1280, height: 800, transparent: false }),
  "pentest-report": () =>
    renderHtml(pentestReportCover(), "public/previews/pentest-report.png", { width: 1280, height: 800, transparent: false }),
  "merged-network-design": () =>
    renderHtml(mergedNetworkTopology(), "public/previews/merged-network-design.png", { width: 1280, height: 800, transparent: false }),
  "harbor-bakery": () =>
    renderHtml(harborBakery(), "public/sites/harbor-bakery.webp", { width: 1400, height: 875, transparent: false, quality: 88 }),
  "northgate-bikes": () =>
    renderHtml(northgateBikes(), "public/sites/northgate-bikes.webp", { width: 1400, height: 875, transparent: false, quality: 88 }),
};

const only = process.argv.slice(2);
try {
  for (const [name, job] of Object.entries(JOBS)) {
    if (only.length && !only.includes(name)) continue;
    const out = await job();
    console.log("wrote", out);
  }
} finally {
  await closeBrowser();
}
