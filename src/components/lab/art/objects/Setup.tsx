/** Photo-referenced accessories, authored in the same world space as the room. */
import { faceLeft, faceTop, pathD } from "@/lib/iso";
import type { ComponentProps } from "react";
import { labBox, labIso, labLeft, labRight, labPath } from "@/lib/lab-placement";
import { PART_LOCAL } from "@/lib/rack";
import { IsoBox } from "../primitives";
import { DESK, FIREWALL, LAB_WORKSTATION, RACK, RACK_LOCAL, RACK_SPOT, TONES, UPS } from "../config";

/** Painted before the desktop so its top and rear are correctly occluded. */
export function DeskDrawer() {
  return (
    <g>
      <IsoBox x={550} y={479} z={0} w={34} d={61} h={58} tone={TONES.chassis} rim={false} />
      <g transform={faceLeft(550, 540, 58)}>
        {[0, 19, 38].map((y) => <g key={y}><rect x={1} y={y + 1} width={32} height={17} fill="#26292e" /><path d={`M12 ${y + 5}h10`} stroke="#76787c" strokeWidth={1} /></g>)}
      </g>
    </g>
  );
}

export function DeskSetup() {
  return (
    <g>
      {/* Full-width felt desk mat. */}
      <g transform={faceTop(585, 483, DESK.z + 0.1)}>
        <rect width={174} height={64} rx={2} fill="#35383c" />
        <rect x={2} y={2} width={170} height={60} rx={2} fill="none" stroke="#55565c" strokeWidth={0.4} />
      </g>
      {/* Two upright key lights on desk-mounted poles. */}
      {[588, 733].map((x) => (
        <g key={x}>
          <IsoBox x={x + 4} y={479} z={65} w={2} d={2} h={73} tone={TONES.metal} rim={false} />
          <IsoBox x={x} y={479} z={126} w={12} d={3} h={29} tone={TONES.chassis} rim={false} />
          <g transform={faceLeft(x, 482, 155)}>
            <rect x={1.5} y={1.5} width={9} height={26} rx={4} fill="#20282b" />
          </g>
        </g>
      ))}
      {/* Articulated microphone boom and capsule. */}
      <path d={pathD([[798, 480, 65], [788, 480, 109], [747, 486, 91]])} stroke="#20262b" strokeWidth={3} strokeLinejoin="round" fill="none" />
      <path d={pathD([[795, 480, 65], [785, 480, 109], [744, 486, 91]])} stroke="#454c52" strokeWidth={0.7} fill="none" />
      <IsoBox x={738} y={484} z={87} w={16} d={5} h={6} tone={TONES.metal} rim={false} />
      {/* Speakers either side of the ultrawide. */}
      {[571, 750].map((x) => (
        <g key={x}>
          <IsoBox x={x} y={494} z={65} w={17} d={13} h={22} tone={TONES.chassis} rim={false} />
          <g transform={faceLeft(x, 507, 87)}>
            <circle cx={8.5} cy={12} r={5.6} fill="#080a0c" stroke="#454b51" strokeWidth={1.2} />
          </g>
        </g>
      ))}
      {/* Camera and an exposed hard drive, like the left side of the real desk. */}
      <IsoBox x={552} y={515} z={65} w={18} d={13} h={10} tone={TONES.plastic} rim={false} />
      <g transform={faceLeft(552, 528, 75)}><circle cx={10} cy={6} r={5} fill="#11151a" stroke="#535b62" strokeWidth={1.4} /></g>
      <IsoBox x={553} y={535} z={65} w={22} d={13} h={2} tone={TONES.metal} rim={false} />
      <g transform={faceTop(553, 535, 67)}><rect width={22} height={13} fill="#c1c5c3" /><circle cx={8} cy={6.5} r={4.5} fill="#626d72" /><circle cx={8} cy={6.5} r={1.5} fill="#dce2e0" /></g>
    </g>
  );
}

function LabBox(props: ComponentProps<typeof IsoBox>) { return <IsoBox {...props} {...labBox(props)} />; }

