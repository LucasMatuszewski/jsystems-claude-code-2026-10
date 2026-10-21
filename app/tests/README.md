# Tests — layers and acceptance-criteria traceability

This folder holds the integration, contract, E2E, capture and fixture material. Unit tests sit next to their source files (`lib/**/*.test.ts(x)`, `components/**/*.test.tsx`).

Test IDs (E-xx, C-xx, TAC-xx) and manual QA steps (M-x) follow the QA plan in ADR-005. Acceptance criteria (AC-01…AC-54) come from `docs/PRD.md` §6.

## Test layers

| Layer | Location | Mocks | Command |
|---|---|---|---|
| Unit | colocated `*.test.ts(x)` next to source | all dependencies; fixtures derived from captures | `npm test` |
| Integration | `tests/integration/` | only the language model (`MockLanguageModelV4` replaying captures); fetch guard blocks `openrouter.ai` | `npm test` |
| Contract | `tests/contract/` | none — production build + real OpenRouter | `npm run test:contract` |
| E2E | `tests/e2e/` | none — real browsers, real OpenRouter; Firefox/WebKit run only `@smoke` | `npm run test:e2e` |
| Captures | `tests/fixtures/captures/<date>/` | verbatim real responses + `meta.json` | `npm run capture` |
| Manual QA | — | none — Playwright CLI against `npm run build && npm run start` | — |

## Running

Run these commands in `app/`:

- `npm test` — unit and integration tests
- `npm run test:contract` — contract tests against the production build and real OpenRouter
- `npm run test:e2e` — E2E tests in real browsers
- `npm run capture` — refresh verbatim real-response captures
- `npm run build && npm run start` — production build and app on port 3000 (manual QA)

## Photo rule

Test photos come only from `../assets/example-images/`. No generated images are used. The HEIC upload case (AC-11) and the over-10 MB upload case (AC-12) in E-02 are `test.fixme` until real files are provided; unit tests cover that logic.

## Traceability

Status is `planned` for every row. `M-1` (startup) and `M-6` (clean console) apply to every manual QA run and are not repeated per row. `M-2` refers to the hand walk-through of flows 4.1–4.7 in the PRD. `TAC-03` and `TAC-004-01` are static checks. Test IDs E-12 (off-topic and injection), C-01 (model capabilities) and C-03 (analyze rejects) do not map to a single AC, so they are not listed in the table.

