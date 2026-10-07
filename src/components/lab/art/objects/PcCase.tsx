import type { PcPart } from "@/content/pc";
import { PC_CASE, PC_FOOTPRINT, pcFace, pcPoints, type PcProjection } from "@/lib/pc-geometry";
import { PcFan, PcInterior } from "./PcInterior";

/** One chamfered chassis shared by the room and the enlarged component explorer. */
export function PcCase({ project, selected, onSelect }: {
  project: PcProjection;
  selected?: PcPart;
  onSelect?: (part: PcPart) => void;
}) {
  const { depth, width, height, corner } = PC_CASE;
  const side = depth - corner;
  const front = width - corner;
  const diagonal = corner * Math.SQRT2;
  const down: [number, number, number] = [0, 0, -1];
  function control(part: PcPart, label: string) {
    return onSelect ? {
      role: "button", tabIndex: 0, "aria-label": label, "aria-pressed": selected === part,
      className: `pc-component pc-case-panel ${selected === part ? "is-selected" : ""}`,
      onClick: () => onSelect(part),
      onKeyDown: (e: React.KeyboardEvent<SVGGElement>) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onSelect(part); }
      },
    } : {};
  }
  return <g data-pc-case="">
    <title>HYTE Y70 Touch: panoramic glass and angled corner touchscreen</title>
    {/* Feet and floor use the same projection as the tall panels. */}
    {[4, 37].map((u) => <polygon key={u} points={pcPoints(project, [[u, 1, 0], [u + 6, 1, 0], [u + 6, 1, -1.5], [u, 1, -1.5]])} fill="#101318" />)}
    <polygon points={pcPoints(project, PC_FOOTPRINT.map(([u, v]) => [u, v, 0]))} fill="#171a21" />
    <g transform={pcFace(project, [0, 0, height], [1, 0, 0], down)}>
      <rect width={side} height={height} fill="#0d111a" />
      <g transform={`translate(0 2) scale(${side / 43} ${43 / 51})`}>
        <PcInterior selected={selected} onSelect={onSelect} />
      </g>
      <g pointerEvents="none">
        <path d={`M1 3L${side - 1} 3V44H1Z`} fill="#93afd2" fillOpacity={0.035} stroke="#4f5767" strokeWidth={0.16} />
        <path d="M2 4l9 39m-8-39 9 39" stroke="#b9cbe5" strokeWidth={0.12} opacity={0.12} />
        <rect width={side} height={2} fill="#272b33" />
        <rect y={44.5} width={side} height={2.5} fill="#262a32" />
        <path d={`M0 0V47M${side} 0V47`} stroke="#3a414b" strokeWidth={0.45} />
      </g>
    </g>
    <g transform={pcFace(project, [depth, corner, height], [0, 1, 0], down)} {...control("fans", "Inspect side fans")}>
      <rect className="pc-component-outline" width={front} height={height} fill="#111724" stroke="#404857" strokeWidth={0.18} />
      {/* Three fans set back behind the front glass, with the photographed fixed X braces. */}
      <g transform="translate(2 3)">
        {[7, 20, 33].map((cy) => <g key={cy}>
          <PcFan cx={9} cy={cy} r={5.65} reverse />
          <path d={`M16 ${cy - 5}v10m1.5-10v10`} stroke="#b6d7ff" strokeWidth={0.3} />
        </g>)}
      </g>
      <g pointerEvents="none">
        <rect x={0.7} y={2} width={front - 1.4} height={42.5} fill="#7183af" fillOpacity={0.06} stroke="#596276" strokeWidth={0.13} />
        <path d={`M2 3L${front - 2} 43M5 3L${front - 2} 37`} stroke="#bac9e4" strokeWidth={0.12} opacity={0.16} />
        <rect width={front} height={2} fill="#20252e" />
        <rect y={44.5} width={front} height={2.5} fill="#20252e" />
      </g>
    </g>
    <g transform={pcFace(project, [side, 0, height], [Math.SQRT1_2, Math.SQRT1_2, 0], down)}
      data-pc-part={onSelect ? "case" : undefined} {...control("case", "Inspect case")}>
      <rect className="pc-component-outline" width={diagonal} height={height} fill="#1a1e26" stroke="#465060" strokeWidth={0.18} />
      <rect x={0.8} y={3} width={diagonal - 1.6} height={39.5} fill="#252456" />
      <path d={`M0.8 18Q5 15 ${diagonal - 0.8} 19V42.5H0.8Z`} fill="#543883" />
      <path d={`M0.8 30Q6 25 ${diagonal - 0.8} 28V42.5H0.8Z`} fill="#7253ad" />
      {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M0.8 ${31 + i * 0.8}q4-1.1 ${diagonal - 1.6} 0.1`} stroke={i % 2 ? "#9d83d5" : "#574c94"} strokeWidth={0.2} fill="none" />)}
      <circle cx={2.2} cy={45.4} r={0.3} fill="none" stroke="#a5b0c6" strokeWidth={0.1} />
      <rect x={3.6} y={44.9} width={0.45} height={0.9} fill="#060b11" stroke="#778296" strokeWidth={0.08} />
      <rect x={5.1} y={44.8} width={1.1} height={1.1} rx={0.1} fill="#a9eaff" stroke="#e1faff" strokeWidth={0.12} />
      <rect x={7.2} y={44.9} width={0.45} height={0.9} fill="#060b11" stroke="#778296" strokeWidth={0.08} />
      <rect x={8.7} y={45.1} width={0.65} height={0.45} rx={0.1} fill="#070c14" stroke="#778296" strokeWidth={0.08} />
    </g>
    <polygon points={pcPoints(project, PC_FOOTPRINT.map(([u, v]) => [u, v, height]))} fill="#242a33" stroke="#515b69" strokeWidth={0.25} pointerEvents="none" />
    <g transform={pcFace(project, [0, 0, height + 0.01], [1, 0, 0], [0, 1, 0])} pointerEvents="none">
      <rect x={2} y={3} width={34} height={26} rx={0.8} fill="#141a22" />
      {Array.from({ length: 23 }, (_, i) => <path key={i} d={`M${3 + i * 1.4} 4v24`} stroke="#4f5866" strokeWidth={0.35} />)}
    </g>
  </g>;
}
