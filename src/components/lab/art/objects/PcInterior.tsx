import type { PcPart } from "@/content/pc";
import { PC_PARTS } from "@/content/pc";
import type { ReactNode } from "react";

export function PcFan({ cx, cy, r = 6, gpu = false, reverse = false }: { cx: number; cy: number; r?: number; gpu?: boolean; reverse?: boolean }) {
  return <g transform={`translate(${cx} ${cy})`}>
    {!gpu && <rect x={-r - 0.6} y={-r - 0.6} width={2 * r + 1.2} height={2 * r + 1.2} rx={1} fill="#171923" stroke="#53505f" strokeWidth={0.25} />}
    <circle r={r} fill={gpu ? "#12161c" : "#272036"} stroke={gpu ? "#66717e" : "#b1dfff"} strokeWidth={gpu ? 0.3 : 0.65} />
    <g transform={`scale(${r / 6})`}><g className={`pc-fan-rotor${gpu ? " pc-gpu-fan" : ""}`}>
      {Array.from({ length: gpu ? 9 : 7 }, (_, i) => <path key={i} transform={`rotate(${i * 360 / (gpu ? 9 : 7)})`} d="M-0.4-1.5C-2.5-2.3-4.6-3-4-4.6C-2.5-5.5-0.6-5.2 0.7-3.1L1-1.2Z" fill={gpu ? "#4f5967" : "#d3d9ff"} />)}
    </g></g>
    {reverse && <path d={`M${-r * 0.8} ${-r * 0.8}L${r * 0.8} ${r * 0.8}M${-r * 0.8} ${r * 0.8}L${r * 0.8} ${-r * 0.8}`} stroke="#171b27" strokeWidth={r * 0.3} />}
    <circle r={gpu ? r * 0.23 : 1.3} fill={gpu ? "#303943" : "#44404e"} stroke="#81768f" strokeWidth={0.2} />
    {!gpu && <path d="M-0.6 0.6L0-0.8 0.8 0.6Z" fill="#d5cde8" />}
  </g>;
}

