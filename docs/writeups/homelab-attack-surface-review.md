# Auditing My Own Homelab — An Internal Attack-Surface Review

**Environment:** Personal homelab (Proxmox cluster + LXC/VMs behind an edge firewall)
**Role:** self-authorized internal assessment · **Date:** July–September 2026
**Tags:** attack surface · service enumeration · authentication · exposure · backups

> Sanitized for publication: exact addresses and hostnames are generalized, and findings
> are written as an assessment (finding → severity → recommendation) rather than a live
> target list.

---

## Why

I build fast in my lab, and building fast leaves exposure behind: a service bound to the
wrong interface, a default credential I meant to rotate, a host I stood up and forgot.
So I periodically turn the tools I practice with outward on my *own* network and ask the
only question that matters — **standing on an ordinary LAN host, what can I reach, and
what shouldn't I be able to?**

## Scope & method

- **Scope:** the internal `/24` and the services running across the cluster. Authorized
  because it's my own lab.
- **Method:** inventory every listening service (`ss -tlnp` on each host, plus a sweep
  from an unprivileged LAN position), check each one for *who can reach it* and *what
  authentication stands in front of it*, and fingerprint anything I couldn't immediately
  account for. Everything was read-only or live-verified with `curl`/`ss`; no exploitation.

## Findings

### 1 — 🔴 Password vault reachable by every host on the LAN

The highest-value box on the network — the credential vault — was listening on
`0.0.0.0`, so any host on the LAN could reach it directly by IP. It did serve TLS, so
this wasn't cleartext, but *reachability* is the issue: the most sensitive service had
the widest possible exposure. (The way its single-sign-on gate failed to cover this is
its own finding — see the companion write-up, "When SSO Isn't a Gate.")

**Recommendation:** bind the origin to loopback and front it exclusively with the
authenticated reverse proxy, and/or firewall the port to a small set of trusted hosts.
A vault should have the *narrowest* reachability on the network, not the broadest.

### 2 — 🟠 Default credentials on the source-of-truth app

The app that holds my network topology map — the thing that describes where everything
*is* — was still on `admin` / `admin`. Anyone on the LAN could read or rewrite the map,
including through its API. A tidy foothold: it hands an attacker the floor plan.

**Recommendation:** rotate to real credentials in config, restart the service, and
verify the old login is dead. (Flagged, owner-acknowledged; re-verify it was actually
done — "I'll rotate it" is not a control.)

### 3 — 🟢 Unknown host, fingerprinted and cleared

A host I couldn't immediately place was answering on the LAN. Rather than wave it off, I
fingerprinted it: nmap plus the SSH banner identified a Raspberry Pi 4 on Debian 13 with
only 22 and 80 open, serving a static dashboard — a break-glass project I'd built myself
and forgotten the address of. Not rogue. **The point isn't the result; it's that an
unaccounted-for host gets identified, not ignored** — that's the discipline that catches
the one time it *is* rogue.

### 4 — 🟠 Backups that fail silently look exactly like backups that work

Not reachability, but the same theme — a control that only *looks* like one:

- The restic job guarded its run on the backup volume being mounted. When the NFS mount
  dropped, the job **skipped** instead of **failing** — so a missed backup was
  indistinguishable from a successful one.
- Backup notification mail had no relay configured, so every success/failure email went
  nowhere.
- Several services' data was outside the backup set entirely.

**Recommendation:** make a skipped backup a loud failure, wire up notifications over a
real relay, bring every data store into scope — and, above all, **restore-test it**. An
untested backup is a hypothesis, not a control.

## Summary

| # | Finding | Severity | State |
|---|---|---|---|
| 1 | Vault reachable LAN-wide (bound `0.0.0.0`) | 🔴 Critical | Recommendation open |
| 2 | Default creds on topology source-of-truth | 🟠 High | Flagged, re-verify |
| 3 | Unknown host on the LAN | 🟢 Info | Resolved (own device) |
| 4 | Silent backup skips / no alerting / gaps | 🟠 High | Recommendation open |

## Takeaways

- **Your own lab is a target the moment it holds something worth taking.** The vault and
  the topology map were the two highest-value boxes, and both had the weakest access
  control — because they were built early, when "just get it working" wins.
- **`0.0.0.0` is the default footgun.** Most of this traces back to services binding to
  every interface because that's the path of least resistance at setup.
- **A control you never test is a guess.** Silent backup skips and an unverified
  credential rotation are the same failure: something that *reads* as protection but was
  never exercised.
