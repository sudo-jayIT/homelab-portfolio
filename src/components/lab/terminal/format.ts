/**
 * Small pure helpers for the terminal (spec 01 sections 2.6, 5.5, 5.10).
 * Call the date helpers from event handlers, timers or effects, never during
 * render, so server and client markup always agree.
 */

/** Non-breaking space: the only content of blank lines and carets (a plain space would collapse). */
export const NBSP = " ";

/** Login names: lowercase, [a-z0-9._-], at most 16 chars, "guest" when empty. */
export function sanitizeUser(raw: string): string {
  return (
    raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "")
      .slice(0, 16) || "guest"
  );
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Banner "Last login" stamp: "Www Mmm DD HH:MM:SS YYYY" with a space-padded day ("Tue Oct  6 ..."). */
export function ttyStamp(at: number): string {
  const d = new Date(at);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  const month = d.toLocaleDateString("en-US", { month: "short" });
  return `${weekday} ${month} ${String(d.getDate()).padStart(2, " ")} ${d.toTimeString().slice(0, 8)} ${d.getFullYear()}`;
}

/** `date` and nmap stamp: "YYYY-MM-DD HH:MM" in local time. */
export function isoMinute(at: number): string {
  const d = new Date(at);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Restored-session stamp: "Www, Mmm D, HH:MM" (en-US, 24 h). */
export function sessionStamp(at: number): string {
  return new Date(at).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
