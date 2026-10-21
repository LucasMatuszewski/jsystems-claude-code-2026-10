# Repository Guidelines

## Project

This is a **course project** for the "Claude Code - od zera do zespołu agentów AI" training organized by JSystems, 3 days (19-21 October 2026), remote on cloud VMs. The primary taught tool is Claude Code CLI on prepared Ubuntu Linux VMs (8 GB RAM, 4 cores). Claude Desktop and Claude Code on the web are covered modes; Codex and GitHub Copilot are comparisons. The course project is AI Chat: TypeScript, Vercel AI SDK, streamed replies and React useChat. Participants agree detailed requirements live in docs/PRD.md and technical choices in docs/ADR/. Greenfield work starts from the empty scaffold and defines the product live; legacy work uses a separate clone of the original application. Its domain, stack and architecture come from the real task and inspected sources, not historical course examples: research → application or feature PRD → ADR → implementation with agents.

This is the **unsolved starting repository** for the course; implementation and detailed decisions are made live with the group. The course hub is https://devpowers.com/szkolenia/jsystems/claude-code-2026-10/. The agreement in AGENDA.md has 12 numbered modules and two homework blocks. The be-developer, fe-developer and qa-engineer examples under course-materials/agent-configs/claude/ are inert; participants define their own agents in module 2.3.

Chat in Polish unless the user asks for another language. Repository documentation uses English unless another project language is agreed. The trainer chooses the teaching language separately. This is a greenfield scaffold, not an agreed product specification. For a legacy-led course, keep materials separate and work in the original application clone; adapt these instructions to its actual stack and verification commands.

**Key docs** (created during the course — load only when in doubt):
- `docs/PRD.md` — product requirements and acceptance criteria
- `docs/ADR/` — Architecture Decision Records
- `docs/design-guidelines.md` — design system and tokens

---

## Repository Layout

```
app/                 Application built during the course (start: empty scaffold)
assets/              Design tokens, logo, favicon
docs/                PRD, ADR, design system
course-materials/    Notes, scripts, examples, research
```

**Do not read `course-materials/` on your own.** It holds teaching examples from this and earlier courses: sample PRDs, ADRs, prompts and agent instructions. They are not requirements or conventions for this app. Do not browse, search or index it during normal work; open a file there only when the user names it or asks for course material.

---

## Agent Workflow

### When implementing new or refactoring functionality
1. Read the relevant PRD and ADR files for the affected area.
2. Define the expected behavior from the specification before writing or changing any code.
3. Confirm the actual application checkout and inspect source, build descriptors, call sites and dependencies before proposing commands or APIs. Identify build, test and startup commands from that project, using its wrapper when available; do not assume a framework, build tool or runtime version.
4. Establish missing or ambiguous requirements with the user and record agreed application scope in its PRD before implementation. Routine course-document changes do not need an application PRD or ADR.

### TDD Rules
For every feature and bug fix:
1. Start from the specification, not the existing implementation.
2. Write or extend tests **before** production code.
3. Run the new tests and confirm they fail for the expected reason.
4. Implement the minimum code needed to make them pass.
5. Run the full verification suite for the changed scope.
6. Refactor only while tests stay green.
7. **Manually validate the running application** (see Manual QA below). Automated tests — especially E2E — can produce false passes; a task is not done until the real app has been exercised by hand.

If the area has no suitable test infrastructure yet, add it as part of the task — do not silently skip tests.

Before creating or refreshing a unit/integration mock of an endpoint or database, make a fresh real request/query in an authorized local/test environment using synthetic data. Save the complete response verbatim (HTTP status, headers and body, or database result rows and type/schema information) and derive the mock from that capture, not from documentation that may be stale. Use a response containing no secrets; record its date, target, request/query and relevant service version without credentials. If a safe capture cannot be obtained, report the missing prerequisite instead of inventing a response shape.

For behavior-preserving legacy refactoring, write characterization tests against the original code and get them green before changing it. Assert observable inputs, outputs, state changes and errors rather than private methods or the current class layout. Demonstrate that critical assertions detect a controlled behavioral mutation, then revert that mutation. Existing tests may protect a pure refactor; a new behavior or bug fix still requires Red -> Green -> Refactor.

