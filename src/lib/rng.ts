/**
 * Seeded pseudo random numbers (mulberry32). Deterministic, so server and
 * client render identical markup. Never use Math.random() for anything that
 * reaches the DOM during SSR.
 */
export type Rng = () => number;

/** Returns a generator of floats in [0, 1) for the given 32-bit seed. */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Alias used by the room art code. */
export const rng = mulberry32;

/** Float in [min, max). */
export function between(r: Rng, min: number, max: number): number {
  return min + r() * (max - min);
}

/** Integer in [min, max]. */
export function intBetween(r: Rng, min: number, max: number): number {
  return Math.floor(min + r() * (max - min + 1));
}

/** Pick one element. */
export function pick<T>(r: Rng, items: readonly T[]): T {
  return items[Math.floor(r() * items.length)];
}

/** `count` pairs [a, b] drawn in order from one seed (LED timing helper). */
export function seededPairs(seed: number, count: number): [number, number][] {
  const r = mulberry32(seed);
  return Array.from({ length: count }, () => [r(), r()] as [number, number]);
}
