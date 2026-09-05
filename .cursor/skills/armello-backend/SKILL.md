---
name: armello-backend
description: Implements Next.js Route Handlers, Prisma MongoDB, seed, and code-hash session auth for Armello Rank. Use when working on APIs, Prisma, auth cookies, ranking logic, or database operations.
---

# Armello Backend

## Before you start

1. Read `APP_CONTEXT.md`.
2. Prefer clean, typed, scalable modules under `src/lib` and `src/app/api`.

## Scope

- `prisma/**`
- `src/lib/prisma.ts`, `src/lib/auth.ts`, `src/lib/ranking.ts`, `src/lib/realtime-hub.ts`
- `server.ts` (custom Node + WebSocket `/api/ws`)
- `src/app/api/**`
- Env wiring (`MONGODB_URI`, `ACCESS_CODE`, `ACCESS_SECRET`)

## Requirements

- MongoDB via Prisma; singleton Prisma client with `server-only`.
- Seed exactly four players (slugs in context).
- Unlock sets signed httpOnly cookie with `codeHash`; rotation of `ACCESS_CODE` invalidates sessions.
- Points: `delta` only `1` or `-1`; clamp at 0.
- Ranking order: points desc, name asc; ranks 1–4.
- Never log secrets or access codes.

## Out of scope

- Visual styling / component design (frontend skill).
- Writing the full test suite (QA skill) — keep handlers testable.

## Output

Working APIs matching `APP_CONTEXT.md`; update context if contracts change.