export function LabCabinet() {
  const { x, y, w, d } = RACK_SPOT;
  const { bodyH, topH } = LAB_WORKSTATION;
  return (
    <g>
      {/* Three drawers inside the workstation's exposed black steel frame. */}
      {[1, 21, 41].map((z) => <LabBox key={z} x={x - 25} y={y - 2} z={z} w={w + 23} d={d + 4} h={17} tone={TONES.chassis} rim={false} />)}
      {[x - 27, x + w - 3].flatMap((px) => [y - 4, y + d].map((py) => <LabBox key={`${px}-${py}`} x={px} y={py} z={0} w={4} d={4} h={bodyH} tone={TONES.metal} rim={false} />))}
      <g transform={labLeft(x - 27, y + d + 4, bodyH)}>
        {[0, 20, 40].map((v) => <g key={v}><rect x={2} y={v + 1} width={w + 23} height={18} fill="#35383d" /><path d={`M5 ${v + 4}h${w + 17}`} stroke="#62656a" strokeWidth={1.2} /></g>)}
      </g>
      <LabBox x={x - 28} y={y - 5} z={bodyH} w={w + 29} d={d + 10} h={topH} tone={TONES.wood} rim={false} />
    </g>
  );
}

export function LabSideHardware() {
  const { x, y } = RACK_SPOT;
  const { surfaceZ } = LAB_WORKSTATION;
  const upsH = UPS.h;
  const [routerX, routerY] = labIso(x - 9.5, y + 24, surfaceZ + upsH + 7.5);
  return (
    <g>
      {/* Silver front fascia, black vented body: the dedicated OPNsense firewall. */}
      <g><title>HP t730 thin client · OPNsense firewall</title>
      <LabBox {...FIREWALL} tone={TONES.metal} rim={false} />
      <g transform={labRight(FIREWALL.x, FIREWALL.y + FIREWALL.d, FIREWALL.z + FIREWALL.h)}>
        <rect width={31} height={40} fill="#14181c" />
        {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${2 + i * 1.7} 3v33`} stroke="#3a4148" strokeWidth={0.65} />)}
      </g>
      <g transform={labLeft(FIREWALL.x, FIREWALL.y + FIREWALL.d, FIREWALL.z + FIREWALL.h)}>
        <rect width={9} height={40} rx={0.8} fill="#b9bcc3" />
        <rect x={2.8} y={3} width={2.3} height={4} rx={0.8} fill="#8a919c" stroke="#e0e5ea" strokeWidth={0.4} />
        <circle cx={4} cy={5} r={0.5} fill="#a9eeff" />
        {[11, 16, 22, 27].map((v, i) => <rect key={v} x={3} y={v} width={1.8} height={3.3} fill={i > 1 ? "#1b59b2" : "#14181c"} />)}
        <circle cx={4} cy={33} r={0.6} fill="#1c2228" />
        <text x={4.5} y={38} fontSize={1.8} textAnchor="middle" fill="#434b55" className="lab-mono">t730</text>
      </g>
      </g>
      {/* The owner's 1500VA UPS, with the Google mesh router above it. */}
      <g><title>CyberPower 1500VA UPS</title>
      <LabBox {...UPS} tone={TONES.chassis} rim={false} />
      <g transform={labLeft(UPS.x, UPS.y + UPS.d, UPS.z + UPS.h)}>
        <rect x={3} y={11} width={17} height={28} rx={1} fill="#0a111d" />
        <text x={11.5} y={24} fontSize={4} textAnchor="middle" fill="#57b8ff" className="lab-mono">UPS</text>
        <text x={11.5} y={32} fontSize={3} textAnchor="middle" fill="#57b8ff">1500VA</text>
        <circle cx={6} cy={5} r={1.5} fill="#b5ecff" />
      </g>
      </g>
      {/* Rounded white Google mesh Wi-Fi router, resting directly on the UPS. */}
      <g><title>Google mesh Wi-Fi router · on the UPS</title>
        <defs><linearGradient id="lab-google-mesh"><stop stopColor="#f1f3ed" /><stop offset="0.6" stopColor="#e2e8e2" /><stop offset="1" stopColor="#b4c2bc" /></linearGradient></defs>
        <g transform={`translate(${routerX} ${routerY})`}>
          <rect x={-12} y={-16} width={24} height={30} rx={8} fill="url(#lab-google-mesh)" />
          <path d="M-8-10q8-5 16 0" fill="none" stroke="#fff" strokeWidth={0.6} opacity={0.5} />
          <text x={0} y={1} textAnchor="middle" fontSize={3.4} fill="#a6b4ad">G</text>
          <circle cx={0} cy={8} r={0.45} fill="#ecffff" />
        </g>
      </g>
    </g>
  );
}

export function RackSetup() {
  const s = RACK_LOCAL.S;
  const displayScale = RACK.w / 53;
  return (
    <g>
      {/* Display resting on the rack, with a Grafana-like dashboard. */}
      <LabBox x={RACK.x + 4} y={RACK.y + 7} z={RACK.top} w={RACK.w - 8} d={14} h={2} tone={TONES.chassis} rim={false} />
      <LabBox x={RACK.x + RACK.w / 2 - 1.5} y={RACK.y + 12} z={RACK.top + 2} w={3} d={3} h={5} tone={TONES.metal} rim={false} />
      <LabBox x={RACK.x} y={RACK.y + 13} z={RACK.top + 7} w={RACK.w} d={3} h={29 * displayScale} tone={TONES.chassis} rim={false} />
      <g transform={`${labLeft(RACK.x, RACK.y + 16, RACK.top + 7 + 29 * displayScale)} scale(${displayScale})`}>
        <rect x={2} y={2} width={49} height={25} fill="#211b46" />
        <text x={5} y={7} fontSize={3} fill="#ffb34d" className="lab-mono">GRAFANA</text>
        {[0, 1, 2].map((i) => <g key={i}><rect x={5 + i * 15} y={10} width={12} height={13} rx={0.7} fill="#302b55" /><path d={`M${6 + i * 15} 21l2-4 2 2 2-6 3 3`} stroke={i === 1 ? "#bf83ff" : "#75cddd"} strokeWidth={0.8} fill="none" /></g>)}
      </g>
      {/* Blue patch loops across the two network rows. */}
      <g transform={`${labLeft(RACK.x, RACK.y + RACK.d, RACK.top)} scale(${s})`} fill="none" strokeLinecap="round">
        {Array.from({ length: 8 }, (_, i) => <g key={i}><path d={`M${11 + i * 6.2} 14C${11 + i * 6.2} 29 ${17 + i * 5.2} 32 ${17 + i * 5.2} 25`} stroke="#102143" strokeWidth={2.8} /><path d={`M${11 + i * 6.2} 14C${11 + i * 6.2} 29 ${17 + i * 5.2} 32 ${17 + i * 5.2} 25`} stroke="#347bd2" strokeWidth={1.6} /></g>)}
        <path d="M17 25C5 31 5 43 15 49" stroke="#347bd2" strokeWidth={2} />
        {[0, 1].map((i) => {
          const u = PART_LOCAL.zima.u[0] + 5 + i * 21.5;
          const v = PART_LOCAL.zima.v[0] + 4;
          return <path key={i} d={`M${u} ${v}c-3 9 10 12 12 0`} stroke="#2db89d" strokeWidth={1.7} />;
        })}
      </g>
    </g>
  );
}

export function SetupFloorLights() {
  return (
    <g>
      <defs><radialGradient id="lab-purple-pool"><stop stopColor="#ce41ff" stopOpacity={0.48} /><stop offset="1" stopColor="#8f36ff" stopOpacity={0} /></radialGradient></defs>
      <g data-toggle-light="ambient" transform={faceTop(520, 480, 0)}><ellipse cx={160} cy={85} rx={200} ry={135} fill="url(#lab-purple-pool)" /></g>
    </g>
  );
}

export function SetupLights() {
  return (
    <g>
      <path data-toggle-light="ambient" d={pathD([[551, 549, 59], [806, 549, 59]])} stroke="#d66cff" strokeWidth={1.8} />
      {[588, 733].map((x) => <g data-toggle-light={x === 588 ? "light-left" : "light-right"} key={x} transform={faceLeft(x, 482, 155)}><rect x={1.5} y={1.5} width={9} height={26} rx={4} fill="#f5fff4" /><rect x={-3} y={-3} width={18} height={35} rx={8} fill="#f3ffe9" opacity={0.08} /></g>)}
      <path d={labPath([[RACK.x + 5, RACK.y + RACK.d, RACK.top - 5], [RACK.x + RACK.w - 5, RACK.y + RACK.d, RACK.top - 5]])} stroke="#d356ff" strokeWidth={1.7} />
    </g>
  );
}
