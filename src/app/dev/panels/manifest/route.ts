import { CREDENTIALS, ROOM_CONTENT, SITE } from "@/content";

/**
 * Asset manifest for scripts/assets/panels.mjs (dev only). The generator runs
 * in plain Node and cannot import the TypeScript content, so it asks the dev
 * server which credential cards, resume and room images to produce.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  return Response.json({
    certs: CREDENTIALS.map((c) => ({
      id: c.id,
      image: c.thumb ?? `/certs/${c.id}.webp`,
    })),
    resume: { image: ROOM_CONTENT.resume.image, pdf: ROOM_CONTENT.resume.pdf },
    poster: ROOM_CONTENT.poster.src,
    print: { out: ROOM_CONTENT.printArt },
    cover: ROOM_CONTENT.music.cover,
    audio: ROOM_CONTENT.music.audioSrc,
    music: { artist: ROOM_CONTENT.music.artist, title: ROOM_CONTENT.music.title },
    owner: SITE.name,
  });
}
