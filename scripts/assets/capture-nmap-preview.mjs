// Generates public/previews/nmap-command-builder.png for the "Nmap Command
// Builder" project card: a real screenshot of the actual app, run locally,
// with the target field filled in against scanme.nmap.org — the Nmap
// project's own public test host, not a real or private target.
//
// Needs the app's own dev servers running first (see
// ../../../nmap-command-builder/README.md):
//   cd ../nmap-command-builder/backend && npm install && npm start   # :4173
//   cd ../nmap-command-builder/frontend && npm install && npx vite --port 5173 --host 127.0.0.1
// then, from this project's root:
//   node scripts/assets/capture-nmap-preview.mjs
//
// Uses playwright-core directly (not render.mjs's renderUrl) because this
// capture needs to fill a form and check boxes, not just load a URL.
// Requires a Chrome/Chromium binary (CHROME_PATH env).

import { chromium } from "playwright-core";

const CHROME = process.env.CHROME_PATH;
const TARGET_URL = process.env.NMAP_BUILDER_URL || "http://127.0.0.1:5173/";
const OUT = "public/previews/nmap-command-builder.png";

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const page = await context.newPage();
try {
  await page.goto(TARGET_URL, { waitUntil: "networkidle", timeout: 30000 });
  await page.getByPlaceholder("192.168.1.0/24, scanme.nmap.org, 10.0.0.1-50").fill("scanme.nmap.org");
  await page.getByRole("checkbox", { name: /Service\/version detection/i }).check();
  await page.getByRole("checkbox", { name: /^OS detection/i }).check();
  const topPorts = page.getByRole("radio", { name: /Top ports/i }).first();
  if (await topPorts.count()) await topPorts.check();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: 1280, height: 800 } });
  console.log("wrote", OUT);
} finally {
  await context.close();
  await browser.close();
}
