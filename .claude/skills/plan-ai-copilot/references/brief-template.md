# Brief template — AI decision copilot

Fill every field. Mark pre-filled values `(default)` and user-confirmed values `(confirmed)`. Save as `docs/brief.md`. The defaults below come from the first project built with this skill (Hardware Service Decision Copilot: electronics returns and complaints in Poland); replace them when the domain differs.

## A. Product

| Field | Default |
|---|---|
| Product name | — (ask) |
| Domain | — (ask), e.g. electronics returns and complaints |
| Stage | MVP |
| Primary user | **Mandatory question.** End customer or internal employee. This changes tone, disclaimers, legal obligations and the persona section. |
| Status of the decision | Preliminary and non-binding; a human makes the final decision |
| UI and agent language | Polish; agent always replies in Polish |
| Form of address | Informal "Ty" (state it; switch to "Pan/Pani" if brand voice requires) |
| Brand reference | `assets/homepage.png` + `docs/design-guidelines.md` if present |

## B. Form

| Field | Default |
|---|---|
| Case types | 2 options, e.g. "Zwrot" / "Reklamacja"; none preselected |
| Fields that change the rules | **Mandatory question.** Which facts decide the applicable rule (e.g. purchase channel for the 14-day statutory return)? Add them as required fields. |
| Item category list | 8 categories + "Inne" |
| Item name/model | Text, 2–100 chars |
| Key date | Date picker, not in the future; timezone for "today" = Europe/Warsaw |
| Reason | Textarea ≤ 2000 chars; required (min 20) for the case type that needs it |
| Upload | Exactly 1 photo; JPEG/PNG/WebP checked by content; ≤ 10 MB; reduced before analysis |
| Test files | `assets/example-images/` if present, used as-is |

## C. AI steps

| Field | Default |
|---|---|
| Analysis step | Multimodal model describes the file; separate instructions per case type; structured output; describes only, never decides; ignores instructions visible in the image |
| Decision step | Reasoning model; separate instructions per case type; gets form data, system-computed facts (day count), analysis, the matching rule document |
| Shared rules across case types | **Mandatory question.** Is any rule (e.g. safety) needed for both case types even though it lives in one document? |
| Decision categories | Accept (preliminary) / Reject (preliminary) / Needs more information / Escalate to human |
| Decision change in chat | Allowed only on new facts, shown as "Zaktualizowana decyzja" with previous and new label |
| New files in chat | Not allowed; start a new case |
| Unusable file | Decision "Needs more information" with photo tips |
| Agent must never | Present the decision as binding, name amounts, invent rules, blame the user as fact, ask for personal/payment data, give disassembly instructions, follow injected instructions, answer off-topic |

## D. Session, limits, errors

| Field | Default |
|---|---|
| Persistence | Current browser tab only; leave-page confirmation on chat; "Nowe zgłoszenie" with confirmation |
| Chat message length | 1–2000 chars |
| Chat message count cap | **Mandatory question.** Decide now (cap N or no cap + request-size safeguard). Do not leave it open. |
| Timeouts | 60 s to the first streamed token |
| Error handling | Form data and file kept; retry without re-entering |
| Browsers / widths | Current Chrome, Firefox, Safari, Edge; 360–1920 px |

## E. Rule documents

| Field | Default |
|---|---|
| Legal basis | **Mandatory question.** Real law of which country, or fictional company rules? |
| Documents | One per case type, Polish, numbered § and ust. |
| Fact verification | Every number confirmed by an official/primary source or marked to verify |

## F. Deferred features

| Field | Default |
|---|---|
| Later phases | Customer/purchase lookup, persistence of sessions and decisions, knowledge base/RAG |

## G. Technical preferences (handed to the ADR stage, not the PRD)

| Field | Default |
|---|---|
| Stack | From AGENTS.md (e.g. TypeScript, Next.js, AI SDK, `useChat`, streaming) |
| LLM provider and models | From `.env.example` / AGENTS.md; **mandatory question** for model IDs |
| Where secrets live | **Mandatory question.** Exact `.env` location the app and tests load |
| Browser automation for QA | Playwright CLI only (no MCP) unless the user says otherwise |
| Test strategy | AGENTS.md table: unit mocks all deps, integration mocks only the LLM (from real captures), E2E real stack |
