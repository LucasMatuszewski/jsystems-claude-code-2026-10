# PoC implementation — progress handoff (2026-10-21)

Branch: `feature/hardware-service-decision-copilot`. Executed per [`poc-implementation-plan.md`](poc-implementation-plan.md) by an orchestrator delegating to `be-developer`, `fe-developer` and `qa-engineer` subagents. Pending task briefs are in [`handoff-briefs/`](handoff-briefs/) (the working copies live in the gitignored `.agent-briefs/`).

## Status

| Phase | Status |
|---|---|
| P0 Scaffold | Done: P0-02…P0-06 accepted |
| P1 Domain core | Done: P1-01…P1-06 accepted |
| P2 Backend AI | P2-01…P2-09 accepted. P2-10 (contract reliability run, `--repeat-each=3`) **not run** |
| P3 Form screen | Done: P3-01…P3-05 accepted; P3-06 E2E run done (defects fixed in FIX-05/06/08) |
| P4 Chat screen | P4-01…P4-06 accepted; P4-07 E2E run done (instability diagnosed in FIX-09); FIX-10 **in progress** |
| P5 Acceptance | **Not started**: P5-01 full verification, P5-02 manual QA + brand comparison, P5-03 final AC traceability, P5-04 final report |

### Verified results so far
- Unit + integration: 487/487 green, offline (fetch guard); typecheck and lint clean; build 0 warnings.
- Contract (real OpenRouter, `openai/gpt-6-luna`): C-01…C-06 green; decision matrix 5/6 — C-07 (c) failed because of a fixture defect (laptop scenario carried `equipmentVisible: "Smartfon"`; fix is step b of P2-10).
- Captures: `app/tests/fixtures/captures/2026-10-21/` (50 files, no secrets); integration/unit mocks derive from them.
- E2E (after FIX-09, Chromium, chat-decisions + chat-controls ×2): 22/24; remaining failures = E-14 spec race (FIX-10). Firefox `@smoke` green except E-14. E-22 (failure path) green. TTFC max 19.5 s (< 60 s).
- WebKit cannot launch on the VM: missing system libraries (`sudo npx playwright install-deps webkit` needed).

## Open work (in order)
1. **FIX-10** ([brief](handoff-briefs/FIX-10.md)): the config part is committed as WIP (browsers pinned to pl-PL / Europe/Warsaw). Still to do: change E-18's keyboard date entry to the Polish field order (dd.mm.yyyy; verify per browser), fix the E-14 stop-button race, re-run chat-controls (Chromium ×2, Firefox) and form.spec. **Until then E-18 fails** (it still types mm/dd/yyyy). Delete the untracked probe `app/tests/e2e/zz-probe.spec.ts` (diagnostic, not committed).
2. **P2-10** ([brief](handoff-briefs/P2-10.md)): fix the C-07 (c) fixture, full contract run, reliability run for C-04/C-07/C-08.
3. **P5-01** ([brief](handoff-briefs/P5-01.md)), **P5-02** ([brief](handoff-briefs/P5-02.md)), **P5-03** ([brief](handoff-briefs/P5-03.md); fill its Evidence section from P5-01/P5-02), **P5-04** final report.
4. Cleanup candidates for P5: unused vendored components (`components/ui/accordion.tsx` is untracked and unused; `components/ai-elements/prompt-input.tsx` and its `command`/`hover-card`/`dropdown-menu` may be unused — P5-01 lists unused vendored files); update `app/AGENTS.md` "planned" notes; minor layout note: on 1440 px the chat input bar is wider than the conversation column.

## Decisions taken during execution (record in ADRs where noted)
- **D-AI9 (ADR-002, committed):** no `temperature` in AI calls — the configured reasoning model does not support it and `provider.require_parameters` made OpenRouter reject every endpoint (404). Decision-agent token limits raised to 4000/2500.
- **Chat input without AI Elements `PromptInput`** (P4-04): `PromptInput` always renders a hidden `input[type=file]`, conflicting with AC-44; a native form + shadcn Textarea/Button is used. Record in ADR-004 D-FE1 during P5.
- **Build type-check excludes tests** (`app/tsconfig.build.json`, FIX-02): `next build` checks app code only; `npm run typecheck` still checks tests.
- **Passive upload observer in E-21** (FIX-08): Chromium hides multipart file bodies from `postDataBuffer()`; a test-side pass-through `fetch` wrapper reads the photo without altering the request (no `page.route`, no mocks).
- **E2E locale pl-PL** (FIX-10): tests must behave like Polish users; specs adapt to the Polish date-field order.

## Defects found and fixed
FIX-01 empty `PORT` from root `.env` broke Playwright servers · FIX-02 Turbopack tracing warnings + build tsconfig · FIX-03 jsdom test timeout under load · FIX-04 chat container limited to 768 px · FIX-05 complaint-reason error missing when other fields invalid (Zod `when`) · FIX-06 **real-browser submit failed: `fetch` called with wrong `this` ("Illegal invocation")** · FIX-07 manual `npm run start` did not load root `.env` (`loadEnvConfig` cache → `forceReload`) · FIX-08 E-21 spec (JPEG parser, Chromium multipart body) · FIX-09 failure-server start order, `finishReason`/reasoning-token logging, root cause of P4-07 flakiness = two concurrent Playwright runs.

## Rules learned (apply to all further agent work)
- Only ONE Playwright process at a time in `app/` (shared `test-results/`); copy artifacts to `app/qa-artifacts/<task>/` (gitignored, kept for review) after each run.
- A clean `npm ci` while other agents run tests breaks them — treat it as a DEPS-lock operation.
- Never commit the repository-root `secrets` file (untracked, not gitignored — add it to `.gitignore` or move it).
- Untracked leftovers to ignore or delete: `qa-artifacts/` at the repository root (logs from FIX-07), empty `app/tests/AGENTS.md`, `app/tests/e2e/AGENTS.md`.
- Context7 was unavailable (monthly quota exceeded); APIs were verified against `node_modules` typings.
