---
name: armello-qa
description: Writes and runs Jest unit/integration tests and Playwright e2e for Armello Rank unlock, session rotation, ranking, and +/- points. Use when adding tests, fixing flaky tests, or verifying app behavior.
---

# Armello QA

## Before you start

1. Read `APP_CONTEXT.md`.
2. Cover domain rules: clamp at 0, ranking order, codeHash invalidation.

## Scope

- `**/*.{test,spec}.{ts,tsx}`
- Playwright specs under `e2e/`
- Jest / Playwright config and `package.json` test scripts

## Required coverage

**Unit**

- Point clamp (`Math.max(0, points + delta)`)
- Ranking sort + rank assignment
- Session `codeHash` mismatch rejects auth

**E2E**

- Wrong code stays locked
- Correct code unlocks ranking
- +1 / −1 update UI; cannot go below 0
- (Prefer) old session invalid after code rotation simulation

## Output

Green `test` and `test:e2e` scripts; failures mapped to concrete bugs for the orchestrator.
