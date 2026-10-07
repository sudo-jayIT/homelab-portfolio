import { INITIAL_VIEWBOX } from "@/components/lab/contracts";
import { RoomBase } from "@/components/lab/art/RoomBase";
import { RoomLights } from "@/components/lab/art/RoomLights";
import { RoomArtPreview } from "./Preview";

/**
 * Room art preview (B3). Query options:
 *   ?dark        start in the dark (unpowered) state
 *   ?vb=x,y,w,h  viewBox override (default the static INITIAL_VIEWBOX)
 *   ?hot         outline the 23 hotspot polygons, markers and tooltip anchors
 *   ?ui=0        hide the toolbar (clean screenshots)
 *   ?still       freeze packets as in the landing still (no ambient loops)
 */
export default async function RoomArtPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]);
  const vbParam = one("vb");
  const viewBox = vbParam ? vbParam.split(",").map(Number).join(" ") : INITIAL_VIEWBOX;
  const lit = one("dark") === undefined;
  const still = one("still") !== undefined;
  return (
    <RoomArtPreview
      base={<RoomBase lit={lit} viewBox={viewBox} />}
      lights={<RoomLights lit={lit} viewBox={viewBox} stillPackets={still} />}
      viewBox={viewBox}
      initialLit={lit}
      showUi={one("ui") !== "0"}
      showHot={one("hot") !== undefined}
      ambient={!still}
    />
  );
}