Investigate production code and fixtures before changing a failing assertion. Do not weaken, disable or delete tests to conceal a defect. Change expected behavior only when the specification supports it, and explain why.

### Manual QA (required after every task that affects the running app)

Use the application's actual runtime and verified commands. The browser flow below applies to web applications; desktop applications need their real UI, and command-line tools need observable CLI checks.

Use **the Playwright CLI** to drive the real running app like a human tester:

1. Start the app with its verified project command and open it in the browser. Record successful startup separately from compilation and test execution.
2. Take a screenshot of every screen you touched.
3. Exercise the real flow end-to-end by hand: fill the form, upload the image, submit, follow the navigation to the chat, send a message — whatever the changed scope covers.
4. Verify the flow actually works: correct navigation, correct data displayed, no console errors, Polish UI text.
5. **Compare your screenshots against the brand reference** (`assets/homepage.png` + `docs/design-guidelines.md` tokens): colors, typography, spacing, button styles and logo placement must match the application's agreed brand reference.
6. Report what you validated (steps + screenshots) in your task summary. If anything looks or behaves wrong, fix it before committing.

### Verification (required before every commit)

Verify only the scope relevant to your change. If the change affects runtime behavior, confirm the app starts correctly.

**Test Strategy:**
| Type | Mocks | Who |
|---|---|---|
| Unit | All deps | be/fe-dev |
| Integration | Only external LLM API | be-dev |
| E2E | NOTHING (real stack) | qa-engineer |

**Verification:** For runtime changes, start the real application and finish with Manual QA. Record compilation/build, test execution and startup as separate checks, including discovery counts and skips. A successful build or E2E run alone does not establish that the app works. Documentation-only changes use diff, link and consistency checks and do not require application startup. Fix errors and warnings introduced by the change; report pre-existing failures without hiding them.

**Env Vars:** See `.env.example`. Configure only the provider chosen in the ADR (OpenRouter or Anthropic); credentials remain server-side. The CLI subscription and application API credentials are separate.

### Commit Rules
- **Commit proactively — do not wait to be asked.** This file is the user's standing instruction: commit every completed logical unit of work as soon as its scoped verification passes and the changed scope is in a working state (e.g. PRD, policy documents, ADRs, design system, review fixes, a feature slice, a bug fix, a config change). This applies equally to work produced through skills such as `write-prd`, `write-adr` or `create-design-system`.
- **Start clean.** Before changing files, run `git status`. Commit pre-existing uncommitted work first in logical groups (ask only if its origin is unclear), so your own changes stay a separate, reviewable diff.
- **Never commit on `main`.** If the current branch is `main`, create a branch before the first commit, named `<type>/<short-kebab-description>` (`feature/`, `fix/`, `docs/`, `chore/`). If you are already on a non-`main` branch for the same work, keep committing there; ask before starting a new branch for unrelated work.
- Keep commits focused: one logical change per commit; split larger work into several commits (e.g. one per review theme).
- Format: `Area: short summary` (e.g. `Backend:`, `Frontend:`, `Docs:`, `Design:`), with a body explaining what changed and why.
- Documentation-only commits need only the diff, link and consistency checks from Verification.
- Never commit secrets, `.env*` files or `.claude/worktrees/`.
- List the created commit hashes and the branch in your final summary.
- Do **not** push to remote unless the user explicitly asks.

### Git Worktrees
- Avoid worktrees by default; work in this checkout. Create a worktree only when the user explicitly asks for one, or when parallel agent work makes it unavoidable — and in that case ask first.
- Remove worktrees with `git worktree remove <path>` and run `git worktree prune` when done.

### Completion Criteria
A task is complete only when:
- Implementation matches the relevant PRD, ADR, and design guidance
- Tests were written first and pass honestly
- Verification for the changed scope passed with no errors or warnings
- Runtime changes passed Manual QA on the actual UI, CLI or API, with screenshots or command/request evidence and the application's own visual reference where applicable; documentation-only work passed its scoped checks
- The commit message is focused and the repository is in a consistent, reviewable state
- The work is committed on a non-`main` branch and the commit hashes are reported
