# Cloud scheduling in Codex and Claude

Checked: **18 October 2026**. This note resolves questions from the course using current documentation. No participant account, private task or account-switching flow was inspected, and no scheduled task was created.

## Choose where the work runs

| Product / feature | Where it runs | Can the laptop be closed? | Where to configure it |
|---|---|---|---|
| ChatGPT / Codex scheduled task using cloud tools | Provider cloud | Yes | Web `Scheduled`, or an available Cloud option in the app |
| Desktop scheduled task using local files | Your computer | No | Desktop app |
| Claude Code cloud routine | Anthropic cloud, or a configured organization runner | Yes | Web routines, Desktop Code tab with Cloud selected, or CLI `/schedule` |
| Claude Code Desktop local scheduled task | Your computer | No | Desktop, Local option |
| Claude Code `/loop` | Current CLI session | No | CLI `/loop` |
| Claude / Cowork cloud scheduled task | Provider cloud | Yes | `Scheduled` in Claude |

Sources: [OpenAI scheduled tasks](https://learn.chatgpt.com/docs/automations), [Claude scheduling comparison](https://code.claude.com/docs/en/scheduled-tasks), [Claude Cowork scheduled tasks](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork).

## Codex: use Scheduled on the web or in the app

Codex CLI and the IDE extension do not expose the Scheduled management interface. On an enabled workspace, ask in a web ChatGPT / Codex conversation to schedule the work, then inspect the saved task and its run history in **Scheduled**. Select cloud execution when available if the laptop will be off. A task tied to a local folder needs the computer and app running; opening it remotely does not change its execution location. Source: [OpenAI scheduled tasks](https://learn.chatgpt.com/docs/automations).

For repository work, [Codex Cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environments) provide a published environment and an isolated cloud workspace. Local personal skills are not automatically synced there. The legacy Codex Cloud experience remains for specific integrations and is planned for deprecation; do not use screenshots of that interface as proof of current availability.

If two people see different controls, check their signed-in account, selected workspace, plan and admin settings, plus the selected execution location. These are diagnostic checks, not a confirmed explanation of the participant's experience. OpenAI's [scheduling walkthrough](https://developers.openai.com/training/walkthroughs/scheduled-tasks) explicitly distinguishes cloud work from tasks needing local files. No source found here establishes that OpenAI removed scheduling because of competition with another provider.

## Claude Code: /schedule and /routines still exist

Cloud routines are managed at [claude.ai/code/routines](https://claude.ai/code/routines). `/routines` is an alias for `/schedule`. CLI creation requires Claude Code **2.1.225+**; CLI management requires **2.1.227+**. These commands run inside an interactive Claude Code session:

```text
/schedule every weekday at 06:07 Europe/Warsaw, summarize the open pull requests in the selected repository
/schedule list
/schedule update
```

Review the absolute time, timezone, repository and saved configuration before confirming. Cloud routines and local Desktop tasks are distinct. A Cloud routine belongs to the same claude.ai account across CLI, web and Desktop; a Local task does not become a cloud routine automatically. Source: [Claude routines](https://code.claude.com/docs/en/routines).

Cloud scheduling requires subscription authentication and access to Claude Code on the web. API-key/provider authentication, an outdated CLI or an organization policy can hide the command. The official [routines announcement](https://claude.com/resources/articles/introducing-routines-in-claude-code) identifies Pro, Max, Team and Enterprise access; consult the current routines troubleshooting section for account-specific prerequisites. Do not change credentials blindly just to reveal a menu.

Claude / Cowork also has cloud scheduled tasks. The new unified interface is rolling out, so labels may differ. On Pro and Max, tasks created before **6 October** that ran locally keep doing so; tasks requiring local files or apps still run locally. This is another reason an older Desktop schedule can behave differently from a newly created web task. Source: [Cowork scheduling](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork).

## Scheduling does not itself reset a usage limit

A scheduled run is work that consumes usage. It is not an administrative reset of a five-hour or weekly allowance. A closed laptop prevents a local run from executing; it does not freeze a provider's server-side clock. Do not promise that a daily “say hi” will reset an allowance at 06:00. Check the actual account's usage panel and recorded run. Claude's [usage guidance](https://support.claude.com/en/articles/9797557-usage-limit-best-practices) describes both session and weekly limits; its separately granted [limit resets](https://support.claude.com/en/articles/17007452-what-is-a-limit-reset) are a different feature.

OpenAI currently says local messages and cloud chats share the plan's allowance, while API-key sessions are billed separately. It also says **Pro currently has no five-hour limit**; other plans can have five-hour and weekly constraints. A generic “start the five-hour window every morning” recipe therefore is not valid for every plan. Source: [current ChatGPT Work / Codex pricing and usage](https://learn.chatgpt.com/docs/pricing).

A local cron or systemd timer can launch a CLI on an always-on host. That is a self-hosted scheduler, not a native Codex cloud schedule, and still requires a running host, authentication and a review of unattended permissions.
