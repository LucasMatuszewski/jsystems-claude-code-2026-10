# Brief FIX-10 — E-14 stop-button race and locale-dependent date entry (E-18)

## 1. Task
ID FIX-10, role qa-engineer (Sonnet). Two spec defects diagnosed in FIX-09 (`app/qa-artifacts/FIX-09/diagnosis.md`):
1. **E-14** (`tests/e2e/chat-controls.spec.ts` ~57–83): after sending a follow-up the spec waits for the assistant-message count to increase, then expects the "Zatrzymaj" button — but the follow-up reply is short and has already finished streaming, so the button is gone (race). Fix the spec so it verifies AC-41 deterministically WITHOUT mocks: assert "Zatrzymaj" visible immediately after pressing Enter (the button switches as soon as `status` becomes `submitted`, before any content), click it while busy, then assert: the button returns to "Wyślij", the textarea stayed editable during the request, and any partial assistant text present at stop time remains (if no assistant text had arrived, assert no error marker and that the user message is still shown). To make a streaming window likely for the "partial text stays" check, ask a question that needs a longer answer (e.g. "Wyjaśnij krok po kroku, jak wygląda cała procedura zwrotu i jakie dokumenty muszę przygotować."), and treat the partial-text assertion as conditional on text having arrived (log which branch ran).
2. **E-18 date entry:** the spec types the purchase date with keyboard digits in US order (mm/dd/yyyy). FIX-09 made it pass by forcing the browsers to `en_US` (`launchOptions.env` LANG/LC_ALL + `locale: "en-US"` in `playwright.config.ts`). Orchestrator decision: this is a Polish application; E2E must run like Polish users. Revert the en_US forcing and instead pin the browsers explicitly to Polish (`locale: "pl-PL"`, `timezoneId: "Europe/Warsaw"`, and `launchOptions.env` `LANG=pl_PL.UTF-8`, `LC_ALL=pl_PL.UTF-8`, `LANGUAGE=pl` so results do not depend on the host), and change the E-18 keyboard date entry to the Polish field order (dd.mm.yyyy). Verify in each browser which order the native date field uses under pl-PL before writing the keystrokes (inspect with a quick headed/trace run or `page.evaluate` of the input's placeholder/segments); if Firefox and Chromium differ, branch on `browserName`.

## 2. Git rules
Work on the current branch `feature/hardware-service-decision-copilot`. Check it first with `git branch --show-current`, and stop if it differs. Do not create branches or worktrees, do not push. Commit only your files with `git commit -m "<msg>" -- <paths>` after `git add <paths>`. Never use `git add -A`, `git add .`, `git stash`, `git reset`, `git checkout -- .`, `git restore` on files you do not own, or `git rebase`. Never read or edit `.env`. Never stage the repo-root `secrets` file, `app/components/ui/accordion.tsx`, or the empty `app/tests/AGENTS.md` / `app/tests/e2e/AGENTS.md`.

## 3. Files
Own: `app/playwright.config.ts` (locale/env lines only), `app/tests/e2e/chat-controls.spec.ts`, `app/tests/e2e/pages/*.ts` (only if a helper must change). App code read-only.

## 4. Context
- RULE (new, from FIX-09): never run two Playwright processes at the same time in `app/` — they share `test-results/` and corrupt each other's artifacts. Run your commands strictly one after another.
- No `page.route`, no mocks. Assertions must not be weakened beyond the conditional described for partial text.

## 5. Steps
a. Check branch; ports free (`ss -ltnp`), else wait (60 s polls, max 30 min).
b. Config locale change; verify date-field order per browser under pl-PL.
c. Fix E-18 keystrokes and E-14 flow.
d. Run, ONE AT A TIME: `npx playwright test --project=chromium tests/e2e/chat-controls.spec.ts --repeat-each=2`, then `npx playwright test --project=firefox tests/e2e/chat-controls.spec.ts`, then `npx playwright test --project=chromium tests/e2e/form.spec.ts` (E-01 also enters dates — must stay green under pl-PL). Logs to `app/qa-artifacts/FIX-10/`.
e. Static check `grep -rnE "page\.route|context\.route|MockLanguageModel" tests/e2e` → nothing; `npx tsc --noEmit`; `npm run lint`.
f. Commit.

## 6. Commands
In `app/`: `npx playwright test …` (sequential only), `npx tsc --noEmit`, `npm run lint`, `ss`. RUNTIME allowed.

## 7. Done when
E-14 and E-18 green in Chromium (2×) and Firefox under pl-PL; E-01 still green; committed.

## 8. Commit
`Tests: Run E2E in Polish locale and fix the stop-button race` with a body explaining both changes, and the final line `Co-Authored-By: Claude <noreply@anthropic.com>`.

## 9. Report format
Date field order per browser under pl-PL; files changed; run results per command (passed/failed); which E-14 branch ran (partial text present or not); static check; checks; commit hash. No prose beyond this.
