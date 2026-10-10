// Generates public/previews/homelab-dashboard.png for the "Homelab Status
// Dashboard" project card.
//
// Deliberately does NOT screenshot the live dashboard. The live page prints
// every real device name, IP and up/down state in plain pixels — reasonable
// on a LAN-only break-glass page, not reasonable baked into a portfolio
// image. Instead this serves the REAL dashboard frontend (the actual
// www/{index.html,app.js,style.css} from the dashboard project — same code,
// same CSS, same look) against FABRICATED sample node data in the same
// /api/status shape the real poller returns, so the screenshot is faithful
// to the real UI with none of the real topology.
//
//   DASHBOARD_WWW=../dashboard/www node scripts/assets/capture-dashboard-preview.mjs
//
// Requires a Chrome/Chromium binary (CHROME_PATH env, see render.mjs) with
// its runtime libraries available — see docs/BUILD-NOTES.md if this is a
// minimal Debian host with no browser installed.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { renderUrl, closeBrowser } from "../lib/render.mjs";

const WWW = process.env.DASHBOARD_WWW || "../dashboard/www";
const PORT = Number(process.env.CAPTURE_PORT || 8999);
const OUT = "public/previews/homelab-dashboard.png";

const rtt = (n) => Array.from({ length: n }, () => Math.round((1 + Math.random() * 6) * 10) / 10);

// Generic, non-routable-looking sample data. Names and addresses are
// fictional role placeholders, not the real inventory.
const SAMPLE = {
  generated_epoch: Date.now() / 1000,
  age_seconds: 22,
  targets: [
    { name: "Edge Firewall", ip: "10.20.0.1", link: "https://10.20.0.1", state: "up", checks: { web: true }, latency_ms: 4, latency_history: rtt(20) },
    { name: "Core Switch", ip: "10.20.0.2", link: "http://10.20.0.2", state: "up", checks: { web: true }, latency_ms: 10, latency_history: rtt(20) },
    { name: "Hypervisor 1", ip: "10.20.0.10", link: "https://10.20.0.10:8006", state: "up", checks: { host: true, proxmox: true }, latency_ms: 7, latency_history: rtt(20) },
    { name: "Hypervisor 2", ip: "10.20.0.11", link: "https://10.20.0.11:8006", state: "up", checks: { host: true, proxmox: true }, latency_ms: 6, latency_history: rtt(20) },
    { name: "File Server", ip: "10.20.0.20", link: "https://10.20.0.20", state: "up", checks: { web: true }, latency_ms: 5, latency_history: rtt(20) },
    { name: "Jumpbox", ip: "10.20.0.30", link: "http://10.20.0.30", state: "up", checks: { ssh: true }, latency_ms: 3, latency_history: rtt(20) },
    { name: "NAS", ip: "10.20.0.40", link: "http://10.20.0.40", state: "up", checks: { nfs: true }, latency_ms: 4, latency_history: rtt(20) },
    { name: "Access Point", ip: "10.20.0.50", link: "https://10.20.0.50", state: "up", checks: { web: true }, latency_ms: 3, latency_history: rtt(20) },
    { name: "IoT Bridge", ip: "10.20.0.60", link: "http://10.20.0.60", state: "up", checks: { api: true }, latency_ms: 1, latency_history: rtt(20) },
  ],
};

const MIME = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css" };

function startFakeServer() {
  const wwwAbs = path.resolve(WWW);
  const server = http
    .createServer((req, res) => {
      if (req.url === "/api/status" || req.url === "/status") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(SAMPLE));
        return;
      }
      const file = req.url === "/" ? "/index.html" : req.url;
      const fp = path.join(wwwAbs, file);
      if (!fp.startsWith(wwwAbs) || !fs.existsSync(fp)) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      res.writeHead(200, { "content-type": MIME[path.extname(fp)] || "application/octet-stream" });
      fs.createReadStream(fp).pipe(res);
    })
    .listen(PORT, "127.0.0.1");
  return server;
}

const server = startFakeServer();
try {
  await new Promise((resolve) => server.once("listening", resolve));
  await renderUrl(`http://127.0.0.1:${PORT}/`, OUT, { width: 1280, height: 800, transparent: false, wait: 700 });
  console.log("wrote", OUT);
} finally {
  server.close();
  await closeBrowser();
}
