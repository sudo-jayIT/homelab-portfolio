/**
 * CSS-3D models for the rack inspector (spec 05 section 2.5). Owned by the
 * rack area.
 *
 * Box3D is a six-faced cuboid of absolutely positioned divs inside a
 * preserve-3d parent; each face can carry an inline SVG drawn in local units
 * (the same units as src/lib/rack.tsx), scaled by `m` px per unit. The model
 * coordinate system is centred on the part (or the rack): x right, y down,
 * z toward the viewer, so the front face sits at z = +d/2. A top face's SVG
 * has the back edge at y = 0 and the front edge at y = d.
 *
 * Fronts come from the shared device faces; backs, tops and sides are
 * original generic drawings (ports, vents, heatsink fins, a board layout).
 *
 * Pure render functions, no hooks: usable from the client inspector and from
 * a server preview alike.
 */

import type { CSSProperties, ReactNode } from "react";
import type { RackDeviceId, RackPartId } from "@/components/lab/contracts";
import {
  BF,
  D,
  DEVICE,
  DeviceFront,
  DeviceLeds,
  H,
  INSPECTOR_LED_PAIRS,
  LIP_H,
  P,
  PART_LOCAL,
  PatchCords,
  RACK_U,
  RackWordmark,
  SIDE_TONE,
  SLOT_BANDS,
  SPARE_U,
  TF,
  U,
  UMarks,
  W,
  ZIMA_BOARD_W,
  ZimaBoardFront,
  ZimaBoardLeds,
  ledPairs,
  type Range,
} from "@/lib/rack";

export type Vec3 = readonly [number, number, number];
export type FaceName = "front" | "back" | "right" | "left" | "top" | "bottom";

export interface Tone {
  front: string;
  side: string;
  top: string;
}

export interface Box3DProps {
  /** Size in local units. */
  w: number;
  h: number;
  d: number;
  /** Pixels per local unit. */
  m: number;
  /** Centre offset in local units. */
  at?: Vec3;
  /** Extra rotateY in degrees. */
  turn?: number;
  tone: Tone;
  /** SVG content per face, in face-local units (front/back w x h, sides d x h, top/bottom w x d). */
  faces?: Partial<Record<FaceName, ReactNode>>;
  style?: CSSProperties;
}

/** Six-faced CSS cuboid. Back faces are hidden so only outward faces paint. */
export function Box3D({ w, h, d, m, at = [0, 0, 0], turn = 0, tone, faces = {}, style }: Box3DProps) {
  const pw = w * m;
  const ph = h * m;
  const pd = d * m;
  const face = (name: FaceName, fw: number, fh: number, vw: number, vh: number, transform: string, background: string) => (
    <div
      key={name}
      className="absolute [backface-visibility:hidden]"
      style={{ width: fw, height: fh, left: -fw / 2, top: -fh / 2, transform, background }}
    >
      {faces[name] ? (
        <svg width={fw} height={fh} viewBox={`0 0 ${vw} ${vh}`} className="block overflow-visible">
          {faces[name]}
        </svg>
      ) : null}
    </div>
  );
  return (
    <div
      className="absolute left-0 top-0 [transform-style:preserve-3d]"
      style={{
        transform: `translate3d(${at[0] * m}px, ${at[1] * m}px, ${at[2] * m}px) rotateY(${turn}deg)`,
        ...style,
      }}
    >
      {face("front", pw, ph, w, h, `translateZ(${pd / 2}px)`, tone.front)}
      {face("back", pw, ph, w, h, `rotateY(180deg) translateZ(${pd / 2}px)`, tone.front)}
      {face("right", pd, ph, d, h, `rotateY(90deg) translateZ(${pw / 2}px)`, tone.side)}
      {face("left", pd, ph, d, h, `rotateY(-90deg) translateZ(${pw / 2}px)`, tone.side)}
      {face("top", pw, pd, w, d, `rotateX(90deg) translateZ(${ph / 2}px)`, tone.top)}
      {face("bottom", pw, pd, w, d, `rotateX(-90deg) translateZ(${ph / 2}px)`, tone.side)}
    </div>
  );
}

