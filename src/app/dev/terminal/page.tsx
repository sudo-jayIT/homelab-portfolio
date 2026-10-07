import type { Metadata } from "next";
import { isScenario } from "./scenarios";
import { TerminalLab } from "./TerminalLab";

export const metadata: Metadata = { title: "dev · terminal" };

/**
 * /dev/terminal: the tty console in every mode, driven by a small stand-in
 * for the room engine (console boot, power-up wait, shell drop-down, power
 * down). Query: ?s=intro|login|reboot|shell|busy, ?user=name (autoplay name),
 * ?bare (hide the dev toolbar for screenshots).
 */
export default async function DevTerminalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const s = typeof sp.s === "string" && isScenario(sp.s) ? sp.s : "intro";
  const user = typeof sp.user === "string" && sp.user ? sp.user : "guest";
  return <TerminalLab initial={s} user={user} bare={sp.bare !== undefined} />;
}
