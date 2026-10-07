"use client";

/**
 * Shared focus-panel shell (spec 05 section 2.4) and the small helpers every
 * panel uses: keycap link, arrow-key cycling.
 *
 * DOM contract (contracts.ts):
 *   div[data-focus-layer]  full-hero flex column, pointer-events-none
 *     div[data-lift]       the panel body; the engine writes style.transform
 *     div[data-chrome]     caption + actions + close key (starts invisible)
 *
 * Because the layer is pointer-events-none, a click anywhere outside the
 * panel and the chrome row falls through to the engine's dim overlay, which
 * closes the focus. Accessibility additions that do not change visuals:
 * role="dialog" with aria-modal and a label, a Tab trap inside the layer, and
 * a [data-panel-close] hook so the engine can move focus to the close key once
 * the open timeline has finished.
 *
 * Theme: only the chrome row is themed (keycaps from keys.css, a gray-2
 * caption). Whatever sits in [data-lift] is the room object itself and keeps
 * that object's colours (amber CRT, paper resume and certificates, badge,
 * phone, record, framed wall art).
 */

import { useEffect, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Dark keycap used for secondary actions and the close key. */
export const KEY = "key key-sm";
/** Primary keycap (mint rim and legend in keys.css) used for the main action. */
export const KEY_LIGHT = "key key-sm key-light";

/** Focus-panel drop shadow shared by every lifted card. */
export const PANEL_SHADOW = "shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95)]";

export interface FocusShellProps {
  children: ReactNode;
  /** Keys rendered between the caption and the close key. */
  actions?: ReactNode;
  onClose: () => void;
  /** Mono caption at the start of the chrome row. */
  caption?: string;
  /** Close key text after the cross ("close", or "back to the room" for the record). */
  closeLabel?: string;
  /** Record panel: align to the top on phones and hide the caption there. */
  topOnPhones?: boolean;
  /** Accessible name of the dialog. */
  label: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keep Tab and Shift+Tab inside the layer once focus is in it. */
function trapTab(e: KeyboardEvent<HTMLDivElement>) {
  if (e.key !== "Tab") return;
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.getClientRects().length > 0,
  );
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

export function FocusShell({
  children,
  actions,
  onClose,
  caption,
  closeLabel = "close",
  topOnPhones = false,
  label,
}: FocusShellProps) {
  return (
    <div
      data-focus-layer=""
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onKeyDown={trapTab}
      className={cn(
        "pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 px-3 pb-5 pt-14 sm:pt-16",
        topOnPhones && "max-sm:justify-start max-sm:pt-20",
      )}
    >
      <div data-lift="" className="pointer-events-auto origin-top-left opacity-0">
        {children}
      </div>
      <div
        data-chrome=""
        className="pointer-events-auto invisible flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-3 opacity-0"
      >
        {caption ? (
          <span className={cn("mr-1 font-mono text-[11px] text-gray-2", topOnPhones && "max-sm:hidden")}>
            {caption}
          </span>
        ) : null}
        {actions}
        <button type="button" data-panel-close="" onClick={onClose} className={`${KEY} sm:pr-7`}>
          {"✕ "}
          {closeLabel}{" "}
          <span className="key-legend hidden sm:block">esc</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Keycap link. External links open in a new tab; site-relative and mailto
 * links stay in place, except PDFs which always get a new tab.
 */
export function LinkKey({
  href,
  children,
  className = KEY,
  download,
  ariaLabel,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  download?: string;
  ariaLabel?: string;
}) {
  const external = !href.startsWith("/") && !href.startsWith("mailto");
  return (
    <a
      href={href}
      download={download}
      target={external || href.endsWith(".pdf") ? "_blank" : undefined}
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}

/**
 * Window-level arrow keys while a panel is mounted: Left/Right by default,
 * Up/Down when `vertical` (the CRT file list). Both directions wrap.
 */
export function useCycleKeys(prev: () => void, next: () => void, vertical = false) {
  useEffect(() => {
    const back = vertical ? "ArrowUp" : "ArrowLeft";
    const fwd = vertical ? "ArrowDown" : "ArrowRight";
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === back) {
        e.preventDefault();
        prev();
      } else if (e.key === fwd) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, vertical]);
}

/** Wrap an index into [0, n). */
export function wrap(i: number, n: number): number {
  return ((i % n) + n) % n;
}
