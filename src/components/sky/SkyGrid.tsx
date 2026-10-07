/**
 * Page grid (docs/theme/b.md section 4): a 1px grid of 64px cells with mint
 * intersection dots over the whole classic page, plus eight grid nodes that
 * "ping" like LED activity in the gutters. It replaces the tiled star fields
 * and the twinkles. Server component.
 *
 * The layer is page tall and scrolls natively with the page (no will-change
 * on a page-tall layer). Lines land on the page centre, so with a 72rem
 * column (18 cells) both column edges land on grid lines too. The grid fades
 * out above the rain divider (mask in sky.css).
 */

/**
 * Pinging nodes: [column offset from the page centre in 64px cells, row in
 * 64px cells, duration s, delay s]. They sit on gutter intersections of a
 * 1440px viewport and use the sky-twinkle keyframes.
 */
const PINGS: readonly [number, number, number, number][] = [
  [-11, 2, 4.6, -1.2],
  [-10, 6, 5.4, -3.1],
  [-9, 11, 4.2, -0.4],
  [-11, 15, 6.1, -2.2],
  [10, 3, 5.0, -2.7],
  [11, 8, 4.4, -0.9],
  [9, 12, 5.8, -4.0],
  [10, 17, 4.8, -1.7],
];

export function SkyGrid() {
  return (
    <div className="sky-grid pointer-events-none absolute inset-0" aria-hidden>
      {PINGS.map(([col, row, dur, delay], i) => (
        <span
          key={i}
          className="sky-ping sky-twinkle absolute"
          style={{
            left: `calc(50% + ${col * 64}px - 1.5px)`,
            top: `${row * 64 - 1.5}px`,
            animationDuration: `${dur}s`,
            animationDelay: `${delay}s`,
          }}
        />
      ))}
    </div>
  );
}
