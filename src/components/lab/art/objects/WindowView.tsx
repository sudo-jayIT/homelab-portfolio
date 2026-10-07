/** Closed white Venetian blinds, matching the desk window in the reference. */
import { WINDOW } from "../config";

export function WindowView() {
  return (
    <g transform={`translate(${WINDOW.u} ${WINDOW.v})`}>
      <rect width={WINDOW.w} height={WINDOW.h} fill="#b0aaa8" />
      {Array.from({ length: 17 }, (_, i) => (
        <g key={i}>
          <rect x={2} y={i * 5.5 + 1} width={WINDOW.w - 4} height={4.8} fill={i % 2 ? "#c4beb9" : "#d0c9c2"} />
          <path d={`M2 ${i * 5.5 + 5.8}h${WINDOW.w - 4}`} stroke="#837f82" strokeWidth={0.6} />
        </g>
      ))}
      {[24, WINDOW.w - 24].map((x) => <path key={x} d={`M${x} 0v${WINDOW.h}`} stroke="#ece7df" strokeWidth={0.7} />)}
    </g>
  );
}

export function WindowBars() {
  return (
    <g fill="#e0dcd5">
      <rect x={WINDOW.u - 3} y={WINDOW.v - 4} width={WINDOW.w + 6} height={5} />
      <rect x={WINDOW.u - 2} y={WINDOW.v} width={2} height={WINDOW.h + 2} />
      <rect x={WINDOW.u + WINDOW.w} y={WINDOW.v} width={2} height={WINDOW.h + 2} />
      <rect x={WINDOW.u - 2} y={WINDOW.v + WINDOW.h} width={WINDOW.w + 4} height={3} />
    </g>
  );
}

export function WindowLights() {
  return <rect x={WINDOW.u} y={WINDOW.v + WINDOW.h * 0.55} width={WINDOW.w} height={WINDOW.h * 0.45} fill="#bf72db" opacity={0.12} />;
}
