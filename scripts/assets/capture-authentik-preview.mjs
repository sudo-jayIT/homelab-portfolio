// Generates public/previews/authentik-sso.png for the "Centralized SSO
// Gateway" project card: a real screenshot of the live Authentik login
// screen. Safe to capture as-is — it's Authentik's generic default branding
// (stock background, "Welcome to authentik!"), with no account-specific or
// network-specific data on screen.
//
//   AUTHENTIK_URL=http://<host>:9000/if/flow/default-authentication-flow/ \
//     node scripts/assets/capture-authentik-preview.mjs
//
// Requires network access to a running Authentik instance, and a
// Chrome/Chromium binary (CHROME_PATH env, see render.mjs).

import { renderUrl, closeBrowser } from "../lib/render.mjs";

const URL = process.env.AUTHENTIK_URL;
const OUT = "public/previews/authentik-sso.png";

if (!URL) {
  console.error("Set AUTHENTIK_URL to the login flow URL of a reachable Authentik instance.");
  process.exit(1);
}

try {
  await renderUrl(URL, OUT, { width: 1280, height: 800, transparent: false, wait: 800 });
  console.log("wrote", OUT);
} finally {
  await closeBrowser();
}
