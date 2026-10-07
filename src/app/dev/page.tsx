import Link from "next/link";

const ROUTES: { href: string; owner: string; what: string }[] = [
  { href: "/dev/chrome", owner: "B1", what: "header, mobile menu, grid and rain background, rain divider, footer" },
  { href: "/dev/hero", owner: "B2", what: "landing hero and room door" },
  { href: "/dev/room-art", owner: "B3", what: "room scene art (base + lights)" },
  { href: "/dev/room-still", owner: "B3", what: "1700x1460 still render target" },
  { href: "/dev/room", owner: "B4", what: "room engine: camera, hotspots, HUD, focus" },
  { href: "/dev/terminal", owner: "B5", what: "intro terminal and shell" },
  { href: "/dev/panels", owner: "B6", what: "room focus panels" },
  { href: "/dev/homelab", owner: "B7", what: "homelab section and rack inspector" },
  { href: "/dev/work", owner: "B8", what: "projects, websites, experience" },
  { href: "/dev/about", owner: "B9", what: "about, contact" },
];

export default function DevIndex() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 font-mono">
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-mint">dev routes</p>
      <h1 className="display sec-title mb-10">Previews</h1>
      <ul className="space-y-3 text-sm">
        <li>
          <Link href="/" className="text-white underline decoration-mint/40 underline-offset-4">
            /
          </Link>
          <span className="text-gray-2"> · full page (first visit plays the intro; add #x to skip)</span>
        </li>
        {ROUTES.map((r) => (
          <li key={r.href}>
            <Link href={r.href} className="text-white underline decoration-mint/40 underline-offset-4">
              {r.href}
            </Link>
            <span className="text-gray-2">
              {" "}
              · {r.owner} · {r.what}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
