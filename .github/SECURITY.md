# Security policy

## Reporting a vulnerability

Found a security issue? **Don't open a public GitHub issue.** Email
**darksys888@outlook.com** with the details.

Please include:

- What you observed
- How to reproduce
- The impact you think it has

We'll respond within a few days. If the issue is confirmed, you'll be
credited in the fix commit / changelog (unless you prefer to stay
anonymous).

## Scope

This policy covers the GHOSTNET monorepo and the public-facing services
it ships:

- The Retro production stack (`deploy/retro/`)
- The public CDN (`services/cdn/`)
- The `dev/retro/` Holo5 toolkit (only when it ships to remote hosts)

Out of scope: vulnerabilities in upstream dependencies (report them
directly to the upstream project) and issues that only affect a local
developer machine.
