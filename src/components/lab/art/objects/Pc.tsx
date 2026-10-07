import { iso } from "@/lib/iso";
import { PC } from "../config";
import { PcCase } from "./PcCase";

/** The same cut-corner chassis as the inspector, projected into the room. */
export function Pc() {
  return <PcCase project={([u, v, z]) => iso(PC.x + u, PC.y + PC.d - v, PC.z + z)} />;
}
