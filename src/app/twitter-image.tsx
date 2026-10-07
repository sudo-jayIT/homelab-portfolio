import { OG_ALT, ogCard } from "@/lib/og-card";

// Twitter image (file convention). Same card as opengraph-image.tsx.
export const alt = OG_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard();
}
