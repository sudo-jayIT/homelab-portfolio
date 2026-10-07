"use client";

/**
 * The open focus (spec 05 sections 2.2, 2.4, 2.5, 10.2).
 *
 * Non-rack hotspots render their panel from the PANELS registry (B6). Each
 * panel owns its shell: div[data-focus-layer] > div[data-lift] + div[data-chrome].
 * The engine runs the lift choreography on [data-lift] and [data-chrome] right
 * after this mounts (useLayoutEffect in LabHero), so the DOM must exist on the
 * first commit. Rack parts open the CSS-3D RackInspector (B7) instead.
 *
 * Panels are keyed by id so switching objects remounts them.
 */

import type { Ref } from "react";
import {
  isRackPart,
  type HotspotId,
  type PanelId,
  type RackInspectorHandle,
  type RackPartId,
  type ScenePose,
} from "@/components/lab/contracts";
import { PANELS } from "@/components/lab/panels";
import { RackInspector } from "@/components/lab/RackInspector";
import { goToSection } from "@/lib/view-store";

export interface FocusLayerProps {
  id: HotspotId;
  onClose: () => void;
  /** Close and chain into another focus (inspector "open the homelab map →"). */
  onGo: (next: HotspotId) => void;
  onStopMusic: () => void;
  poseOf: (id: RackPartId) => ScenePose;
  inspectorRef: Ref<RackInspectorHandle>;
}

export function FocusLayer({ id, onClose, onGo, onStopMusic, poseOf, inspectorRef }: FocusLayerProps) {
  if (isRackPart(id)) {
    return <RackInspector key={id} ref={inspectorRef} initial={id} poseOf={poseOf} onClose={onClose} onGo={onGo} />;
  }
  const Panel = PANELS[id as PanelId];
  if (!Panel) return null;
  return <Panel key={id} id={id as PanelId} onClose={onClose} onNavigate={goToSection} onStopMusic={onStopMusic} />;
}
