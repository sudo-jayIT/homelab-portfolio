# Auditing a Firewall Before Pulling It — A Read-Only OPNsense Review

**Environment:** Personal homelab edge (OPNsense router/firewall)
**Role:** read-only config audit · **Date:** July 2026
**Tags:** firewall · attack surface · NAT · Tailscale · change-safety

> Sanitized for publication: addresses, MACs and tailnet details removed.

---

## TL;DR

Before retiring my edge firewall I did a **read-only audit** of its live config — not to
migrate blindly, but to know the real attack surface and the real dependencies first.
The result: the ruleset was ~99% stock (exactly **one** custom rule), there was a
**double-NAT** I hadn't clocked, and the single most important finding was a dependency,
not a vulnerability — **the box being retired was also the only path for remote access.**
Pull it without planning and I'd have locked myself out.

## Why audit a box you're about to remove

Because "it's just a router swap" is how people nuke their own remote access. An edge
device is the highest-value box on the network by definition: it's the ingress, the NAT,
the DHCP/DNS, and — as it turned out — the VPN. I wanted three questions answered before
touching anything:

1. What can actually reach in from the outside? (inbound rules / port forwards)
2. What's custom vs. default, so I know what has to be rebuilt?
3. What breaks the moment this box is gone?

**Method:** entirely read-only, through a GET-only API wrapper. No changes made — an
audit shouldn't alter the thing it's auditing.

## Findings

### 1 — Attack surface is smaller than expected (good)

- **35 filter rules, 34 of them automatic/default.** Only **one** custom rule existed.
- **No WAN inbound-allow rules**, and remote access runs over a VPN rather than port
  forwards — consistent with **zero port forwards** (flagged to verify by hand in the
  UI, since the port-forward endpoint wasn't exposed to the read-only wrapper).

The security read: the external attack surface was essentially "nothing inbound." The
risk here wasn't exposure — it was the opposite, a hidden dependency (see #3).

### 2 — A double-NAT I hadn't accounted for

The firewall's WAN interface wasn't on the ISP directly — it sat **behind an upstream
mesh router**, so the real path was `ISP → mesh (NAT) → firewall (NAT) → LAN`. Not a
vulnerability, but exactly the kind of topology fact that turns a "quick swap" into an
afternoon of confusion if you discover it live instead of on paper.

### 3 — 🔴 The one custom rule *was* remote access

The single custom rule existed to allow **VPN (Tailscale) traffic**, and the VPN node
ran **on the firewall itself**. So the box I was about to unplug was simultaneously:

- the edge router/firewall,
- the DHCP/DNS server, and
- **the only way I get back in remotely.**

Unplugging it first = instant lockout with no remote recovery. The fix is sequencing:
**migrate the VPN off the firewall first** (onto a small always-on subnet-router host
that survives any future router swap), confirm remote access through the new path, and
*only then* retire the old box.

## The change-safety habit

The whole audit was GET-only on purpose, and the migration plan it produced leads with
"move the thing that lets you back in, verify it, then touch anything else." That's the
same reflex I use for risky firewall changes generally — arm a dead-man's auto-revert,
make the change, confirm from a fresh session, then cancel the revert. The firewall is
the one box where a mistake can cut the cord you'd use to fix it.

## Takeaways

- **Audit before you migrate — read-only.** Knowing it was 99% stock turned a scary
  "rebuild the firewall" into "recreate one rule and the DHCP reservations."
- **The scariest finding is often a dependency, not a CVE.** Nothing was *exploitable*;
  the thing that would have hurt me was retiring my own remote-access path.
- **Enumerate what breaks when a box disappears.** For any critical node, the real
  question isn't just "is it secure" but "what silently depends on it" — and the edge
  firewall depends on itself for the recovery path.
