// Asset rendering helpers for the scripts/assets/*.mjs generators.
// Owned by Foundation (read-only for builders).
//
// Uses playwright-core driving the locally installed Chrome (no browser
// download) and sharp for webp/jpg encoding. Every function shares one
// browser; call closeBrowser() when a script is done.
//
//   import { renderSvg, renderHtml, renderUrl, renderPdf, closeBrowser } from "../lib/render.mjs";
//   await renderSvg(svgString, "public/room/room-still.webp", { width: 1700, height: 1460, format: "webp" });
//   await renderUrl("http://localhost:3000/dev/room-still", "public/room/room-still.webp",
//                   { width: 1700, height: 1460, selector: "[data-still]", transparent: true });
//   await renderPdf(htmlString, "public/resume.pdf", { format: "Letter" });
//   await closeBrowser();
//
// Env: CHROME_PATH overrides the Chrome executable.

import { chromium } from "playwright-core";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

let browserPromise = null;

/** Shared headless Chrome instance. */
export function getBrowser() {
  if (!browserPromise) browserPromise = chromium.launch({ executablePath: CHROME, headless: true });
  return browserPromise;
}

/** Close the shared browser (call once at the end of a script). */
export async function closeBrowser() {
  if (!browserPromise) return;
  const b = await browserPromise;
  browserPromise = null;
  await b.close();
}

/** Output format from options or the file extension. */
function formatOf(outPath, format) {
  if (format) return format === "jpeg" ? "jpg" : format;
  const ext = path.extname(outPath).slice(1).toLowerCase();
  if (ext === "jpeg") return "jpg";
  if (ext === "webp" || ext === "jpg" || ext === "png") return ext;
  return "png";
}

/**
 * Encode a PNG buffer to the requested format and write it.
 * @param {Buffer} png
 * @param {string} outPath
 * @param {{ format?: "png"|"webp"|"jpg", quality?: number, transparent?: boolean, background?: string }} opts
 */
export async function writeImage(png, outPath, { format, quality = 86, transparent = true, background = "#080808" } = {}) {
  const fmt = formatOf(outPath, format);
  await fs.mkdir(path.dirname(path.resolve(outPath)), { recursive: true });
  let img = sharp(png);
  if (fmt === "jpg" || !transparent) img = img.flatten({ background });
  if (fmt === "webp") img = img.webp({ quality, alphaQuality: 100, effort: 5 });
  else if (fmt === "jpg") img = img.jpeg({ quality, mozjpeg: true });
  else img = img.png({ compressionLevel: 9 });
  await img.toFile(outPath);
  return outPath;
}

async function newPage({ width, height, deviceScaleFactor = 1, reducedMotion = "reduce" }) {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor,
    reducedMotion,
  });
  const page = await context.newPage();
  return { page, context };
}

/**
 * Render arbitrary HTML (inline styles and fonts only, or absolute URLs) to an image.
 * @param {string} html  full document or a fragment (wrapped in a bare document)
 * @param {string} outPath
 * @param {{ width: number, height: number, format?: string, transparent?: boolean, selector?: string,
 *           deviceScaleFactor?: number, quality?: number, background?: string, wait?: number }} opts
 */
export async function renderHtml(html, outPath, opts) {
  const { width, height, transparent = true, selector, wait = 0 } = opts;
  const doc = /<html[\s>]/i.test(html)
    ? html
    : `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent}</style></head><body>${html}</body></html>`;
  const { page, context } = await newPage(opts);
  try {
    await page.setContent(doc, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    if (wait) await page.waitForTimeout(wait);
    const png = selector
      ? await page.locator(selector).first().screenshot({ omitBackground: transparent })
      : await page.screenshot({ omitBackground: transparent, clip: { x: 0, y: 0, width, height } });
    return await writeImage(png, outPath, opts);
  } finally {
    await context.close();
  }
}

/**
 * Render an SVG string at an exact pixel size (the svg is stretched to width x height).
 * @param {string} svg
 * @param {string} outPath
 * @param {{ width: number, height: number, format?: "png"|"webp"|"jpg", transparent?: boolean,
 *           quality?: number, background?: string, deviceScaleFactor?: number }} opts
 */
export async function renderSvg(svg, outPath, opts) {
  const { width, height } = opts;
  const doc = `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:transparent;width:${width}px;height:${height}px;overflow:hidden}
    body>svg{display:block;width:${width}px;height:${height}px}
  </style></head><body>${svg}</body></html>`;
  return renderHtml(doc, outPath, opts);
}

/**
 * Screenshot a URL (for example a /dev/* route on the running dev server).
 * @param {string} url
 * @param {string} outPath
 * @param {{ width: number, height: number, selector?: string, transparent?: boolean, format?: string,
 *           fullPage?: boolean, wait?: number, waitFor?: string, deviceScaleFactor?: number,
 *           reducedMotion?: "reduce"|"no-preference", quality?: number, background?: string }} opts
 */
export async function renderUrl(url, outPath, opts) {
  const { width, height, selector, transparent = false, fullPage = false, wait = 300, waitFor } = opts;
  const { page, context } = await newPage(opts);
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    if (waitFor) await page.waitForSelector(waitFor, { timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    // Hide Next dev overlays/indicators if present.
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    if (transparent) {
      await page.addStyleTag({ content: "html,body{background:transparent!important}" });
    }
    if (wait) await page.waitForTimeout(wait);
    const png = selector
      ? await page.locator(selector).first().screenshot({ omitBackground: transparent })
      : await page.screenshot({
          omitBackground: transparent,
          fullPage,
          ...(fullPage ? {} : { clip: { x: 0, y: 0, width, height } }),
        });
    return await writeImage(png, outPath, { transparent, ...opts });
  } finally {
    await context.close();
  }
}

/**
 * Print HTML (or a URL when `opts.url` is set and html is null) to a PDF.
 * @param {string|null} html
 * @param {string} outPath
 * @param {{ format?: string, url?: string, margin?: object, landscape?: boolean, printBackground?: boolean }} opts
 */
export async function renderPdf(html, outPath, opts = {}) {
  const { format = "Letter", url, margin = { top: "0", right: "0", bottom: "0", left: "0" }, landscape = false } = opts;
  const browser = await getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    if (url) await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    else await page.setContent(html ?? "", { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await fs.mkdir(path.dirname(path.resolve(outPath)), { recursive: true });
    await page.pdf({ path: outPath, format, margin, landscape, printBackground: opts.printBackground ?? true });
    return outPath;
  } finally {
    await context.close();
  }
}