export interface Plane3DProps {
  w: number;
  h: number;
  m: number;
  at: Vec3;
  turn?: number;
  fill?: string;
  border?: string;
  /** Custom viewBox (defaults to "0 0 w h"). */
  vb?: string;
  children?: ReactNode;
}

/** A single flat card (side acrylic, cords, handles); visible from both sides. */
export function Plane3D({ w, h, m, at, turn = 0, fill, border, vb, children }: Plane3DProps) {
  const pw = w * m;
  const ph = h * m;
  return (
    <div
      className="absolute"
      style={{
        width: pw,
        height: ph,
        left: -pw / 2,
        top: -ph / 2,
        background: fill,
        border,
        transform: `translate3d(${at[0] * m}px, ${at[1] * m}px, ${at[2] * m}px) rotateY(${turn}deg)`,
      }}
    >
      {children ? (
        <svg width={pw} height={ph} viewBox={vb ?? `0 0 ${w} ${h}`} className="block overflow-visible">
          {children}
        </svg>
      ) : null}
    </div>
  );
}

/** Row of rounded vent slots across a face. */
export function Slots({
  w,
  h,
  n,
  y0 = 0.25,
  y1 = 0.75,
  fill = "#07080a",
}: {
  w: number;
  h: number;
  n: number;
  y0?: number;
  y1?: number;
  fill?: string;
}) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={((i + 0.5) * w) / n - 0.35} y={h * y0} width={0.7} height={h * (y1 - y0)} rx={0.3} fill={fill} />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Device back, top and side faces (generic, original)                      */
/* ------------------------------------------------------------------------ */

const port = (x: number, y: number, w: number, h: number, key: string, fill = "#050607") => (
  <rect key={key} x={x} y={y} width={w} height={h} rx={0.2} fill={fill} stroke="#2c3035" strokeWidth={0.15} />
);

/** Desktop switch rear: DC jack, lock slot and a printed port count. */
function SwitchBack({ w, h, ports }: { w: number; h: number; ports: number }) {
  return (
    <>
      <rect width={w} height={h} fill="#262a2e" />
      <circle cx={w - 4} cy={h / 2} r={1.3} fill="#050607" stroke="#3a3f45" strokeWidth={0.2} />
      <rect x={2} y={h / 2 - 0.6} width={1.6} height={1.2} rx={0.3} fill="#050607" />
      <text x={w / 2} y={h / 2 + 0.5} fontSize={1.2} fill="rgba(255,255,255,0.35)" textAnchor="middle" className="lab-mono">
        {ports} × RJ45 · 12V ⎓
      </text>
    </>
  );
}

/** Desktop switch lid: a row of vent slots near the back. */
function SwitchTop({ w, d }: { w: number; d: number }) {
  return (
    <g transform={`translate(${w * 0.15} 3)`}>
      <Slots w={w * 0.7} h={6} n={Math.round(w / 2.4)} y0={0} y1={1} fill="#1b1e21" />
      <rect y={d - 10} width={w * 0.7} height={0.4} fill="rgba(255,255,255,0.06)" />
    </g>
  );
}

/** Office mini PC rear I/O: vents, two display ports, USB, LAN, DC jack. */
function MiniBack() {
  return (
    <>
      <rect width={44} height={8.6} fill="#141619" />
      <Slots w={10} h={8.6} n={5} y0={0.15} y1={0.85} />
      {port(12, 1.6, 3.4, 2, "dp1")}
      {port(12, 5, 3.4, 2, "dp2")}
      {port(17.4, 1.6, 3, 1.3, "u1")}
      {port(17.4, 3.8, 3, 1.3, "u2")}
      {port(21.4, 1.6, 3, 1.3, "u3")}
      {port(21.4, 3.8, 3, 1.3, "u4")}
      {port(26, 1.6, 3.4, 3, "eth")}
      <circle cx={34} cy={4.4} r={1.6} fill="#050607" stroke="#2c3035" strokeWidth={0.2} />
      <circle cx={39.5} cy={2.6} r={0.7} fill="#2a2d31" />
      <text x={42.5} y={7.6} fontSize={0.9} fill="rgba(255,255,255,0.35)" textAnchor="end">
        19.5V ⎓
      </text>
    </>
  );
}

