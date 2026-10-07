/**
 * Focus panel registry (spec 05 section 3.4).
 * The engine's FocusLayer renders PANELS[id] with PanelProps; every panel
 * honours the shell DOM contract in contracts.ts (data-focus-layer >
 * data-lift + data-chrome; the record disc carries data-spin).
 *
 * Extra hooks for the engine:
 *   [data-panel-close]  the close key inside [data-chrome] (focus it after the open timeline)
 *   [data-focus-layer]  also carries role="dialog", aria-modal and aria-label
 */

import type { PanelRegistry } from "@/components/lab/contracts";
import { BadgePanel } from "./BadgePanel";
import { CertPanel } from "./CertPanel";
import { CrtPanel } from "./CrtPanel";
import { MapPanel } from "./MapPanel";
import { PhonePanel } from "./PhonePanel";
import { PosterPanel } from "./PosterPanel";
import { PrintPanel } from "./PrintPanel";
import { RecordPanel } from "./RecordPanel";
import { ResumePanel } from "./ResumePanel";
import { PcPanel } from "./PcPanel";
import { HardwarePanel } from "./HardwarePanel";

export const PANELS: PanelRegistry = {
  monitor: CrtPanel,
  resume: ResumePanel,
  badge: BadgePanel,
  phone: PhonePanel,
  record: RecordPanel,
  print: PrintPanel,
  map: MapPanel,
  poster: PosterPanel,
  firewall: HardwarePanel,
  pc: PcPanel,
  ups: HardwarePanel,
  "cert-1": CertPanel,
  "cert-2": CertPanel,
  "cert-3": CertPanel,
  "cert-4": CertPanel,
};

export { FocusShell, LinkKey, KEY, KEY_LIGHT } from "./FocusShell";
