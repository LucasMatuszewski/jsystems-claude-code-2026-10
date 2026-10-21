# Example prompt (dictated) to get detailed plan based on PRD and ADR

I want you to create very detailed plan of work to create fully working proof of concept of our application.
Implement both back end, front end, tests and follow all guidelines from your AGENTS.md files.
I want you to follow instructions and detailed documentation from:
- Product Requirements Document for functional description,
- Architecture Decision Records for architecture and implementation technical decisions,
- Design guidelines to follow the design of our brand

You should provide exact context to specialized agents and orchestrate work of multiple subagents.
You should not implement anything yourself. You are only orchestrator and manager.
You should only delegate to specialized agents, and provides for each agent everything what is required for this agent to, do its work without asking questions.
So every agent for every task should have very detailed instructions for this specific task.

You should not ask agents to implement everything at once.
So your next task is to create detailed plan, make phases, and you should plan work of multiple agents in many small steps, with commits after every step and with full test driven development process for every step.
You should, make matrix of dependencies between tasks and between agents, to coordinate their work in the way that will prevent one agent interrupt or make conflicts with other agents and to let them work together (partially in parallel when possible).
Plan the tasks and every step in this process with information which task need to be finished first before we go to the next stage.

Agent you should always use to delegate work to based on specialization:
"fe-developer"
"be-developer"
"qa-engineer"

If these agents are not defined, you should create the definition files for these subagents. Make them very short and concise. Define only the role; don't make them too verbose.

Files you should use to create detailed plan of implementation of our PoC application:
- @docs/PRD-Product-Requirements-Document.md
- @docs/ADR
- @docs/design-guidelines.md

Agent Orchestrator who will use this plan should provide exact context needed to every task for every subagent.
You shouldn't add to this file with a plan all the details that are in the ADR and PRD. These ADR and PRD files are the source of truth, and the plan should refer to them so that it contains links to the relevant sections of the ADR and PRD. That way, the agent doesn't have to have all this information immediately visible in one file if it doesn't need it.
On the other hand, the agent delegating to subagents should write the prompt for each subagent in a temporary file containing all the details, so the subagent does not have to look at other documents and already has everything needed to perform the task.
The prompt should manage this agent in such a way that it doesn't have to think about what decisions to make, but should guide it step by step on exactly how to perform this task, because we will use smaller models for these subagents to perform these tasks. I plan to use the Haiku model here.
When delegating to subagents, I want the Agent Orchestrator to decide which subagent and which model controlling it will be best for each task. Be defoult use the Haiku model, which will be much cheaper for writing code, running tests, and checking functionality. However, remember that Orchestrator Agent have to make all decisions as a wise model. Orchestrator agent will manage this process. The orchestrator should make all decisions and be responsible for what the other agents do. Smaller agents, like Haiku subagents, should receive all instructions from you and the main agent. The main agent should manage this process and check the quality of their performance.
But provide only required information for this specific task. So don't blow the context window with everything about the application. You should only provide to the specialized subagents information needed to complete the task at hand.

If anything is unclear, you should ask minimum 5 questions to make sure that you understand everything correct and that you don't have any doubts about what you should do and how this process should work.