| AC | Requirement (short, English) | Automated tests | Manual QA | Status |
|---|---|---|---|---|
| AC-01 | Form contains the seven fields in the fixed order | E-01; `components/case-form/*.test.tsx` | M-2 | planned |
| AC-02 | Case type: required single choice "Zwrot" / "Reklamacja", none preselected | E-01; `lib/case/schemas.test.ts`; `components/case-form/*.test.tsx` | — | planned |
| AC-03 | Purchase channel: required single choice, two options, none preselected | E-01; `lib/case/schemas.test.ts`; `components/case-form/*.test.tsx` | — | planned |
| AC-04 | Equipment category: required single choice with the nine listed options | E-01; `lib/case/schemas.test.ts`; `components/case-form/*.test.tsx` | — | planned |
| AC-05 | Model name required, trimmed, 2–100 characters, with error text | E-01; `lib/case/schemas.test.ts`; `lib/case/texts.test.ts` | — | planned |
| AC-06 | Purchase date via date picker; no future dates, with error text | E-01; `lib/case/schemas.test.ts`; `lib/case/days.test.ts`; `lib/case/texts.test.ts` | — | planned |
| AC-07 | Reason required for "Reklamacja", 20–2000 characters; required marker only then | E-01; `lib/case/schemas.test.ts`; `lib/case/texts.test.ts` | — | planned |
| AC-08 | Reason optional for "Zwrot", maximum 2000 characters | E-01; `lib/case/schemas.test.ts` | — | planned |
| AC-09 | Live counter "N / 2000"; no input beyond 2000 characters | E-01; `components/case-form/*.test.tsx` | — | planned |
| AC-10 | Exactly one photo; JPEG, PNG, WebP verified by file content | E-02; C-02; `lib/image/sniff.test.ts` | — | planned |
| AC-11 | Other formats (including HEIC) rejected before submission with message | E-02 (`test.fixme` until real HEIC file); `lib/image/sniff.test.ts`; `lib/case/texts.test.ts` | — | planned |
| AC-12 | Files over 10 MB rejected before submission with message | E-02 (`test.fixme` until real large file); `lib/image/sniff.test.ts`; `lib/case/texts.test.ts` | — | planned |
| AC-13 | Thumbnail, file name and "Usuń" shown; new file replaces the old one | E-02; `components/case-form/*.test.tsx` | M-2 | planned |
| AC-14 | Photo hint depends on case type (Zwrot / Reklamacja text) | E-02; `lib/case/texts.test.ts`; `components/case-form/*.test.tsx` | — | planned |
| AC-15 | Invalid submit sends nothing, shows inline errors, moves focus to first invalid field | E-01; `components/case-form/*.test.tsx` | — | planned |
| AC-16 | AI-use notice shown on the form | E-01; `lib/case/texts.test.ts`; `components/case-form/*.test.tsx` | M-2 | planned |
| AC-17 | All form controls and submit button disabled until processing ends or fails | E-03; `components/case-form/*.test.tsx` | — | planned |
| AC-18 | Two sequential step labels during processing | E-03; `components/case-form/*.test.tsx` | M-2 | planned |
| AC-19 | Photo reduced to longer edge ≤ 1568 px and file ≤ 1 MB, aspect ratio kept | E-21; `lib/image/reduce.test.ts` | — | planned |
| AC-20 | Distinct image-analysis instructions for "Zwrot" and "Reklamacja" | E-03; C-02; `lib/ai/prompts/image-analyst.test.ts`; `lib/ai/prompts/decision-agent.test.ts` | — | planned |
| AC-21 | Decision agent input: all fields, channel, day count, image description, matching policy; §7 of Complaint Policy only for "Zwrot" | E-03; `lib/ai/prompts/decision-agent.test.ts` | — | planned |
| AC-22 | Analysis or decision error, or no first token within 60 s: back to form with data kept and retry button | E-22; `lib/session/*.test.ts`; `lib/case/texts.test.ts` | — | planned |
| AC-23 | AI service credentials never sent to the browser | E-19; TAC-03 static check (grep `.next/static`) | M-3 | planned |
| AC-24 | First chat message order: greeting, decision block, "Uzasadnienie", "Co dalej", disclaimer | E-03; C-04; `components/chat/*.test.tsx` | M-2 | planned |
| AC-25 | Decision block contains exactly one of the four labels | E-03; C-04; `components/chat/*.test.tsx`; `lib/case/texts.test.ts` | — | planned |
| AC-26 | Four visually distinct decision styles with icon or text marker | E-03; `components/chat/*.test.tsx` | M-2 | planned |
| AC-27 | "Uzasadnienie" cites a policy section number and a photo observation | E-03; `components/chat/*.test.tsx` | M-2 | planned |
| AC-28 | Disclaimer text is verbatim | E-03; `components/chat/*.test.tsx`; `lib/case/texts.test.ts` | — | planned |
| AC-29 | Return, online, 0–14 days: no rejection for use signs or missing packaging | C-07 | — | planned |
| AC-30 | Return, over 30 days: rejection and complaint path as alternative | E-04 | — | planned |
| AC-31 | Voluntary return with visible use: rejection citing §3 ust. 3 | C-07 | — | planned |
| AC-32 | Complaint over 730 days: rejection, §2 ust. 3, manufacturer warranty | E-05 | — | planned |
| AC-33 | Complaint with §4 damage traces: rejection or verification, never stated as fact | E-08; C-07 | — | planned |
| AC-34 | Complaint with §5 defect and no §4 traces: acceptance, repair or replacement first | E-08 (structure); C-07 | — | planned |
| AC-35 | Unreadable photo, no electronics, or category mismatch: additional info, new case | E-06; C-07 | — | planned |
| AC-36 | Safety instruction (§7) before "Co dalej" for hazards, both case types | E-07; `lib/ai/prompts/decision-agent.test.ts` | — | planned |
| AC-37 | First message is streamed | E-03; C-04 | — | planned |
| AC-38 | Chat shows case summary and current decision label | E-03; `components/chat/*.test.tsx` | M-2 | planned |
| AC-39 | Photo thumbnail opens overlay; closes with Esc, close button or outside click | E-17 | — | planned |
| AC-40 | Input 1–2000 characters after trim; Enter sends, Shift+Enter new line | E-14; `components/chat/*.test.tsx` | — | planned |
| AC-41 | While streaming: input editable, send disabled, stop keeps partial reply | E-14; `components/chat/*.test.tsx` | — | planned |
| AC-42 | Every reply uses full context including all previous messages | E-11; C-05 | M-3 | planned |
| AC-43 | Decision change shows "Zaktualizowana decyzja" block and updates summary label | E-11; C-05; C-08; `components/chat/*.test.tsx` | — | planned |
| AC-44 | No photo attachment in chat; agent asks for a new case when a photo is needed | E-14; C-06; `components/chat/*.test.tsx` | — | planned |
| AC-45 | Failed or timed-out follow-up marked "Nie wysłano" with "Ponów"; no duplicate | `lib/session/*.test.ts` | M-4 | planned |
| AC-46 | Assistant messages render formatting; user messages plain text | E-14; `components/chat/*.test.tsx` | — | planned |
| AC-47 | Message list auto-scrolls while streaming unless customer scrolled up | E-14; `components/chat/*.test.tsx` | — | planned |
| AC-48 | Session data not persisted after tab close or refresh | E-20; `lib/session/*.test.ts`; TAC-004-01 static check (no storage APIs) | — | planned |
| AC-49 | Leave-page confirmation on the chat screen | E-16; `lib/session/*.test.ts` | — | planned |
| AC-50 | "Nowe zgłoszenie" dialog with exact text and buttons; confirm shows empty form | E-15; `components/chat/*.test.tsx`; `lib/case/texts.test.ts` | — | planned |
| AC-51 | All UI text in Polish; agent replies in Polish for other input languages | E-13; `lib/ai/prompts/decision-agent.test.ts` | M-2 | planned |
| AC-52 | Works in Chrome, Firefox, Safari, Edge at 360–1920 px without horizontal scroll | E-18 (`@smoke`, Firefox/WebKit smoke only) | M-5 | planned |
| AC-53 | All controls keyboard-operable with visible focus and accessible labels | E-18 (`@smoke`) | M-7 | planned |
| AC-54 | AI-use notice on the form and disclaimer in the first message | E-01; E-03 | M-2 | planned |
