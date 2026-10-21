# Review checklists

Each item comes from a defect that had to be fixed after the first planning run of this pattern. Run the checklist as a separate pass after writing, not while writing.

## PRD checklist

- [ ] **One persona source of truth.** The primary user in §1, §3, §11 and in any test-file README agrees. Conflicts with the brief are recorded in §12 as decisions.
- [ ] **No internal contradictions.** The UI description (§9) repeats the order and texts of the ACs exactly (e.g. message order greeting → decision card → justification → next steps → disclaimer). Prefer "per AC-xx" over restating.
- [ ] **Inputs match rules.** Every rule the agent must apply is present in what the agent receives (AC "agent receives…"). Check each rule that applies to more than one case type, especially safety rules.
- [ ] **Assumptions do not contradict rules.** E.g. "agent never recalculates dates" vs "agent treats a date stated in chat as new information" — define exactly what happens (here: escalate to a human).
- [ ] **Dates and time.** "Today" has a timezone; day counts state inclusive/exclusive and the reference event.
- [ ] **No open product questions that block the ADR.** Limits (chat message cap, file size, timeouts) are decided, not left open. Only legal wording and business content may stay open.
- [ ] **Unverified facts are marked** in §8 and §12, not presented as constraints.
- [ ] **Measurable ACs only.** Each has a concrete input and an observable output (text, state, number).
- [ ] **Technical numbers kept minimal.** Values like image pixel limits or credential handling are allowed only as observable constraints; libraries, endpoints and parameters go to the ADR.
- [ ] **Tone defined once and consistently** (form of address, length, no emoji) and matching the UI copy in the ACs.
- [ ] **Test material named.** If test files exist, §8 references them and their rules.
- [ ] **Out of scope** includes formal submission, authentication, persistence, notifications and the deferred features.

## ADR checklist

- [ ] **Every AC is traceable** to an ADR decision, contract or test ID; list ACs not covered.
- [ ] **Model capabilities verified** with a real call or provider metadata: supported parameters (reasoning models often reject `temperature`), structured output, image input formats, token limits including reasoning tokens.
- [ ] **Configuration location decided with the user**: which `.env` file the app, dev server and test runners load, and how (verify it works for manual `npm run start`, not only under the test runner).
- [ ] **Streaming semantics defined**: what counts as the "first token" (exclude reasoning and step-start parts), which side owns the timeout, how the client recovers if the first turn fails after the screen switch.
- [ ] **File handling**: detect the real type from content (extensions lie), pass the detected media type to the model, keep the original for display and the reduced copy for analysis.
- [ ] **Request-size and abuse safeguards** replace any product cap the PRD chose not to have.
- [ ] **Testing uses real material**: test files from `assets/`, captures of real provider responses for integration mocks, real-stack E2E with the production build; no generated images. Decision logic that depends on the photo is tested with hand-written analyses.
- [ ] **Tool and command names match AGENTS.md** (e.g. Playwright CLI vs MCP, `npm` scripts). Do not frame real-stack tests as costly; agents then skip them.
- [ ] **Browser-only pitfalls listed** for the frontend agent: unbound `fetch` passed as a method (Illegal invocation), jsdom timeouts on slow VMs.
- [ ] **ADR-000 summaries match ADR-001..N** (error codes, env list, component list, section references).
- [ ] **Proposed PRD changes** are listed for the user instead of silently diverging.

## Plan checklist

- [ ] Task IDs with dependencies, owner role, files owned and files forbidden per task.
- [ ] Each task brief is self-contained: copied ACs and Polish texts, schema fields, commands; never "see the ADR".
- [ ] TDD steps per task: tests first, red run with expected reason, implementation, green run, final checks.
- [ ] Locks for shared resources: dependency files (one task at a time), the runtime port, the git index; commits with explicit paths only.
- [ ] A vertical slice through the real AI call early, so model/provider problems surface before UI work.
- [ ] Manual QA task with screenshots against the brand reference at the end of each user-visible slice.
- [ ] Stop conditions that require the user (missing secrets, provider errors, contradictory specs).
