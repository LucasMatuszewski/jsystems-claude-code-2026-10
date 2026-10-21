# FIX-09 diagnosis

Data: repro-1.log / repro-2.log (chromium, chat-decisions + chat-controls, --repeat-each=2, server ai_call lines piped). Server side in both runs: 100% outcome "ok", 0 finishReason "length", 0 ENOENT.

1. webServer order: fixed (3200 waits for :3000). No "Could not find a production build" in either run.
2. Submission failures: P4-07 failures are not reproducible as a latency/502 problem. All /api/analyze and /api/chat calls ok; analyze totalMs max 20.6 s, chat totalMs max 18.0 s, whole E-06..E-08 tests max 28 s, all << 60 s. Two spec-side deterministic causes found:
   - E-18 (both viewports): purchase date typed as mmddyyyy; Chromium date field order follows OS locale (pl_PL), so 2026-10-12 became 2026-12-10 (future, field invalid, submit blocked, "Analizujemy zdjecie..." never shown). Confirmed with LANG/LC_ALL=en_US.UTF-8: both pass. Fixed in playwright.config.ts (launchOptions.env).
   - E-14: trace shows the assistant message appears only when the first text arrives (follow-up reply is ~1 sentence, 4 s of reasoning before any text); by the time `toHaveCount(assistantBefore+1)` passes (34.4 s -> 38.9 s) the stream is done, so `expect(stopButton).toBeVisible()` can never succeed. Spec race (read-only), not an app defect.
   - E-07 return/E-16/E-12/E-03 failures in P4-07 happened while a second Playwright invocation (smoke) ran concurrently (see item 4) on the same server/test-results; not reproduced in 2 x 22 tests afterwards.
3. Truncated reply: not reproduced (0 of 34 chat/analyze calls with finishReason length; reasoning tokens 74-634 of output 96-1055, far below the 4000 cap). Cannot be proven from P4-07 (no server logs then). Likely a torn run caused by the concurrent invocation. finishReason/reasoningTokens are now logged to catch it if it recurs.
4. ENOENT on traces: 12 in P4-07/chromium.log, 0 in repro-1/2. P4-07 chromium run ended 16:30 and smoke.log ended 16:35 after a ~8 min run, i.e. the two Playwright processes overlapped; each run clears the shared test-results/ at start. Cause = concurrent invocations (process, not config). Fix: never run two Playwright invocations in the same app/ at once (or give each its own --output).
