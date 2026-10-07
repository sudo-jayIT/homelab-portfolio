import { PANEL_IDS, type PanelId } from "@/components/lab/contracts";
import { PANELS } from "@/components/lab/panels";
import { PanelsPreview } from "./PanelsPreview";

/**
 * /dev/panels: every room focus panel rendered standalone and flat (no lift
 * transform, chrome visible) over a dimmed room backdrop, with a switcher.
 *   ?p=<panel id>   initial panel (monitor, resume, badge, phone, record, print,
 *                   map, poster, cert-1..cert-4)
 *   ?bare           hide the switcher (clean screenshots)
 *   ?music=0        record panel without the "stop the music" key
 * The credential card render target for scripts/assets/panels.mjs is ./cert/[id].
 */
export default async function PanelsDevPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const p = typeof sp.p === "string" ? sp.p : "";
  const initial: PanelId = (PANEL_IDS as readonly string[]).includes(p) && p in PANELS ? (p as PanelId) : "monitor";
  return <PanelsPreview initial={initial} bare={sp.bare !== undefined} music={sp.music !== "0"} />;
}
