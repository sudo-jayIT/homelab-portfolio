# Containing a Vulnerable-App Sandbox — Enumerating the Blast Radius

**Environment:** Personal Proxmox homelab · **Role:** build + self-assessment · **Date:** July 2026
**Tags:** Proxmox SDN · nftables · network isolation · enumeration · network namespaces

---

## TL;DR

I needed somewhere to run deliberately-vulnerable VMs for practice without putting the
rest of my homelab at risk. The hard part isn't building the sandbox — it's *proving*
it's actually contained. So after building an isolated network on a single-NIC Proxmox
host, I put myself in the attacker's seat: I enumerated the network from an
assumed-compromised position inside the sandbox and confirmed that the LAN and the
hypervisor's own admin plane were unreachable, while outbound internet (for `apt`) still
worked. Config review said "isolated"; enumeration is what proved it.

## The problem

Intentionally vulnerable boxes are, by definition, going to get popped. If one shares a
flat network with my NAS, my password manager, and my Proxmox management interface, then
"practice" is one SSRF or reverse shell away from a real incident. I wanted a lab guest
to be able to:

- **reach the internet** — so `apt` and tool installs work; and
- **reach nothing else** — not the LAN, not other trust zones, and crucially not the
  hypervisor hosting it.

Constraint that shaped everything: the host (`pve2`) has **one physical NIC**, and my
OPNsense firewall has no free port either. A router-policed VLAN was the "proper"
answer but a VLAN mistake on the switch can take the whole LAN down. So I did the
isolation *inside* the host first — contained, reversible, and good enough to trust.

## Threat model

The assumption I designed and tested against: **a sandbox guest is fully compromised and
the attacker has code execution on it.** The question a writeup has to answer isn't "did
I configure a firewall" — it's "standing on that box, what can the attacker actually
touch?"

## The build (short version)

- Proxmox **SDN Simple zone** → a Linux bridge named `sandbox`.
- Subnet `10.10.10.0/24`, gateway `10.10.10.1` on the host, **SNAT** on for internet
  egress. (I picked `10.10.10.x` deliberately — one glance at a prompt tells me which
  network I'm on. DNS is `1.1.1.1`, because the LAN resolver is supposed to be
  unreachable from here.)
- **nftables** host firewall (`proxmox-firewall`) with source-based drops:

```
FORWARD ACCEPT -source 10.10.10.0/24 -dest 10.10.10.0/24   # guest ↔ guest (the lab itself)
IN     DROP   -i sandbox                                   # protect the host
FORWARD DROP  -source 10.10.10.0/24 -dest 172.16.0.0/12    # block RFC1918…
FORWARD DROP  -source 10.10.10.0/24 -dest 10.0.0.0/8
FORWARD DROP  -source 10.10.10.0/24 -dest 192.168.0.0/16
```

Rule order is load-bearing: the drops must sit above the implicit `accept`, or
"internet yes, LAN no" silently collapses into "everything yes."

## Enumeration — testing it like an attacker would

I didn't want to trust the GUI's green checkmarks, and I didn't want to spin up a whole
VM just to test reachability. So I emulated a compromised guest with a **network
namespace** attached straight to the `sandbox` bridge — same L2/L3 position a real guest
NIC would have — and enumerated outward from `10.10.10.99`:

```bash
ip netns add sbxtest
ip link add veth-sbx type veth peer name veth-sbxp
ip link set veth-sbx master sandbox; ip link set veth-sbx up
ip link set veth-sbxp netns sbxtest
ip netns exec sbxtest ip addr add 10.10.10.99/24 dev veth-sbxp
ip netns exec sbxtest ip link set veth-sbxp up
ip netns exec sbxtest ip route add default via 10.10.10.1

R(){ ip netns exec sbxtest "$@"; }
R ping -c1 -W2 1.1.1.1                         # internet egress
R ping -c1 -W2 192.168.3.1                     # OPNsense gateway
R curl -sS  -m4 http://192.168.3.160           # Nextcloud host
R curl -sSk -m4 https://10.10.10.1:8006        # Proxmox admin UI (the host itself)
```

### Results

| From the compromised position, target… | Expected | Observed |
|---|---|---|
| Internet (`1.1.1.1`) | reachable (apt) | ✅ reply, 0% loss |
| OPNsense gateway (`192.168.3.1`) | blocked | ✅ 100% loss |
| Nextcloud host (`192.168.3.160`) | blocked | ✅ no connection |
| NAS (`192.168.3.142`) | blocked | ✅ no connection |
| Proxmox admin UI (`:8006`, via both host IPs) | blocked | ✅ no connection |

The only thing that answered was the internet. Everything that mattered — the gateway,
my files, the NAS, and the box's own management plane — stayed dark.

## Findings: why "looks isolated" kept lying to me

The reason this writeup exists. Each of these presented as a *fully working* firewall
with the LAN still wide open:

1. **Rules are created *disabled* in the Proxmox UI.** A disabled rule isn't compiled
   at all. Every rule present, sandbox still open. Fix: tick Enable on each.
2. **FORWARD host rules only apply on the nftables engine.** Legacy iptables silently
   ignores host forward rules for *routed* traffic (bridge→bridge). The host-protect
   rule worked, so it looked healthy — but the LAN block did nothing. Fix: enable
   nftables (a node option, not exposed in the GUI).
3. **Don't match a forward rule on `-i sandbox`.** An SDN vnet doesn't resolve as a
   firewall interface at cluster level, so the rule fails to compile and the chain
   falls back to a bare `accept`. Fix: match on `-source 10.10.10.0/24`.
4. **The sandbox's own `/24` lives inside `10.0.0.0/8`** — so the RFC1918 drop also
   killed guest-to-guest traffic, which is the whole point of an attack lab. Fix: a
   scoped `src+dest = 10.10.10.0/24` ACCEPT above the drops (verified it can't loosen
   the LAN block).
5. **A guest NIC with `firewall=1` drops *all* inbound** under the default-DROP input
   policy, making a correctly-addressed target VM totally unreachable. Attack targets
   need raw traffic; the host rules already do the isolating. Fix: `firewall=0` on
   target NICs.

Confirming the compile actually happened was its own step:

```bash
nft list chain inet proxmox-firewall cluster-forward
# must SHOW 3×  ip saddr 10.10.10.0/24 ip daddr <priv> drop   ABOVE  accept
```

## Residual risk (the honest part)

This contains a compromised *guest*. It does **not** contain a hypervisor escape — a
breakout lands on `pve2` alongside the other sandbox guests. So the compensating control
is placement: **`pve2` holds no credentials to anything real.** Trust-plane services
(Home Assistant and friends) live on a different host entirely. The eventual upgrade is
to move policing out to OPNsense on a dedicated VLAN, where the host needs no address on
the sandbox net at all — worth doing, not required to be safe today.

## Takeaways

- **Config review is not verification.** Three of the five findings above looked
  perfectly configured and were wide open. The namespace test caught every one.
- **Test from the attacker's position, not the defender's.** Reachability from
  `10.10.10.99` is the question that matters; the GUI's rule list isn't.
- **A network namespace is a free, instant "guest."** No VM, no boot, same L2 adjacency
  — ideal for proving an isolation boundary before you trust it with a live target.
- **Know what your control does *not* cover.** Writing down the host-escape gap — and
  the placement decision that answers it — is part of the assessment, not an admission
  it's broken.
