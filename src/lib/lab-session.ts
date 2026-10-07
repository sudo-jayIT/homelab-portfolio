/**
 * Persisted lab state in localStorage (spec 01 section 5.10, spec 05 section 5.7).
 *
 *   "yg-lab"        {"user": string, "at": epochMs, "active": boolean}
 *                   active=true skips the first-visit intro on the next load
 *                   (see the inline gate script in src/app/layout.tsx).
 *   "yg-lab-hints"  "1" once any hotspot was opened; hides the hint markers for good.
 *
 * The key names are kept identical to the original for behavioral parity.
 * Every storage access is wrapped in try/catch (private mode, blocked storage).
 */

export const SESSION_KEY = "yg-lab";
export const HINTS_KEY = "yg-lab-hints";
export const DEFAULT_USER = "guest";

export interface LabSession {
  user: string;
  at: number;
  active: boolean;
}

const LEGACY_USER = /^[a-z0-9._-]{1,16}$/;

/** Read the session. Accepts the legacy plain-string user value as an active session. */
export function readSession(): LabSession | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const v: unknown = JSON.parse(raw);
    if (v && typeof v === "object") {
      const o = v as Partial<LabSession>;
      if (typeof o.user === "string" && o.user) {
        return {
          user: o.user,
          at: typeof o.at === "number" ? o.at : 0,
          active: o.active === true,
        };
      }
    }
    if (typeof v === "string" && LEGACY_USER.test(v)) return { user: v, at: 0, active: true };
  } catch {
    if (LEGACY_USER.test(raw)) return { user: raw, at: 0, active: true };
  }
  return null;
}

/** Write the full session object. */
export function writeSession(session: LabSession): void {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* storage unavailable */
  }
}

/** Mark the session active for `user` now (boot, skip, entering the room). */
export function startSession(user: string): LabSession {
  const s: LabSession = { user: user || DEFAULT_USER, at: Date.now(), active: true };
  writeSession(s);
  return s;
}

/** Keep user/at but set active=false (terminal exit or reboot). */
export function endSession(): void {
  const prev = readSession();
  if (prev) writeSession({ ...prev, active: false });
}

/** The saved user name, or "guest". */
export function savedUser(): string {
  return readSession()?.user || DEFAULT_USER;
}

/** True once any hotspot was opened in this browser. */
export function readHintsSeen(): boolean {
  try {
    return window.localStorage.getItem(HINTS_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeHintsSeen(): void {
  try {
    window.localStorage.setItem(HINTS_KEY, "1");
  } catch {
    /* storage unavailable */
  }
}