/** Office mini PC lid: plain shell with a faint host name near the front. */
function MiniTop({ name, w, d }: { name: string; w: number; d: number }) {
  return (
    <>
      <rect x={1} y={1} width={w - 2} height={d - 2} rx={1} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={0.3} />
      <text x={4} y={d - 4} fontSize={2.6} fill="rgba(255,255,255,0.2)" className="lab-mono">
        {name}
      </text>
    </>
  );
}

/** Compact mini PC rear: two LAN ports, display outputs, USB, DC jack. */
function CubeBack() {
  return (
    <>
      <rect width={30} height={9.6} fill="#2a2e33" />
      {port(2, 2.2, 3.2, 2.8, "e1")}
      {port(6, 2.2, 3.2, 2.8, "e2")}
      {port(10.4, 2.4, 2.6, 1.3, "h1")}
      {port(10.4, 4.6, 2.6, 1.3, "h2")}
      {port(14.2, 2.4, 2.8, 1.2, "u1")}
      {port(14.2, 4.6, 2.8, 1.2, "u2")}
      <circle cx={24.6} cy={4.2} r={1.4} fill="#050607" stroke="#3a3f45" strokeWidth={0.2} />
      <Slots w={30} h={9.6} n={14} y0={0.72} y1={0.9} fill="#16191c" />
    </>
  );
}

/** Compact mini PC lid: a round grille. */
function CubeTop({ name }: { name: string }) {
  return (
    <>
      <circle cx={15} cy={14} r={9} fill="#25292e" />
      {Array.from({ length: 5 }, (_, r) =>
        Array.from({ length: 5 }, (_, c) => (
          <circle key={`${r}-${c}`} cx={10.2 + 2.4 * c} cy={9.2 + 2.4 * r} r={0.45} fill="#111316" />
        )),
      )}
      <text x={15} y={27.6} fontSize={1.6} fill="rgba(255,255,255,0.22)" textAnchor="middle" className="lab-mono">
        {name}
      </text>
    </>
  );
}

/** Single-board computer from above: green board, SoC, memory, GPIO header. */
function PiBoard() {
  return (
    <>
      <rect width={16} height={22} rx={0.8} fill="#1f7a3e" />
      {/* SoC under a metal lid, memory, controller */}
      <rect x={4.6} y={6.4} width={5.2} height={5.2} rx={0.4} fill="#c6cacf" />
      <rect x={10.6} y={7} width={3.6} height={4} fill="#111214" />
      <rect x={5.2} y={13} width={2.6} height={2.6} fill="#111214" />
      {/* GPIO header along one long edge */}
      <rect x={14.2} y={0.8} width={1.4} height={13.4} fill="#0e0f11" />
      {Array.from({ length: 10 }, (_, i) => (
        <circle key={i} cx={14.9} cy={1.5 + 1.3 * i} r={0.25} fill="#c8a24a" />
      ))}
      {[
        [0.9, 0.9],
        [0.9, 15.2],
        [12.6, 0.9],
        [12.6, 15.2],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={0.55} fill="#e7d9a0" />
      ))}
    </>
  );
}

/** Tops of the Pi's port blocks along the front edge (y = d), seen from above. */
function PiBlocksTop({ d }: { d: number }) {
  return (
    <>
      <rect x={0.2} y={d - 5.5} width={5.2} height={5.5} fill="#a3a8ae" />
      <rect x={5.8} y={d - 4.8} width={4.6} height={4.8} fill="#b1b6bc" />
      <rect x={10.9} y={d - 4.8} width={4.6} height={4.8} fill="#b1b6bc" />
    </>
  );
}

/** ZimaBoard lid: heatsink fins running front to back on a base plate. */
function ZimaTop({ w, d }: { w: number; d: number }) {
  const n = Math.floor((w - 0.6) / 1.45);
  return (
    <>
      <rect width={w} height={d} fill="#7f858b" />
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={0.5 + 1.45 * i} y={0.6} width={0.85} height={d - 1.2} fill="#c3c8cd" />
      ))}
    </>
  );
}

