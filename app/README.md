# Hardware Service Decision Copilot

An AI chat application that helps a customer decide what to do with a broken hardware device: it takes the case details and a photo, then answers in streamed replies under the return and complaint policies. The app is built with Next.js 16, the Vercel AI SDK 7 and React 19 for the streamed chat UI.

## Prerequisites

- Node.js 22 or newer
- An OpenRouter API key and model IDs (see Environment)

## Setup

```bash
cd app
npm ci
cp ../.env.example ../.env   # then fill in the values in the repository-root .env
```

The app reads the repository-root `../.env`. Do not create `app/.env*` files.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts the Next.js dev server on port 3000. |
| `npm run build` | Produces a production build with `next build`. |
| `npm run start` | Serves the production build with `next start`, on port 3000 by default. |
| `npm run typecheck` | Runs `tsc --noEmit` for TypeScript checks. |
| `npm run lint` | Runs Ultracite (Biome) checks. |
| `npm run format` | Applies Ultracite (Biome) fixes. |
| `npm test` | Runs unit and integration tests once with Vitest. |
| `npm run test:watch` | Runs Vitest in watch mode. |
| `npm run test:contract` | Runs the Playwright contract tests against the real stack. |
| `npm run test:e2e` | Runs the Playwright E2E tests in Chromium, Firefox and WebKit. |
| `npm run capture` | Records real API responses into `tests/fixtures/captures` (needs `AI_CAPTURE_DIR`). |

## Environment

Variables are described in `../.env.example`:

- `OPENROUTER_API_KEY` (required): server-side provider key.
- `LLM_MODEL` (required): OpenRouter model ID for the decision chat.
- `VISION_MODEL` (optional): model ID for photo analysis; defaults to `LLM_MODEL`.
- `POLICIES_DIR` (optional): policy documents directory; defaults to `../docs/policies`.
- `PORT` (optional): app port; defaults to 3000.
- `AI_CAPTURE_DIR` (optional): output directory, only for `npm run capture`.

Credentials stay on the server.

## Project layout

- `app/`: App Router routes (`page.tsx`, `api/analyze`, `api/chat`) and global styles.
- `components/`: `ai-elements` and `ui` (vendored, re-synced with the CLIs), `layout`; `case-form` and `chat` are planned.
- `lib/`: `case` (schemas, constants, labels), `image` (content sniffing and size checks), `ai` (server-only provider, env and logging code).
- `tests/`: shared setup, with integration, contract, E2E and captured fixtures planned.

## Testing

- Unit and integration tests (`npm test`) never call the network; the fetch guard and dummy env are in `tests/setup/vitest.setup.ts`.
- Contract and E2E tests (`npm run test:contract`, `npm run test:e2e`) use the real stack with no mocks and no route interception.
- Test photos come from `../assets/example-images/`.

## Documentation

- [Product requirements](../docs/PRD.md)
- Architecture decisions: [000 main architecture](../docs/ADR/000-main-architecture.md), [001 project scaffold](../docs/ADR/001-project-scaffold.md), [002 AI integration](../docs/ADR/002-ai-integration.md), [003 backend API](../docs/ADR/003-backend-api.md), [004 frontend](../docs/ADR/004-frontend.md), [005 testing](../docs/ADR/005-testing.md)
- [Design guidelines](../docs/design-guidelines.md)
- [Implementation plan](../docs/plans/poc-implementation-plan.md)
- Agent rules: [repository AGENTS.md](../AGENTS.md) and [app AGENTS.md](AGENTS.md)

## License

The application is based on the Chatbot template from vercel/chatbot, licensed under Apache-2.0 (Copyright 2024 Vercel, Inc.). See [LICENSE](LICENSE).
