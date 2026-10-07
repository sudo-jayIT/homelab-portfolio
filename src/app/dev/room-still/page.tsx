import { STILL } from "@/components/lab/contracts";
import { RoomBase } from "@/components/lab/art/RoomBase";
import { RoomLights } from "@/components/lab/art/RoomLights";

/**
 * Render target for /room/room-still.webp (spec 03 "Room still composition",
 * spec 04 section 9). The lit room at STILL.viewBox (ROOM padded by 5.39 units)
 * fills a 1700 x 1460 box, so the room bounds land 10 px inside every edge.
 * scripts/assets/room-still.mjs screenshots [data-still] with a transparent
 * background and reduced motion (LEDs steady, record still).
 */
export default function RoomStillPage() {
  return (
    <div data-still="" className="relative" style={{ width: STILL.width, height: STILL.height }}>
      <RoomBase lit viewBox={STILL.viewBox} />
      <RoomLights lit viewBox={STILL.viewBox} stillPackets />
    </div>
  );
}
