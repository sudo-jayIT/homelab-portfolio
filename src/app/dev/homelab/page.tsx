/**
 * /dev/homelab (B7): the homelab section on the classic page background,
 * then a rack inspector demo. `?inspect=<part>` (rack, switch-5, switch-8,
 * pve1..pve4, pi, zima, nas, pdu) opens the inspector on load.
 */

import { Homelab } from "@/components/sections/Homelab";
import { isPart } from "@/lib/rack";
import { InspectorDemo } from "./InspectorDemo";

export default async function DevHomelab({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const q = (await searchParams).inspect;
  const inspect = typeof q === "string" && isPart(q) ? q : null;
  return (
    <main>
      <div className="relative overflow-clip bg-background">
        <Homelab />
      </div>
      <section id="inspector" className="border-t border-line">
        <InspectorDemo open={inspect} />
      </section>
    </main>
  );
}
