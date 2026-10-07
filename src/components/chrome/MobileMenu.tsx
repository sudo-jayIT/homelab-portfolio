"use client";

/**
 * Mobile menu panel (spec 02 sections 2.2 and 5.2). Rendered by Header only
 * while open, directly under the nav row inside the header; there is no open
 * or close animation (conditional render), no scroll lock and no focus trap,
 * exactly like the original (no Escape handling either).
 *
 * Breakpoint classes follow the header quirk: before hydration the view is
 * unknown and the panel hides at `sm`, afterwards at `lg`.
 */

import type { MouseEvent } from "react";
import { CHROME } from "@/content/site";
import type { NavItem, SectionId } from "@/content/types";
import { cn } from "@/lib/cn";

export const MOBILE_MENU_ID = "site-menu";

interface MobileMenuProps {
  /** View known (hydrated): lg breakpoint, else sm. */
  hydrated: boolean;
  /** Room view: no active highlight. */
  inRoom: boolean;
  active: SectionId | "";
  onPick: (e: MouseEvent<HTMLAnchorElement>, item: NavItem) => void;
  onClose: () => void;
}

export function MobileMenu({ hydrated, inRoom, active, onPick, onClose }: MobileMenuProps) {
  return (
    <div
      id={MOBILE_MENU_ID}
      className={cn(
        "border-t border-line bg-background/95 backdrop-blur-xl px-6 py-4",
        hydrated ? "lg:hidden" : "sm:hidden",
      )}
    >
      <ul className="space-y-1">
        {CHROME.nav.map((item) => (
          <li key={item.label}>
            <a
              href={item.href}
              onClick={(e) => onPick(e, item)}
              className={cn(
                "block py-2.5 text-[15px] transition-colors",
                inRoom || active !== item.id ? "text-white/70 hover:text-white" : "text-mint",
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
        <li className="pt-2 sm:hidden">
          <a
            href={CHROME.resumeHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="key key-sm key-light"
          >
            {CHROME.resumeLabel}
          </a>
        </li>
      </ul>
    </div>
  );
}
