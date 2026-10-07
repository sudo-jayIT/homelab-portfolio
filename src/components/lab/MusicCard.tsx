"use client";

/**
 * "Now playing" card (spec 05 sections 2.7, 5.9). Portalled to <body> by
 * LabHero, so it survives the switch to the classic page.
 *
 * Media box (200 x 200): an iframe only when the room content provides an
 * `embedUrl` (a track you have the rights to); otherwise the cover image when
 * one is set, else a small drawn record. A self-hosted `audioSrc` plays
 * through a hidden <audio> element. The default content ships a cover
 * (/lab/cover.webp) and an original synthesized loop (/lab/nocturne.mp3).
 *
 * The card only mounts after the visitor picks the record (click, tap or
 * Enter on the hotspot), so playback always follows a user gesture and
 * nothing plays on load. Unmounting it (stop key, "stop the music", logout)
 * removes the <audio> element, which stops playback.
 *
 * Theme: the card is UI (card surface, hairline, gray text, mint accent, the
 * stop keycap from keys.css). The drawn record fallback is a picture of a
 * record, so its label keeps its own colours.
 */

import { ROOM_CONTENT } from "@/content";

type Music = typeof ROOM_CONTENT.music & { embedUrl?: string | null };

export function MusicCard({ onStop }: { onStop: () => void }) {
  const music = ROOM_CONTENT.music as Music;
  const label = `${music.artist}, ${music.title}`;
  return (
    <div
      data-music-card=""
      className="fixed bottom-[4.5rem] right-4 z-50 w-fit rounded-xl border border-line-strong bg-card/95 p-2 shadow-[inset_0_1px_0_rgba(214,255,233,0.035),0_24px_70px_-16px_rgba(0,0,0,0.95)] motion-safe:animate-[lab-fade-in_0.35s_ease-out] sm:bottom-auto sm:right-5 sm:top-[4.5rem]"
    >
      <div className="flex items-center justify-between gap-2 pl-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-2">
          <span className="text-mint">♪</span> now playing
        </p>
        <button type="button" onClick={onStop} className="key key-xs">
          ■ stop
        </button>
      </div>
      <div className="mt-2 h-[200px] w-[200px] overflow-hidden rounded-md bg-raised">
        {music.embedUrl ? (
          <iframe
            src={music.embedUrl}
            title={label}
            allow="autoplay; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
            className="h-full w-full"
          />
        ) : music.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={music.cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div aria-hidden className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_50%_35%,#16181c,#050506_70%)]">
            <div className="lab-disc-spin relative h-[136px] w-[136px] rounded-full bg-[repeating-radial-gradient(circle_at_50%_50%,#0c0c0d_0px,#0c0c0d_1.3px,#17171a_1.3px,#17171a_2.6px)] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(255,255,255,0.05)]">
              <div className="absolute inset-[34%] rounded-full bg-[#e6d9b5]">
                <div className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-full bg-[#cdbf98]" />
              </div>
              <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2a2620]" />
            </div>
          </div>
        )}
      </div>
      {music.audioSrc && !music.embedUrl ? <audio src={music.audioSrc} autoPlay loop /> : null}
      <p className="mt-1.5 max-w-[200px] truncate px-1 text-[12px] leading-tight text-gray-2">
        <span className="font-semibold text-title">{music.title}</span> · {music.artist}
      </p>
    </div>
  );
}
