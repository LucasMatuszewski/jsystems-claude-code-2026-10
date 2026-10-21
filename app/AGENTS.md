# App Agent Guide

Nested guide for `app/`. Repository-wide rules (TDD, Manual QA, commit rules) live in [`../AGENTS.md`](../AGENTS.md); read it first. This file adds only app-specific facts.

## Stack
- Next.js 16 App Router, React 19, TypeScript strict with `noUncheckedIndexedAccess`.
- AI SDK 7 (`ai`, `@ai-sdk/react`) with `@openrouter/ai-sdk-provider` 3.x. Consult Context7 `/vercel/ai` before writing any AI code; AI SDK 7 differs from v5/v6.
- AI Elements (`components/ai-elements`) and shadcn/ui (`components/ui`) are vendored. Re-sync them with the CLIs, not by hand; lint is disabled there.
- Tailwind CSS 4 with x-kom tokens in `app/globals.css`. Zod 4 for schemas.
- Tests: Vitest 5 with Testing Library, Playwright 1.64. Lint and format: Biome via Ultracite.
- Package manager: npm only (no pnpm).

## Layout
- `app/`: routes (`page.tsx`, `api/analyze`, `api/chat`), `layout.tsx`, `globals.css`.
- `components/`: `ai-elements`, `ui`, `layout`; `case-form` and `chat` are planned.
- `lib/`: `case`, `image`, `ai`. `lib/ai` is server-only (guarded by `server-only`).
- `tests/`: `setup`, `global-setup.ts`; `integration`, `contract`, `e2e` and `fixtures/captures` are planned.
- Unit tests are colocated as `*.test.ts(x)`.

## Environment
- The app reads the repository-root `../.env`: `next.config.ts` loads it via `@next/env`, and Playwright configs via `process.loadEnvFile`.
- Never create `app/.env*`. Never read or edit `../.env`; use `../.env.example` as the template.
- Variables: `OPENROUTER_API_KEY` (required), `LLM_MODEL` (required), `VISION_MODEL` (optional, defaults to `LLM_MODEL`), `POLICIES_DIR` (default `../docs/policies`), `PORT` (default 3000), `AI_CAPTURE_DIR` (only for `npm run capture`).

## Testing rules
- Unit and integration tests never hit the network: a fetch guard and dummy env live in `tests/setup/vitest.setup.ts`.
- Contract and E2E tests use the real stack with no mocks and no route interception.
- Test photos come only from `../assets/example-images/`.
- Mocks are derived from captures in `tests/fixtures/captures/`, never written from documentation.

## Commands
Run from `app/`. Full descriptions are in `README.md`.
- Dev and run: `npm run dev`, `npm run build`, `npm run start`.
- Checks: `npm run typecheck`, `npm run lint`, `npm run format`.
- Tests: `npm test`, `npm run test:watch`, `npm run test:contract`, `npm run test:e2e`.
- Captures: `npm run capture`.

## Docs
[PRD](../docs/PRD.md), ADRs [000](../docs/ADR/000-main-architecture.md) to [005](../docs/ADR/005-testing.md), [design guidelines](../docs/design-guidelines.md), [implementation plan](../docs/plans/poc-implementation-plan.md).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
