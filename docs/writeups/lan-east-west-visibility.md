# Why the Sensor Was Blind — Seeing East-West Traffic on a Switched LAN

**Environment:** Personal homelab (unmanaged-ish switch, edge firewall, Pi sensor)
**Role:** investigation + design · **Date:** July 2026
**Tags:** switching · east-west traffic · packet capture · SPAN / port-mirror · promiscuous mode

> Sanitized for publication: addresses generalized.

---

## TL;DR

I wanted a live view of machine-to-machine ("east-west") traffic in my lab. Before
building anything, I checked whether I *could* even see it — and proved, with the
firewall's own traffic tables, that neither my sensor host nor the firewall can observe
same-subnet LAN traffic. That's not a misconfiguration; it's how switches work. The only
honest path to east-west visibility on this network is **port mirroring (SPAN) on the
switch**. I measured first instead of drawing a packet animation that would have been
fiction.

## What I was actually asked for

"Show live packets traveling between the machines." Easy to mock up, easy to fake. The
responsible version of that request is a prior question: *can the box doing the watching
see those packets at all?*

## The blind spot (and why it's physics, not a bug)

- **A switch forwards a frame only out the port where the destination lives.** When host
  A talks to host B, the frame goes in A's port and out B's port. The sensor's port
  never receives a copy. The sensor sees only traffic addressed *to it*, plus broadcast
  (ARP, mDNS, DHCP).
- **The firewall can't see it either.** Two hosts on the same subnet talk directly
  through the switch; that traffic never crosses the firewall, so it can never appear in
  the firewall's tables.

So the two devices I might have pointed a dashboard at — the sensor and the firewall —
are structurally incapable of seeing host-to-host LAN traffic. Any "network activity"
graph built from them would be measuring the wrong thing.

## Proof, not theory

I didn't want to argue from first principles, so I pulled the firewall's live per-host
traffic table and looked at *who was talking to whom*:

```
host .123   73.8 kb in / 94.7 kb out   peers: <firewall>
host .129      416 b   / 416 b          peers: <two internet IPs>
LAN-to-LAN pairs NOT involving the firewall: NONE
```

Every peer was either the firewall itself or an address out on the internet. Not one
same-subnet pair showed up — exactly what the switching model predicts. The data agreed
with the theory, which is the point: now I *know*, I'm not assuming.

## What the firewall data is actually good for

The firewall's traffic API is real and useful — but only for traffic that **crosses**
it, i.e. uplink/WAN. If it ever lands on a dashboard it has to be labeled "uplink," not
"network activity," or it quietly lies about what it represents. (It's also behind
credentials that live on a jumpbox; a walk-up kiosk would need its own read-only,
diagnostics-scoped API user — a real decision, not a copy-paste of creds.)

## The only real path: port mirroring

To genuinely see east-west traffic, the switch has to hand a copy of it to the sensor:

- The switch supports **port mirroring (SPAN): many-to-one, up to 4 source ports**,
  configured in its web UI.
- Mirror the interesting ports to the sensor's port, put the sensor NIC in
  **promiscuous mode**, and it finally receives copies of host-to-host frames.

Trade-offs I flagged before committing, because this isn't free:

- Sensor CPU under sustained capture.
- The 4-source-port cap — you choose what you can see; you can't see everything.
- It turns a break-glass kiosk into **a box that sees all LAN traffic** — a sensitive
  posture change for a machine anyone can walk up to.

That's why this is a *project* (switching + promiscuous capture + a sensor build), not a
dashboard tweak — and squarely the kind of thing the lab exists to teach.

## Takeaways

- **Measure visibility before you visualize it.** The most useful output of this was a
  one-line proof that my intended data sources were blind. A pretty graph of nothing is
  worse than no graph.
- **Know where your IDS/sensor can and can't see.** On a switched LAN, a sensor with no
  SPAN feed is deaf to east-west traffic — the exact lateral movement you'd most want to
  catch. Visibility is a design decision, not a default.
- **The network's own topology is the first thing to enumerate.** Understanding *why*
  the switch hides traffic told me exactly what to change (a SPAN port), instead of
  guessing at tools.
