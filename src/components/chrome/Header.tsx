"use client";

/**
 * Fixed site header (spec 02 sections 2.2, 3.3, 3.5 and 5.2).
 *
 *   header.fixed.z-50                  glass after scrollY > 20 (classic view) or while the menu is open
 *     nav.max-w-6xl.h-16               keycap monogram, one link per enabled section, Resume key, burger
 *     MobileMenu                       only while open, no animation
 *
 * Behavior matches the original:
 * - The scrolled flag updates on scroll only (no initial read).
 * - Scrollspy: one IntersectionObserver per section with rootMargin
 *   "-40% 0px -55% 0px"; the last section to cross the band stays active.
 * - The URL hash is stripped with replaceState 1500ms after mount and on every
 *   hashchange, so native smooth anchor scrolling works and no hash is kept.
 * - Room view: nav links pick the matching room hotspot instead of scrolling,
 *   the monogram goes home; classic view: the monogram smooth-scrolls to top.
 * - Before hydration useView() is null, so the link list and burger switch at
 *   `sm`; afterwards at `lg`.
 * - `header { transition: opacity .6s }` (base.css, unlayered) overrides the
 *   transition-all utility, so the glass swap is instant.
 * - Like the original, the menu has no Escape handling, outside-click close,
 *   focus trap or scroll lock; it closes on any menu link and on the burger.
 * Invisible addition: the burger carries aria-controls while the menu is open.
 */

import { Menu, X } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";
import { CHROME, SECTION_ORDER } from "@/content/site";
import type { NavItem, SectionId } from "@/content/types";
import { cn } from "@/lib/cn";
import { goHome, pickInRoom, useView } from "@/lib/view-store";
import { MOBILE_MENU_ID, MobileMenu } from "./MobileMenu";

export function Header() {
  const view = useView();
  const inRoom = view === "room";
  const hydrated = view !== null;

  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<SectionId | "">("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    for (const id of SECTION_ORDER) {
      const el = document.getElementById(id);
      if (!el) continue;
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
      );
      io.observe(el);
      observers.push(io);
    }
    return () => observers.forEach((io) => io.disconnect());
  }, []);

  useEffect(() => {
    const strip = () => {
      if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    };
    const timer = window.setTimeout(strip, 1500);
    window.addEventListener("hashchange", strip);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", strip);
    };
  }, []);

  const onPick = (e: MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    setOpen(false);
    if (inRoom) {
      e.preventDefault();
      pickInRoom(item.room);
    }
  };

  const onMonogram = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!hydrated) return;
    e.preventDefault();
    setOpen(false);
    if (inRoom) goHome();
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        (scrolled && !inRoom) || open ? "border-b border-line bg-background/72 backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <a
          href="#hero"
          onClick={onMonogram}
          aria-label={CHROME.monogramAriaLabel}
          className="key key-sm key-icon text-[12px] font-bold tracking-tight"
        >
          {CHROME.monogram}
        </a>
        <ul className={cn("hidden items-center gap-7", hydrated ? "lg:flex" : "sm:flex")}>
          {CHROME.nav.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                onClick={(e) => onPick(e, item)}
                className={cn(
                  "text-sm transition-colors duration-200",
                  inRoom || active !== item.id ? "text-white/60 hover:text-white" : "nav-tick text-white",
                )}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <a
            href={CHROME.resumeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="key key-sm key-light hidden sm:inline-flex"
          >
            {CHROME.resumeLabel}
          </a>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center w-9 h-9 rounded-lg border border-line-strong text-white/70 hover:text-white transition-colors",
              hydrated ? "lg:hidden" : "sm:hidden",
            )}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={open ? MOBILE_MENU_ID : undefined}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={17} aria-hidden /> : <Menu size={17} aria-hidden />}
          </button>
        </div>
      </nav>
      {open ? (
        <MobileMenu
          hydrated={hydrated}
          inRoom={inRoom}
          active={active}
          onPick={onPick}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </header>
  );
}
