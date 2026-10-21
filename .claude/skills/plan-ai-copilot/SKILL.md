---
name: plan-ai-copilot
description: Plan an AI "form → image/document analysis → policy-based decision → chat" application end to end - brief intake, PRD, rule documents, ADRs and an implementation plan for subagents - with review gates between stages. Use when the user wants to plan a new decision copilot (returns, complaints, claims, warranty, insurance, eligibility checks) or a similar form-plus-chat AI product without writing the whole brief again.
---

# Plan an AI decision copilot

This skill turns a short request ("zaplanuj copilota do X") into a complete, internally consistent planning package. It wraps the `write-prd` and `write-adr` skills and adds the steps that were missing the first time this was done: a structured brief, rule documents with verified facts, a cross-document consistency review, and an implementation plan for subagents.

The product pattern it covers:

1. A form with a case type selector, item data, a date, a free-text reason and one uploaded file (usually a photo).
2. A multimodal model describes the file with instructions that depend on the case type. It describes, it does not decide.
3. A reasoning model makes a decision from the form, the description, system-computed facts (e.g. days since purchase) and a rule document chosen by case type.
4. The decision is the first message of a streamed chat. The user continues the conversation with full context.

If the request does not fit this pattern, say so and use `write-prd` / `write-adr` directly.

## Stages and gates

Run the stages in order. **Stop at every gate** and wait for the user. Never start the next stage unprompted.

| # | Stage | Output | Gate |
|---|---|---|---|
| 0 | Repo check | Notes only | — |
| 1 | Brief intake | `docs/brief.md` | User confirms the brief |
| 2 | PRD | `docs/PRD.md` | Consistency review passed, committed |
| 3 | Rule documents | `docs/policies/*.md` | Facts verified, committed |
| 4 | ADR | `docs/ADR/*.md` | Cross-review with PRD passed, committed |
| 5 | Implementation plan | `docs/plans/<name>.md`, agent definitions | User approves before any code |

Stages 2 and 3 may be done in one run, but they are separate commits.

### Stage 0 — Repo check

- Run `git status` and `git branch --show-current`. Follow the repository's commit rules (AGENTS.md / CLAUDE.md): commit or ask about pre-existing changes, never commit on `main`, create `docs/<short-name>` if needed. Never stage unknown files such as `secrets`, `.env*` or QA output; always commit with explicit paths.
- Check what exists: `docs/PRD.md`, `docs/ADR/`, `docs/policies/`, `assets/` (brand reference, **test files such as `assets/example-images/`**), `.env.example`, `app/`.
- Read any README next to test files. Its rules (e.g. "do not tell the model what is on the photo") and its wording (who uploads the file) are requirements. Flag every conflict with the brief.

### Stage 1 — Brief intake

Goal: the user should not need to type a long prompt. Fill in [`references/brief-template.md`](references/brief-template.md):

1. Take everything the user already said. Pre-fill the remaining fields with the defaults from the template and mark them `(default)`.
2. Ask only about fields where no default fits or the default is risky. Use AskUserQuestion, 4 questions per call, recommended option first. Always ask the **mandatory questions** listed in the template, even if the user's text seems to answer them, when the answer would contradict something found in Stage 0.
3. When the user's answer contradicts their own brief (e.g. brief says "for employees", answer says "end customer"), say so explicitly and ask which one wins before continuing.
4. Save the result as `docs/brief.md` (English) and show a short summary. Gate: the user confirms or corrects it.

### Stage 2 — PRD

Invoke the `write-prd` skill with `docs/brief.md` as the input. The clarifying-question step is already satisfied by Stage 1 unless something is still open; ask at least the remaining open questions.

In addition to `write-prd`, the PRD must satisfy every item in the **PRD checklist** in [`references/review-checklist.md`](references/review-checklist.md). Run that checklist as a separate pass after writing, fix what fails, then run the doc checks (see "Verification of documents" below) and commit (`Docs: Add PRD for <product>`).

### Stage 3 — Rule documents

Write the rule documents (policies, procedures, terms) the decision agent will receive, following [`references/rule-documents.md`](references/rule-documents.md). Verify every number and legal claim against an official or primary source before it is written. Anything not confirmed by such a source is marked `[DO WERYFIKACJI]` / `[TO VERIFY]` in the document and listed in PRD §12. Commit separately (`Docs: Add sample <domain> policies`).

### Stage 4 — ADR

Invoke the `write-adr` skill. In addition to it, cover every item in the **ADR checklist** in `references/review-checklist.md`. Before writing decisions that fix model parameters, make one real call (or read the provider's model metadata) with the chosen model to confirm which parameters it supports.

After writing, run the **cross-review**: read the PRD and all ADRs together and check every AC against the ADRs and every ADR decision against the PRD. When the ADR needs a product change, do not silently diverge: list the proposed PRD amendments, ask the user, then update the PRD and the ADRs in separate commits (`Docs: Update PRD with decisions from the ADR review`, `Docs: Align ADRs with PRD review decisions`).

### Stage 5 — Implementation plan

Only when the user asks. Write `docs/plans/<name>-implementation-plan.md` following the **Plan checklist** in `references/review-checklist.md`. If the project has no role agents yet, propose `be-developer`, `fe-developer` and `qa-engineer` definitions in `.claude/agents/` and ask before creating them. Do not start implementation in the same run.

## Verification of documents

Documentation-only changes need no app startup. Before every commit:

- `git diff --stat` and a read of the diff.
- Every relative link and file path named in the docs exists (`ls` each).
- AC/TAC/D-xx identifiers are unique and every cross-reference points to an existing ID.
- Polish UI strings are identical everywhere they appear (PRD ACs, UI description, agent spec, ADR).
- Mermaid blocks use valid syntax (one node per line where branches merge if unsure).

## Final report

After each stage, report in the chat language: files created/changed, decisions made, assumptions, open questions, unverified facts, commit hashes and branch. End with the next stage's question, e.g. "Czy przejść do ADR?".
