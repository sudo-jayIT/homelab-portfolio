"use client";

/**
 * Room HUD (spec 05 sections 2.2, 2.3): the "↙ step outside" key (top left),
 * the zoom dock (bottom right), the hint line (bottom centre) and the
 * "›_ terminal" dock key (bottom left). Entrance is pure CSS (lab-fade-in).
 * Colours come from the keycap system (keys.css); the hint line is gray-2 and
 * the terminal prompt glyph is mint, like the shell prompt.
 *
 * HudKeys renders while the lab is live and zoomed; TerminalKey renders
 * whenever the lab is live. They are separate because the terminal shell sits
 * between them in DOM (and tab) order.
 */

export type ZoomAction = "out" | "in" | "reset" | "full";

const ZOOM_KEYS: { act: ZoomAction; icon: string; label: string }[] = [
  { act: "out", icon: "−", label: "Zoom out" },
  { act: "in", icon: "+", label: "Zoom in" },
  { act: "reset", icon: "⟲", label: "Reset view" },
  { act: "full", icon: "⛶", label: "Full screen" },
];

export interface HudKeysProps {
  /** Coarse pointer: touch wording in the hint. */
  coarse: boolean;
  /** document.fullscreenEnabled: the ⛶ key only renders where fullscreen works. */
  fullscreen: boolean;
  /** Hint line visible (first zoom per page load, 5 s, hidden while a focus is open). */
  hint: boolean;
  onStepOutside: () => void;
  onZoom: (act: ZoomAction) => void;
}

export function HudKeys({ coarse, fullscreen, hint, onStepOutside, onZoom }: HudKeysProps) {
  return (
    <>
      <button
        type="button"
        data-dock=""
        data-hud=""
        onClick={onStepOutside}
        className="key key-sm absolute left-4 top-4 z-20 pr-7 motion-safe:animate-[lab-fade-in_0.5s_ease-out_0.3s_backwards] sm:left-5 sm:top-5"
      >
        <span aria-hidden>↙</span> step outside
        <span className="key-legend hidden sm:block">esc</span>
      </button>
      <div
        data-dock=""
        data-hud=""
        className="absolute bottom-5 right-4 z-20 flex items-center gap-2 motion-safe:animate-[lab-fade-in_0.5s_ease-out_0.4s_backwards] sm:bottom-6 sm:right-5"
      >
        {ZOOM_KEYS.filter((z) => z.act !== "full" || fullscreen).map((z) => (
          <button
            key={z.act}
            type="button"
            onClick={() => onZoom(z.act)}
            aria-label={z.label}
            title={z.label}
            className="key key-sm key-icon text-sm"
          >
            {z.icon}
            {z.act === "reset" ? <span className="key-legend hidden sm:block">0</span> : null}
          </button>
        ))}
      </div>
      <p
        data-hud=""
        className={`pointer-events-none absolute inset-x-0 bottom-[4.25rem] z-20 text-center font-mono text-[11px] text-gray-2 transition-opacity duration-700 sm:bottom-7 ${hint ? "opacity-100" : "opacity-0"}`}
      >
        {coarse
          ? "drag to look around · pinch to zoom · tap anything"
          : "drag to look around · scroll to zoom · click anything"}
      </p>
    </>
  );
}

export function TerminalKey({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div
      data-dock=""
      className="absolute bottom-5 left-4 z-20 motion-safe:animate-[lab-fade-in_0.6s_ease-out_0.4s_backwards] sm:bottom-6 sm:left-5"
    >
      <button type="button" onClick={onToggle} aria-expanded={open} className="key key-sm pr-6">
        <span className="text-mint">›_</span> terminal
        <span className="key-legend hidden sm:block">`</span>
      </button>
    </div>
  );
}
