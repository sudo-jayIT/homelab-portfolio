"use client";

import { ShieldCheck, BatteryCharging, Cpu } from "lucide-react";
import type { PanelProps } from "@/components/lab/contracts";
import { SIDE_HARDWARE } from "@/content/homelab";
import { FocusShell, PANEL_SHADOW } from "./FocusShell";

export function HardwarePanel({ id, onClose }: PanelProps) {
  const firewall = id === "firewall";
  const hardware = SIDE_HARDWARE[id === "pc" ? "pc" : firewall ? "firewall" : "ups"];
  const Icon = id === "pc" ? Cpu : firewall ? ShieldCheck : BatteryCharging;
  return (
    <FocusShell
      label={`${hardware.title} · ${hardware.role}`}
      caption={hardware.role}
      onClose={onClose}
    >
      <article className={`max-h-[calc(100dvh-8rem)] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-line-strong bg-card text-gray-1 ${PANEL_SHADOW}`}>
        <div className="border-b border-line-strong p-6">
          <Icon className="mb-4 h-8 w-8 text-mint" aria-hidden />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mint">{hardware.role}</p>
          <h2 className="mt-2 text-2xl font-semibold text-mint-head">{hardware.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-1">{hardware.description}</p>
        </div>
        <dl className="space-y-4 p-6">
          {hardware.specs.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4">
              <dt className="font-mono text-xs text-gray-2">{label}</dt>
              <dd className="text-right text-sm font-medium text-mint-head">{value}</dd>
            </div>
          ))}
        </dl>
      </article>
    </FocusShell>
  );
}