/** Shared interior in a 43 × 51 local face, used in the room and inspector. */
export function PcInterior({ selected, onSelect }: { selected?: PcPart; onSelect?: (part: PcPart) => void }) {
  function part(id: PcPart, children: ReactNode) {
    return <g key={id} data-pc-part={onSelect ? id : undefined}
      className={onSelect ? `pc-component ${selected === id ? "is-selected" : ""}` : undefined}
      role={onSelect ? "button" : undefined} tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? `Inspect ${PC_PARTS[id].label}` : undefined}
      aria-pressed={onSelect ? selected === id : undefined}
      onClick={onSelect ? () => onSelect(id) : undefined}
      onKeyDown={onSelect ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onSelect(id); } } : undefined}>
      <title>{PC_PARTS[id].label}</title>{children}
    </g>;
  }
  return <g>
    <rect x={2} y={3} width={39} height={45} fill="#12141e" stroke="#495062" strokeWidth={0.5} />
    {part("motherboard", <g>
      <rect className="pc-component-outline" x={11} y={6} width={29} height={36} rx={0.5} fill="#161b23" stroke="#4a555f" strokeWidth={0.4} />
      <path d="M11 7h7v9l-2 2h-5Zm8 0h12v6H19ZM12 27h27v4H12Zm19 8h8v6h-8Z" fill="#444c59" />
      <path d="M12 8h4m-4 2h4m-4 2h4m-4 2h4M20 8h10m-10 2h10m-10 2h10" stroke="#858c9c" strokeWidth={0.35} />
      <path d="M13 19v6h4m9 0h3v6m-4 6v-2h4" stroke="#756f43" strokeWidth={0.25} fill="none" />
      <text x={11.7} y={17} fontSize={1.1} fill="#cdbcb1">TUF</text>
      <path d="M12 17.5h2l0.6 0.8-1.6 1.4Z" fill="#bf746a" />
    </g>)}
    {part("fans", <g>
      <rect className="pc-component-outline" x={3} y={13} width={11} height={13} rx={0.5} fill="#141723" stroke="transparent" strokeWidth={0.5} />
      <PcFan cx={8} cy={19.5} r={4.8} />
    </g>)}
    <g pointerEvents="none">
      <rect x={4} y={3} width={35} height={3.7} fill="#333946" />
      {[9, 21, 33].map((x) => <g key={x} transform={`translate(${x} 5) scale(1 0.3)`}><PcFan cx={0} cy={0} r={4.5} /></g>)}
      <text x={16} y={5.5} fontSize={1.2} fill="#acb5cb">CORSAIR</text>
      <path d="M23 19C24 8 32 5 37 10L40 14M24 21C27 10 33 8 38 13L40 16" fill="none" stroke="#151a24" strokeWidth={2} />
      <path d="M23 19C24 8 32 5 37 10L40 14M24 21C27 10 33 8 38 13L40 16" fill="none" stroke="#666b80" strokeWidth={0.7} strokeDasharray="0.45 0.3" />
    </g>
    {part("cpu", <g>
      <rect className="pc-component-outline" x={15} y={15} width={11} height={11} rx={3} fill="#9095b5" stroke="#bbc6dd" strokeWidth={0.45} />
      <rect x={15.3} y={15.6} width={9.7} height={9.8} rx={2.5} fill="#b9bed6" stroke="#6b7797" strokeWidth={0.4} />
      <circle cx={20.1} cy={20.5} r={4.3} fill="#252639" stroke="#64d7ff" strokeWidth={0.65} />
      <circle cx={20.1} cy={20.5} r={3.5} fill="#141d35" stroke="#7a93c8" strokeWidth={0.2} />
      <path d="M17.8 22.4q2.2-1 4.5 0m-4.2 0.6q1.9-0.9 3.8 0" fill="none" stroke="#4676ae" strokeWidth={0.2} />
      <text x={18.1} y={19} fontSize={0.65} fill="#a7c4eb">COOLANT</text>
      <text x={18.7} y={22} fontSize={2.8} fill="#85bfff">48</text>
    </g>)}
    {part("ram", <g>
      <rect className="pc-component-outline" x={28} y={12} width={6.7} height={19} fill="#15191f" stroke="transparent" strokeWidth={0.5} />
      {[28.3, 31.6].map((x) => <g key={x}>
        <rect x={x} y={12.2} width={2} height={18.5} rx={0.45} fill="#b9c7db" />
        <rect x={x + 0.2} y={12.6} width={1.5} height={17.6} rx={0.4} fill="#d6f3ff" />
        <path d={`M${x + 0.7} 13v16`} stroke="#ffffff" strokeWidth={0.5} />
        <path d={`M${x + 0.55} 22h1l-0.4 0.5Z`} fill="#7f5982" />
      </g>)}
    </g>)}
    {part("storage", <g><rect className="pc-component-outline" x={15} y={27} width={12} height={4} rx={0.5} fill="#414857" stroke="#63717a" strokeWidth={0.4} /><path d="M16 28h10m-10 1h10m-10 1h10" stroke="#252b39" strokeWidth={0.3} /></g>)}
    {part("gpu", <g>
      {/* Photo-matched silver MSI shroud, vertical mounting and three dark fans. */}
      <path className="pc-component-outline" d="M3 33l1.5-1H39l1.5 2v9L39 45H4l-1-2Z" fill="#939bb3" stroke="#b0b9cb" strokeWidth={0.5} />
      <path d="M4 33h34l1 1v2l-3-1.5-3 0.5-3-1-2 1-5-1-4 1-4-1-3 1-3-0.5L4 36Zm0 9 4 1 3-0.5 4 1 3-1 4 1 4-1 4 1 3-1 4 0.5 2-1v1l-2 2H4Z" fill="#65718c" />
      <path d="M5 33h33" stroke="#bec9dd" strokeWidth={0.5} />
      {[9.5, 21.5, 33.5].map((x) => <PcFan key={x} cx={x} cy={38.5} r={4.8} gpu />)}
      <text x={16.5} y={33.1} fontSize={1.35} fill="#e4e8f1">msi</text>
      <path d="M4 45h35" stroke="#546885" strokeWidth={0.5} />
    </g>)}
    <g pointerEvents="none">
      <path d="M30 32C30 24 35 23 40 27" stroke="#171e2c" strokeWidth={1.8} fill="none" />
      <path d="M30 32C30 24 35 23 40 27" stroke="#59677f" strokeWidth={0.6} fill="none" />
      <path d="M36 13q4-1 4 4m-4-2q4-1 4 4m-4-2q4-1 4 4m-4-2q4-1 4 4" stroke="#798095" strokeWidth={0.5} fill="none" />
      <path d="M3 47h37" stroke="#66bfff" strokeWidth={1.3} opacity={0.6} />
      {Array.from({length: 18}, (_, i) => <path key={i} d={`M${3 + i * 2} 46l1.6 3`} stroke="#737b93" strokeWidth={0.45} />)}
    </g>
    <path d="M22 44h17M4 48h35" stroke="#5b536e" strokeWidth={0.4} />
  </g>;
}
