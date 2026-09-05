---
name: armello-frontend
description: Builds and styles the Armello Rank SPA UI (unlock gate + ranking board) with a medieval card-RPG identity. Use when working on pages, components, CSS, motion, or client UX for armello-rank.
---

# Armello Frontend

## Before you start

1. Read `APP_CONTEXT.md`.
2. Apply the personal `frontend-design` skill for distinctive visual direction.
3. Do **not** change Prisma schema, seed, or API route logic — hand those to `armello-backend`.

## Scope

- `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`
- `src/components/**`
- Client fetch to existing APIs only

## Requirements

- Screens: unlock (code) → ranking (ranks 1–4, +1/−1 buttons).
- Aesthetic: parchment, board-game / Armello-inspired; not generic AI defaults (no purple SaaS, no cream+terracotta template, no broadsheet).
- Expressive fonts (not Inter/Roboto/Arial/system alone); CSS variables for palette.
- Mobile-first; `prefers-reduced-motion` respected.
- Call `POST /api/auth/unlock`, `POST /api/auth/logout`, `GET /api/players`, `POST /api/players/[id]/points`, `GET /api/auth/session` as defined in context.

## Output

Clean, scalable React components; no business-rule drift from `APP_CONTEXT.md`.
