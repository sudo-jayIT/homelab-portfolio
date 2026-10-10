# When SSO Isn't a Gate — Bypassing Forward-Auth by IP

**Environment:** Personal homelab · **Role:** self-authorized review · **Date:** September 2026
**Tags:** forward-auth · SSO · reverse proxy · access control · origin binding

> Sanitized for publication: addresses, hostnames and product specifics generalized.

---

## TL;DR

I put a single-sign-on gate (Authentik forward-auth, via a reverse proxy) in front of a
sensitive internal service and considered it protected. It wasn't. The gate only guarded
the *hostname* that passed through the proxy — the service itself still listened on
`0.0.0.0`, so anything that connected to the host **by IP and port** skipped
authentication entirely. Worse, the one client that mattered — the native mobile app —
used exactly that direct path. The "protected" route was the one nobody actually took.

## The setup

The plan was textbook: service runs on an internal host; a reverse proxy terminates TLS
at a friendly hostname and enforces forward-auth, bouncing unauthenticated requests to
the SSO login before they ever reach the origin.

```
user → https://service.internal   → reverse proxy (forward-auth: SSO) → origin service
```

On paper, every request authenticates first. I'd set up the SSO provider, wired the
forward-auth middleware, confirmed the login redirect worked at the hostname, and moved
on.

## The catch

Forward-auth lives at the **proxy**. The **origin** never learned about it — and the
origin was still bound to `0.0.0.0:<port>`. So there were two doors, not one:

```
user → https://service.internal        → proxy (SSO enforced) → origin   ✅ authenticated
user → https://<host-ip>:<port>         → ─────────────────────→ origin   ❌ no auth at all
```

Anything on the LAN that talked to the IP:port directly walked straight past the gate.

## Confirming it

No exploitation needed — just prove both doors exist. On the host, confirm what the
service is actually bound to:

```bash
ss -tlnp | grep <port>
# LISTEN 0.0.0.0:<port>   ← not loopback; reachable from the whole LAN
```

Then hit each path from a LAN position and compare:

```bash
# Through the proxy hostname — the gate engages:
curl -sS -o /dev/null -w '%{http_code} %{url_effective}\n' -L https://service.internal
#   302 → …/sso/login     (bounced to authentication)

# Straight to the origin IP:port — no gate:
curl -sSk -o /dev/null -w '%{http_code}\n' https://<host-ip>:<port>/
#   200                   (served directly, unauthenticated)
```

Two paths, two outcomes. The hostname authenticates; the IP serves. And because the
service's **native mobile apps connect to the IP:port directly**, the real-world traffic
was taking the unauthenticated door by default. The SSO gate was protecting a path that
was mostly ceremonial.

## Root cause

Authentication was enforced at the **edge (the proxy)**, but the **origin's reachability
was never narrowed**. A proxy-level control is only a control if the proxy is the *only*
way in. Leave the origin world-bound and forward-auth becomes a suggestion, not a gate.

## Fix

- **Bind the origin to loopback** (or a private proxy-only interface) so the reverse
  proxy is the single ingress. This is the real fix — it removes the second door.
- **Failing that, firewall the port** to the proxy host only, so a direct IP connection
  from elsewhere on the LAN can't complete.
- Then re-test the exact `curl` above against the IP: it should now refuse, not serve.

## Takeaways

- **Auth at the proxy ≠ auth at the service.** Forward-auth protects a *route*, not a
  *service*. If the service answers on another route, that route is unauthenticated.
- **Check what your clients actually do.** The protected path and the used path were
  different; testing only the browser hostname would have missed it completely. The
  native app voted with its connection.
- **"Secured" is a claim you verify from the outside.** One `ss` line and two `curl`s
  turned "it's behind SSO" into "it's behind SSO *unless you use its IP, which is what
  everything does.*"
