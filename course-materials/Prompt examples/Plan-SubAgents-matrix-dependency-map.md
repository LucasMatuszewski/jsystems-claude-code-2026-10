# Implementation plan from the current PRD and ADRs

Create a reviewable implementation plan for one demonstrable vertical slice of our application. Do not implement it or launch agents yet. Follow the applicable AGENTS.md and use the approved PRD, ADRs and design guidance in this application's repository. Ask for their paths only when they are missing or ambiguous; teaching examples in course-materials are not project requirements.

Inspect the current code, working-tree status, entry points and tests. Report what actually exists, the commands you verified and any baseline failure. Use the existing application scaffold or approved legacy checkout; do not replace it with a fresh application. Resolve consequential gaps with targeted questions, without a minimum question count. Keep unrelated work intact.

Save the draft in docs/plans/<feature>-implementation-plan.md, unless I named another destination. In a read-only Plan mode, return the complete draft and destination first, then save it when writing is permitted. Mark it as draft awaiting my review. Link exact PRD criteria, ADR sections and design guidance instead of copying their contents. Missing architecture belongs in a proposed ADR, not an invented plan assumption.

Use small verified phases and one authoritative dependency matrix:

For each task, record the selected available model in the dependency matrix. Default to Haiku for bounded Claude Code implementation and tests; the strong orchestrator resolves decisions and checks the result. Prepare each brief immediately before its authorized task, link PRD/ADR sections, and include only the necessary exact context. Do not launch workers before plan approval.

Prefer ad hoc subagents for one-off tasks. Create short custom definitions only for recurring roles or stable tool restrictions.

| Task | Observable outcome | PRD/ADR links | Prerequisites | Owner/model | Editable files | Verification and handoff |
|---|---|---|---|---|---|---|

Give each row a bounded deliverable, acceptance evidence and commit boundary. Plan a failing behavioral test before implementation, integration checks after dependent components, manual runtime verification, an independent review and a pull request for the finished slice. Use the application's actual commands. A green build alone does not prove startup or the user flow. State the critical path, shared-file hotspots, failure/rollback handling and a smaller fallback if time, tools or model access run out. Use the existing tracker for execution status.

Agent Orchestrator who will use this plan should provide exact context needed to every task for every subagent.
You shouldn't add to this file with a plan all the details that are in the ADR and PRD. These ADR and PRD files are the source of truth, and the plan should refer to them so that it contains links to the relevant sections of the ADR and PRD. That way, the agent doesn't have to have all this information immediately visible in one file if it doesn't need it.
On the other hand, the agent delegating to subagents should write the prompt for each subagent in a durable task brief file containing all the details, so the subagent does not have to look at other documents and already has everything needed to perform the task.
The prompt should manage this agent in such a way that it doesn't have to think about what decisions to make, but should guide it step by step on exactly how to perform this task, because we will use smaller models for these subagents to perform these tasks. I plan to use the Haiku model here.
When delegating to subagents, I want the Agent Orchestrator to decide which subagent and which model controlling it will be best for each task. By default use the Haiku model, which will be much cheaper for writing code, running tests, and checking functionality. However, remember that Orchestrator Agent have to make all decisions as a wise model. Orchestrator agent will manage this process. The orchestrator should make all decisions and be responsible for what the other agents do. Smaller agents, like Haiku subagents, should receive all instructions from you and the main agent. The main agent should manage this process and check the quality of their performance.
But provide only required information for this specific task. So don't blow the context window with everything about the application. You should only provide to the specialized subagents information needed to complete the task at hand.

Recommend ad hoc subagents by default for a one-off task: an exact brief matters more than a new role file. Use short custom definitions only for a recurring role with reusable tool restrictions or expertise. Existing named roles may be reused after inspecting them, without assuming their model or permissions suit this task. Verify the active harness supports the requested agent mechanism; otherwise execute the same matrix sequentially with one agent. Do not manufacture custom roles merely to match a tutorial.

Parallelize only tasks with independent inputs and disjoint editable files. Tell every worker which other work is concurrent. Serialize shared contracts, lockfiles, migrations and integration. Do not create a worktree for every agent or session; request one only when separate branches/environments provide a concrete benefit under the repository's policy.

After I authorize execution, compile each task's self-contained brief just before dispatch. Put it in a durable project path such as .agent-briefs/<task>.md, not a disposable temporary file. Include the relevant source excerpts, current contracts, predecessor outputs, exact editable files, ordered steps, test inputs and expected results. Link the authoritative documents for traceability, but do not make a small worker rediscover the whole architecture. The worker reports contradictions and observed results; it cannot change the agreed scope or accept its own work. The orchestrator reads the diff and reproduces the relevant checks before integrating and committing under the repository's policy.

Finish with the saved plan link, unresolved decisions, the first bounded task and the review gate. Planning does not authorize execution, new agents, publication or merge.

## Exercise: turn the session into your own planning skill

After reviewing the plan, identify which planning steps would be useful in another project. With the group, write a small SKILL.md containing a precise trigger, required inputs, the dependency-matrix contract, source-link rules, model/ownership policy and the stop-for-review boundary. Remove this application's domain, client names and decisions. Test the skill on a second small feature: does it find the real sources, ask only missing questions, avoid overlapping files and stop before implementation? Refine it from the observed result.

Optional external example for comparison: [write-implementation-plan, public PR #28](https://github.com/EdukeyTeam/agent-toolbox/pull/28). It is a pending proposal, not a required installation or an approved dependency of this exercise. Inspect its current state and compare its plan/brief separation with your own skill.
