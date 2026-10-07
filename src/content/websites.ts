/**
 * Client websites (spec 08 section 8). The section is switched OFF in
 * site.ts (SECTION_DEFS) because no client sites are listed yet; this sample
 * content stays so the section can be re-enabled once real entries replace it.
 * Previews: scripts/assets/work.mjs into public/sites/<slug>.webp (1400x875).
 * Businesses and domains below are fictional samples.
 */

import type { ClientSite } from "./types";

export const WEBSITES_LEDE =
  "Small, quick websites for neighborhood shops. Designed, hosted and cared for after launch.";

export const WEBSITES: ClientSite[] = [
  {
    slug: "harbor-bakery",
    name: "Harbor Street Bakery & Coffee Co.",
    category: "Neighborhood bakery · Gig Harbor, WA",
    url: "https://harbor-bakery.example",
    displayUrl: "harbor-bakery.example",
    description:
      "A warm, photo-led site for a family bakery that used to take orders by phone only. Customers now browse the daily case, reserve celebration cakes for pickup and check holiday hours in a few taps, and the owners update the menu themselves before the ovens open each morning.",
    tags: ["Web Design", "Online Ordering", "SEO", "Responsive"],
    preview: "/sites/harbor-bakery.webp",
    dosName: "HARBOR.WWW",
  },
  {
    slug: "northgate-bikes",
    name: "Northgate Bicycle Repair Co.",
    category: "Bike repair shop · Olympia, WA",
    url: "https://northgate-bikes.example",
    displayUrl: "northgate-bikes.example",
    description:
      "A clear, fast site for a two-person repair shop, with honest service tiers, a booking form that fills the week evenly and a map page that ranks well locally. Tune-up bookings doubled in one season.",
    tags: ["Web Design", "Booking", "Local SEO", "Lead Capture"],
    preview: "/sites/northgate-bikes.webp",
    dosName: "NORTHGTE.WWW",
  },
];