/** ZimaBoard far end: an expansion slot and storage connectors. */
function ZimaBack({ w }: { w: number }) {
  return (
    <>
      <rect y={1.9} width={w} height={5.7} rx={0.5} fill="#a2a8ae" />
      <rect x={0.7} y={2.7} width={w - 1.4} height={4.2} rx={0.3} fill="#25282c" />
      <rect x={2} y={4.2} width={9} height={1.2} fill="#0b0c0e" stroke="#4a4f55" strokeWidth={0.15} />
      {port(12.6, 3.6, 2, 1.4, "s1")}
      {port(15.2, 3.6, 2, 1.4, "s2")}
    </>
  );
}

/** NAS rear: a large fan, LAN, USB, DC jack, lock slot. */
function NasBack() {
  return (
    <>
      <rect width={34} height={41} rx={1.6} fill="#1c1f23" />
      <circle cx={17} cy={16} r={11.5} fill="#121417" stroke="#2c3035" strokeWidth={0.4} />
      {Array.from({ length: 5 }, (_, i) => (
        <circle key={i} cx={17} cy={16} r={2.4 + 2 * i} fill="none" stroke="#07080a" strokeWidth={0.7} />
      ))}
      <circle cx={17} cy={16} r={2.2} fill="#1d2025" />
      {port(4, 31, 3.4, 3, "eth")}
      {port(9, 31.6, 3, 1.3, "u1")}
      {port(13, 31.6, 3, 1.3, "u2")}
      <circle cx={26} cy={32.6} r={1.6} fill="#050607" stroke="#2c3035" strokeWidth={0.2} />
      <rect x={30} y={36} width={1.6} height={1} rx={0.3} fill="#050607" />
    </>
  );
}

/** NAS top: vent slots over the drive bays. */
function NasTop() {
  return (
    <g transform="translate(5 6)">
      <Slots w={24} h={30} n={12} y0={0} y1={1} fill="#121417" />
    </g>
  );
}

