"use client";

import type { PanelProps } from "@/components/lab/contracts";
import { FocusShell } from "./FocusShell";
import styles from "./MapPanel.module.css";

/** Owner-supplied homelab-map (2).html, adapted to the room’s focus shell. */
export function MapPanel({ onClose }: PanelProps) {
  return <FocusShell label="Network map" onClose={onClose}>
    <div className={styles.frame}>
      <article className={styles.board}>
<div className={styles["header"]}>
    <h1>homelab.map</h1>
    <div className={styles["subtitle"]}>4-node Proxmox VE cluster &middot; QDevice on a Pi 4 &middot; double-NAT via Google mesh &middot; two physical switches</div>
  </div>

  <div className={styles["tree-wrap"]} tabIndex={0} role="region" aria-label="Physical network topology; scroll horizontally to see all devices">
    <div className={styles["tree"]}>

      <div className={styles["box"]}>
        <div className={styles["title"]}>wan uplink</div>
        <div className={styles["sub"]}>double-NAT &middot; Google mesh</div>
      </div>
      <div className={styles["hline"]}></div>

      <div className={styles["box"]}>
        <div className={styles["title"]}>opnsense</div>
        <div className={styles["sub"]}>firewall &middot; LAN gateway</div>
      </div>
      <div className={styles["hline"]}></div>

      <div className={styles["branch"]}>
        <div className={[styles["box"], styles["switch"]].join(" ")}>
          <div className={styles["title"]}>8-port switch</div>
          <div className={styles["sub"]}>netgear gs308e</div>
        </div>
        <div className={styles["hline"]}></div>

        <div className={styles["stack"]}>
          <div className={styles["twig"]}>
            <div className={styles["box"]}>
              <div className={styles["title"]}>pve</div>
              <div className={styles["sub"]}>edge + critical services</div>
            </div>
          </div>
          <div className={styles["twig"]}>
            <div className={styles["box"]}>
              <div className={styles["title"]}>pve2</div>
              <div className={styles["sub"]}>monitoring + tools</div>
            </div>
          </div>
          <div className={styles["twig"]}>
            <div className={styles["box"]}>
              <div className={styles["title"]}>pve3</div>
              <div className={styles["sub"]}>VMs + AI</div>
            </div>
          </div>
          <div className={styles["twig"]}>
            <div className={[styles["box"], styles["dim"]].join(" ")}>
              <div className={styles["title"]}>pve4</div>
              <div className={styles["sub"]}>idle &middot; spare capacity</div>
            </div>
          </div>
          <div className={styles["twig"]}>
            <div className={styles["box"]}>
              <div className={styles["title"]}>ugreen nas</div>
              <div className={styles["sub"]}>NFS storage</div>
            </div>
          </div>
          <div className={styles["twig"]}>
            <div className={styles["box"]}>
              <div className={styles["title"]}>pi 4 &middot; qdevice</div>
              <div className={styles["sub"]}>quorum + dashboard</div>
            </div>
          </div>

          <div className={[styles["twig"], styles["branch"]].join(" ")}>
            <div className={[styles["box"], styles["switch"]].join(" ")}>
              <div className={styles["title"]}>5-port switch</div>
              <div className={styles["sub"]}>uplink to 8-port</div>
            </div>
            <div className={styles["hline"]}></div>

            <div className={styles["stack"]}>
              <div className={styles["twig"]}>
                <div className={styles["box"]}>
                  <div className={styles["title"]}>honeypot &middot; zimaboard</div>
                  <div className={styles["sub"]}>standalone, not clustered</div>
                </div>
              </div>
              <div className={styles["twig"]}>
                <div className={[styles["box"], styles["leaf"]].join(" ")}>
                  <div className={styles["title"]}>gl.inet ap</div>
                  <div className={styles["sub"]}>wifi access point</div>
                </div>
              </div>
              <div className={styles["twig"]}>
                <div className={[styles["box"], styles["leaf"]].join(" ")}>
                  <div className={styles["title"]}>hue bridge</div>
                  <div className={styles["sub"]}>smart home</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
    <div className={styles["footnote"]}>tailscale overlay runs on opnsense, not a physical hop &middot; advertises the LAN to remote clients</div>
  </div>

  <div className={styles["cols"]}>
    <div className={styles["col"]}>
      <h2>what runs where</h2>

      <div className={styles["entry"]}>
        <div className={styles["host"]}>pve <span className={styles["ip"]}>&middot; edge + critical services</span></div>
        <div className={styles["services"]}>Caddy, Authentik, Vaultwarden, Nextcloud, Seafile, Immich, Jellyfin, Wazuh, Hermes Agent, Paperless-ngx, AnythingLLM, Jumpbox</div>
      </div>

      <div className={styles["entry"]}>
        <div className={styles["host"]}>pve2 <span className={styles["ip"]}>&middot; monitoring + tools</span></div>
        <div className={styles["services"]}>Homarr, Homelable, Grafana, Prometheus, Gitea, Postiz, ntopng, Trilium Notes, n8n, Paperclip</div>
      </div>

      <div className={styles["entry"]}>
        <div className={styles["host"]}>pve3 <span className={styles["ip"]}>&middot; VMs + AI</span></div>
        <div className={styles["services"]}>Home Assistant (HAOS), Ollama, mindspace-backend, win10 (stopped)</div>
      </div>

      <div className={styles["entry"]}>
        <div className={styles["host"]}>pve4 <span className={styles["ip"]}>&middot; idle</span></div>
        <div className={styles["services"]}>nothing assigned yet &mdash; spare capacity in reserve</div>
      </div>

      <div className={styles["entry"]}>
        <div className={styles["host"]}>pi 4 <span className={styles["ip"]}>&middot; quorum + dashboard</span></div>
        <div className={styles["services"]}>corosync-qnetd (5th cluster vote), offline-first nginx dashboard</div>
      </div>

      <div className={styles["entry"]}>
        <div className={styles["host"]}>honeypot &middot; zimaboard</div>
        <div className={styles["services"]}>Cowrie + OpenCanary (bait guest), Suricata/Zeek sensor &mdash; one-way log forward to Wazuh</div>
      </div>

      <div className={styles["entry"]}>
        <div className={styles["host"]}>storage</div>
        <div className={styles["services"]}>UGREEN NAS over NFS &middot; 4TB NVMe SSD + 2x8TB HDD mirror</div>
      </div>
    </div>

    <div className={styles["col"]}>
      <h2>hardening</h2>
      <div className={styles["tags"]}>
        <div className={styles["tag"]}>opn wrapper: GET-only, no POST, no stored creds off-box</div>
        <div className={styles["tag"]}>OPNsense + both switches: no SSH, UI-driven changes only</div>
        <div className={styles["tag"]}>honeynet: zero inbound rules into LAN</div>
        <div className={styles["tag"]}>honeypot host: standalone Proxmox, no cluster trust</div>
        <div className={styles["tag"]}>one-way log diode: honeynet sensor &rarr; Wazuh</div>
        <div className={styles["tag"]}>Authentik SSO gates n8n, Homelable, Hermes, ntopng, Wazuh</div>
        <div className={styles["tag"]}>QDevice: cert-based, no standing SSH trust after setup</div>
      </div>
    </div>
  </div>
      </article>
    </div>
  </FocusShell>;
}
