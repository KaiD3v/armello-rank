# Armello Rank — Application Context

> **Source of truth for business rules and CORE.** Any change to domain rules, access model, scoring, fixed players, or API contracts MUST update this file in the same delivery.

## Purpose

Simple SPA ranking app for a private Armello group. Track points from won matches; higher points rank higher (positions 1–4).

## Fixed players

Exactly four players (seeded; not user-created):

| Slug       | Name     |
|------------|----------|
| `kaique`   | Kaique   |
| `pedro`    | Pedro    |
| `henrique` | Henrique |
| `afonso`   | Afonso   |

## Scoring

- Buttons **+1** and **−1** per player only (no custom amounts).
- Points never go below **0** (`Math.max(0, points + delta)`).
- Ranking: sort by `points` descending, then `name` ascending (stable 1–4 positions; no tied ranks).

## Access (no user login)

- Shared `ACCESS_CODE` in environment.
- Successful unlock sets an **httpOnly** signed cookie/token containing `codeHash = sha256(ACCESS_CODE)`.
- On every protected request: verify signature **and** `codeHash === sha256(current ACCESS_CODE)`.
- Changing `ACCESS_CODE` invalidates all existing sessions.
- Logout clears the cookie.

Cookie flags: `httpOnly`, `secure` in production, `sameSite=lax`, `path=/`.

## Stack

- Next.js 16 App Router + React 19 + Tailwind 4
- Prisma with MongoDB (`MONGODB_URI`)
- Route Handlers under `src/app/api/**`
- Custom Node server (`server.ts`) with WebSocket (`ws`) for live ranking sync on a **single long-running process** (local / Railway / VPS). Not for multi-instance serverless without a shared pub/sub.
- Aesthetic: medieval / Armello card-RPG (parchment, board-game feel); reference [armello.com](https://armello.com/)

## Environment variables (names only)

| Name            | Role                                      |
|-----------------|-------------------------------------------|
| `MONGODB_URI`   | Prisma MongoDB connection string          |
| `ACCESS_CODE`   | Shared unlock code                        |
| `ACCESS_SECRET` | HMAC/signing secret for session cookie    |
| `PORT`          | Optional HTTP listen port (default `3000`)|

## API contract

| Method | Path                         | Auth | Body / notes                                      |
|--------|------------------------------|------|---------------------------------------------------|
| POST   | `/api/auth/unlock`           | No   | `{ code: string }` → sets session cookie          |
| POST   | `/api/auth/logout`           | No   | Clears session cookie                             |
| GET    | `/api/auth/session`          | Cookie | `{ authenticated: boolean }`                    |
| GET    | `/api/players`               | Yes  | Ranked `{ rank, id, slug, name, points }[]`       |
| POST   | `/api/players/[id]/points`  | Yes  | `{ delta: 1 \| -1 }` → updated player + clamp; also publishes ranking over WS |
| WS     | `/api/ws`                    | Cookie | Live ranking snapshots (see below)              |

Unauthorized protected routes → `401`. Unauthorized WS upgrades are rejected.

### WebSocket (`/api/ws`)

- Same-origin; auth via `armello_session` cookie on the upgrade handshake (same `codeHash` rules as HTTP).
- On connect: server sends current ranked snapshot.
- After a successful points mutation: server broadcasts to all connected clients.

Server → client:

```json
{
  "type": "ranking",
  "players": [{ "rank": 1, "id": "...", "slug": "...", "name": "...", "points": 0 }],
  "change": {
    "playerId": "...",
    "playerName": "...",
    "delta": 1,
    "resultingPoints": 1,
    "at": 1710000000000
  }
}
```

`change` is omitted on the initial snapshot; included after `POST .../points`.

Client → server (optional keepalive): `{ "type": "ping" }` → `{ "type": "pong" }`.

Mutations remain HTTP (`POST .../points`); the socket is read-only for ranking state.

## Key paths

- Context: `APP_CONTEXT.md` (this file)
- Prisma: `prisma/schema.prisma`, `prisma/seed.ts`
- Access helpers: `src/lib/access-code.ts`
- Auth helpers: `src/lib/auth.ts`, ranking: `src/lib/ranking.ts`
- Realtime: `src/lib/realtime-hub.ts`, `src/lib/realtime-auth.ts`, `server.ts`
- Prisma client: `src/lib/prisma.ts`
- UI: `src/app/page.tsx`, `src/components/**`
- Agents: `.cursor/skills/armello-*`, `.cursor/rules/app-context.mdc`

## Agent workflow

1. Read this file before implementing.
2. Backend → Frontend → QA → Revisor.
3. Update this file when CORE/business rules change.