/** Power strip rear: inlet, cord and the rating line. */
function PduBack() {
  const w = DEVICE.pdu.w;
  return (
    <>
      <rect width={w} height={9} fill="#121315" />
      <circle cx={w - 12} cy={4.5} r={1.8} fill="#050607" />
      <path d={`M${w - 12} 4.5 H${w - 4}`} stroke="#050607" strokeWidth={1.6} />
      <text x={6} y={5.2} fontSize={1.2} fill="rgba(255,255,255,0.35)" className="lab-mono">
        120V~ 15A · 8 outlets
      </text>
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Part models                                                               */
/* ------------------------------------------------------------------------ */

const FRAME: Tone = { front: "#d6dadd", side: "#b9bfc3", top: "#e4e7e9" };
const LIP: Tone = { front: "#1d2023", side: "#15181b", top: "#202327" };
const pairs = INSPECTOR_LED_PAIRS;

/** Front face content: the shared device face plus its LEDs. */
function front(id: RackDeviceId, cabled = false) {
  return (
    <>
      <DeviceFront id={id} cabled={cabled} />
      <DeviceLeds id={id} r2={ledPairs(pairs, id)} />
    </>
  );
}

const CLEAR: Tone = { front: "transparent", side: "transparent", top: "transparent" };
const PCB: Tone = { front: "#1f7a3e", side: "#1f7a3e", top: "#1f7a3e" };

/** One device, centred on the origin. `cabled` plugs the switch ports (full rack model). */
export function DeviceModel({ id, m, cabled = false }: { id: RackDeviceId; m: number; cabled?: boolean }) {
  const { w, h, d } = DEVICE[id];
  const side = SIDE_TONE[id];
  switch (id) {
    case "switch-5":
    case "switch-8": {
      const ports = id === "switch-5" ? 5 : 8;
      return (
        <Box3D
          w={w}
          h={h}
          d={d}
          m={m}
          tone={{ front: "#2b2f34", side, top: "#2e3237" }}
          faces={{
            front: front(id, cabled),
            back: <SwitchBack w={w} h={h} ports={ports} />,
            top: <SwitchTop w={w} d={d} />,
            left: <Slots w={d} h={h} n={9} />,
            right: <Slots w={d} h={h} n={9} />,
          }}
        />
      );
    }
    case "pve1":
    case "pve2":
    case "pve3":
      return (
        <Box3D
          w={w}
          h={h}
          d={d}
          m={m}
          tone={{ front: "#15171a", side: "#16181b", top: "#1b1d20" }}
          faces={{
            front: front(id),
            back: <MiniBack />,
            top: <MiniTop name={id} w={w} d={d} />,
            left: <Slots w={d} h={h} n={20} y0={0.3} y1={0.7} />,
            right: <Slots w={d} h={h} n={20} y0={0.3} y1={0.7} />,
          }}
        />
      );
    case "pve4":
      return (
        <Box3D
          w={w}
          h={h}
          d={d}
          m={m}
          tone={{ front: "#30353b", side: "#2a2e33", top: "#353a40" }}
          faces={{
            front: front(id),
            back: <CubeBack />,
            top: <CubeTop name={id} />,
            left: <Slots w={d} h={h} n={12} y0={0.3} y1={0.75} fill="#1d2024" />,
            right: <Slots w={d} h={h} n={12} y0={0.3} y1={0.75} fill="#1d2024" />,
          }}
        />
      );
    case "pi":
      // A thin board at the bottom, then a clear box carrying the port end
      // and the tops and sides of the port blocks.
      return (
        <>
          <Box3D w={w} h={0.9} d={d} m={m} at={[0, (h - 0.9) / 2, 0]} tone={PCB} faces={{ top: <PiBoard /> }} />
          <Box3D
            w={w}
            h={h}
            d={d}
            m={m}
            tone={CLEAR}
            faces={{
              front: front(id),
              top: <PiBlocksTop d={d} />,
              left: <rect x={d - 5.5} y={1.1} width={5.5} height={4.1} fill="#9aa0a6" />,
              right: <rect x={0} y={0.4} width={4.8} height={4.8} fill="#a3a8ae" />,
            }}
          />
        </>
      );
    case "zima": {
      const bw = ZIMA_BOARD_W;
      const r2 = ledPairs(pairs, id);
      return (
        <>
          {[0, 1].map((b) => (
            <Box3D
              key={b}
              w={bw}
              h={h}
              d={d}
              m={m}
              at={[(b - 0.5) * (bw + 2), 0, 0]}
              tone={{ front: "transparent", side: "#9ea4aa", top: "transparent" }}
              faces={{
                front: (
                  <>
                    <ZimaBoardFront />
                    <ZimaBoardLeds pair={r2[b]} />
                  </>
                ),
                back: <ZimaBack w={bw} />,
                top: <ZimaTop w={bw} d={d} />,
                left: <rect y={1.9} width={d} height={5.7} fill="#9ea4aa" />,
                right: <rect y={1.9} width={d} height={5.7} fill="#9ea4aa" />,
              }}
            />
          ))}
        </>
      );
    }
    case "nas":
      return (
        <Box3D
          w={w}
          h={h}
          d={d}
          m={m}
          tone={{ front: "transparent", side: "#1a1d21", top: "#1f2226" }}
          faces={{
            front: front(id),
            back: <NasBack />,
            top: <NasTop />,
            left: <Slots w={d} h={h} n={14} y0={0.2} y1={0.8} fill="#111316" />,
            right: <Slots w={d} h={h} n={14} y0={0.2} y1={0.8} fill="#111316" />,
          }}
        />
      );
    case "pdu":
      return (
        <Box3D w={w} h={h} d={d} m={m} tone={{ front: "#121315", side: side, top: "#1b1c1f" }} faces={{ front: front(id), back: <PduBack /> }} />
      );
  }
}

/** Box helper: a local u/v/d range to a centred Box3D placement. */
function boxAt(u: Range, v: Range, d: Range): { at: Vec3; w: number; h: number; d: number } {
  return {
    at: [(u[0] + u[1]) / 2 - W / 2, (v[0] + v[1]) / 2 - H / 2, D / 2 - (d[0] + d[1]) / 2],
    w: u[1] - u[0],
    h: v[1] - v[0],
    d: d[1] - d[0],
  };
}

/** The whole rack: frame, shelves, every device in place, cords, acrylic sides, handles, feet. */
export function RackModel({ m }: { m: number }) {
  const place = (id: RackDeviceId) => {
    const L = PART_LOCAL[id];
    const { at } = boxAt(L.u, L.v, L.d);
    return (
      <div
        key={id}
        className="absolute left-0 top-0 [transform-style:preserve-3d]"
        style={{ transform: `translate3d(${at[0] * m}px, ${at[1] * m}px, ${at[2] * m}px)` }}
      >
        <DeviceModel id={id} m={m} cabled />
      </div>
    );
  };
  const post = (u: Range, d: Range, marks: boolean, key: string) => (
    <Box3D key={key} {...boxAt(u, [0, H], d)} m={m} tone={FRAME} faces={marks ? { front: <UMarks x={2.4} /> } : undefined} />
  );
  const shelf = (y: number, key: string) => (
    <Box3D key={key} {...boxAt([P, W - P], [y - LIP_H, y], [0.5, D - 4])} m={m} tone={LIP} />
  );
  const handle = (x0: number, x1: number, key: string) => (
    <Plane3D key={key} w={x1 - x0} h={13} m={m} at={[(x0 + x1) / 2 - W / 2, -H / 2 - 6.5, 0]}>
      <path
        d={`M1.5 13 V1.8 H${x1 - x0 - 1.5} V13`}
        fill="none"
        stroke="#0b0c0d"
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
    </Plane3D>
  );
  const foot = (u: number, d: number, key: string) => (
    <Box3D key={key} {...boxAt([u, u + 5], [H, H + 3.3], [d, d + 5])} m={m} tone={{ front: "#16181b", side: "#101214", top: "#2a2e33" }} />
  );
  const inner = H - TF - BF;
  const spareTop = TF + (RACK_U - SPARE_U) * U;
  return (
    <>
      {post([0, P], [0.4, 3.4], true, "fl")}
      {post([W - P, W], [0.4, 3.4], false, "fr")}
      {post([0, P], [D - 3, D], false, "bl")}
      {post([W - P, W], [D - 3, D], false, "br")}
      <Box3D
        {...boxAt([0, W], [0, TF], [0, D])}
        m={m}
        tone={{ front: "#e2e5e7", side: "#c9ced1", top: "#1c1f22" }}
        faces={{
          front: <RackWordmark />,
          top: (
            <>
              <defs>
                <pattern id="lab-perf-3d" width={3} height={3} patternUnits="userSpaceOnUse">
                  <rect width={1.3} height={1.3} fill="#0a0b0c" />
                </pattern>
              </defs>
              <rect x={4} y={4} width={W - 8} height={D - 8} fill="url(#lab-perf-3d)" />
            </>
          ),
        }}
      />
      <Box3D {...boxAt([0, W], [H - BF, H], [0, D])} m={m} tone={FRAME} />
      {SLOT_BANDS.filter((b) => b.shelf).map((b) => shelf(b.v[1], `s${b.v[0]}`))}
      {Array.from({ length: SPARE_U }, (_, i) => (
        <Box3D
          key={`blank${i}`}
          {...boxAt([2, W - 2], [spareTop + i * U + 0.3, spareTop + (i + 1) * U - 0.3], [0, 1.5])}
          m={m}
          tone={{ front: "#0e1012", side: "#0c0d0f", top: "#121416" }}
        />
      ))}
      {SLOT_BANDS.flatMap((b) => b.parts).map((id) => place(id))}
      <Plane3D w={W} h={H} m={m} at={[0, 0, D / 2 + 0.15]}>
        <PatchCords opacity={0.9} />
      </Plane3D>
      {[-1, 1].map((t) => (
        <Plane3D
          key={t}
          w={D - 6}
          h={inner}
          m={m}
          at={[(t * W) / 2, TF + inner / 2 - H / 2, 0]}
          turn={90}
          fill="rgba(175,205,220,0.12)"
          border="1px solid rgba(214,218,221,0.3)"
        />
      ))}
      {handle(7, 26, "h1")}
      {handle(W - 26, W - 7, "h2")}
      {foot(0.5, 0.5, "f1")}
      {foot(W - 5.5, 0.5, "f2")}
      {foot(0.5, D - 5.5, "f3")}
      {foot(W - 5.5, D - 5.5, "f4")}
    </>
  );
}

/** Inspector model for any rack hotspot id. */
export function PartModel({ id, m }: { id: RackPartId; m: number }) {
  return id === "rack" ? <RackModel m={m} /> : <DeviceModel id={id} m={m} />;
}
