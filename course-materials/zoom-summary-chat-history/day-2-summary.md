# Podsumowanie czatu - dzień 2, 20 października 2026

Podsumowanie obejmuje wyłącznie czat; nie jest zapisem wypowiedzi ustnych ani listą obecności.


Źródło: [historia czatu](day-2-chat-history.md). Godziny w czasie polskim. Uczestników oznaczono inicjałami, trener zachowuje publiczne przypisanie: Łukasz Matuszewski.

## Organizacja

- Przerwy trwały do 11:40 i do 14:40.
- Materiały dnia: [słownik AI](https://devpowers.com/szkolenia/jsystems/claude-code-2026-10/slownik-ai.html) i [Prezentacja 2: Podstawy AI](https://devpowers.com/szkolenia/jsystems/claude-code-2026-10/Prezentacja_02_Podstawy_AI.html#2).

## Logowanie agentów na zdalnej VM

- **Claude Code:** `claude auth login` na VM. URL logowania otwieramy na lokalnym komputerze, a wygenerowany adres `localhost` wklejamy z powrotem do Chrome na VM, co loguje sesję w TUI.
- **Codex:** `codex login --device-auth`. Najpierw trzeba włączyć logowanie kodem urządzenia w [ustawieniach bezpieczeństwa ChatGPT](https://chatgpt.com/settings/security), a kod wpisać na https://auth.openai.com/codex/device. Kodu urządzenia nigdy nie udostępniamy. W tych samych ustawieniach można wylogować wszystkie aktywne sesje.
- **Context7:** `npx ctx7 setup` z autoryzacją urządzenia w przeglądarce.
- Dostęp do VPS/VM można ograniczyć do prywatnej sieci VPN, np. [Tailscale](https://tailscale.com/).
- Wklejanie w terminalu VM: Shift+Insert albo środkowy przycisk myszy.

## Alternatywni dostawcy modeli i sekrety

- Klucze API trzymamy w `~/.config/secrets.sh`, funkcje i aliasy w `~/.bashrc-Agents`. Oba pliki ładuje `~/.bashrc`, najpierw sekrety. Prompt, którym agent sam przygotowuje tę konfigurację, jest w historii czatu (09:43).
- Przykładowe funkcje: `claude-mimo` z aliasem `ccm` ([Xiaomi MiMo w Claude Code](https://mimo.mi.com/docs/en-US/tokenplan/integration/claudecode)) oraz `claude-or` (OpenRouter z modelami DeepSeek i GLM).
- Gotowe wzorce: [.bashrc-agents](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/agent-configs/.bashrc-agents), [wersja dla PowerShell](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/agent-configs/claude-backends.ps1) i [konfiguracje Codex](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/tree/main/course-materials/agent-configs/codex), w tym dostawca Z.ai w `config.toml`.
- W Codex `/permissions` z opcją "Approve for me" to odpowiednik Auto mode w Claude. Uprawnienia i Autopilot w GitHub Copilot opisuje [osobny materiał](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/Research/copilot-vscode-autopilot-permissions-subagents.md).

## Modele i porównania

- Porównania modeli: [Arena](https://arena.ai/) z [rankingami](https://arena.ai/leaderboard), m.in. [WebDev](https://arena.ai/leaderboard/code/webdev) i [WebDev open source](https://arena.ai/leaderboard/code/webdev?license=open-source), oraz [Artificial Analysis](https://artificialanalysis.ai/). Na Arenie porównano strony wygenerowane przez Luna GPT i Sonnet 5.5 z jednego testowego promptu (linki i prompt w historii).
- Lokalny model [Qwen3.8-27B](https://huggingface.co/Qwen/Qwen3.8-27B) potrzebuje około 24 GB VRAM, najlepiej 32 GB.
- [Code Mode i algorytmiczna migracja kodu](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/Research/code-mode-and-algorithmic-code-migration-2026-10-13.md).
- Przykład skali pracy z agentami: [profil](https://github.com/steipete) i [blog](https://steipete.me/) twórcy OpenClaw.
- Dobre modele STT dla polskiego w Handy.computer: Canary 1B v2 i Parakeet TDT.

## Skills i narzędzia agentów

- Katalog [skills.sh](https://www.skills.sh/), m.in. [frontend-design](https://www.skills.sh/anthropics/skills/frontend-design), [create-design-system](https://www.skills.sh/edukeyteam/agent-toolbox/create-design-system), [grill-with-docs](https://www.skills.sh/mattpocock/skills/grill-with-docs) ([repozytorium](https://github.com/mattpocock/skills)).
- [agent-toolbox](https://github.com/EdukeyTeam/agent-toolbox) instalujemy poleceniem `npx --yes skills@latest add EdukeyTeam/agent-toolbox --skill '*'`.
- Skills usuwające "AI slop" z tekstów: [ponytail](https://github.com/DietrichGebert/ponytail/blob/main/skills/ponytail/SKILL.md) i [caveman](https://github.com/juliusbrussee/caveman).
- Przeglądarka dla agentów: [Playwright Agent CLI](https://playwright.dev/agent-cli/introduction) i [Chrome DevTools CLI](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/cli.md).
- Sterowanie komputerem: [Computer Use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool) i [Desktop Commander](https://desktopcommander.app/). W ćwiczeniu Claude odmówił przesunięcia suwaka anty-botowego Allegro jako obejścia kontroli dostępu. To efekt zabezpieczeń Anthropic; mniej zabezpieczone modele (np. MiMo, GLM, wersje [abliterated](https://abliteration.ai/abliterated-llm)) mogą zachować się inaczej.
- `git worktree` do równoległej pracy agentów.

## MCP, kontekst i wyszukiwanie

- [Wprowadzenie do MCP](https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro) i [budowanie serwerów MCP](https://modelcontextprotocol.io/docs/2026-07-28/develop/build-server).
- Atlassian: [Rovo MCP Server](https://support.atlassian.com/atlassian-ai-gateway/docs/use-atlassian-rovo-mcp-server/), [Rovo MCP](https://www.atlassian.com/platform/rovo-mcp), [Personal Access Tokens w Bitbucket Server](https://confluence.atlassian.com/bitbucketserver0717/personal-access-tokens-1087535496.html) i [skill dla Bitbucket](https://github.com/EdukeyTeam/agent-toolbox/pull/24).
- `/context all` pokazuje pełny kontekst sesji Claude Code.
- [Context7](https://context7.com/) dostarcza aktualną dokumentację bibliotek. Lokalny prywatny RAG opisuje [private-retrieval](https://github.com/EdukeyTeam/agent-toolbox/blob/main/skills/legacy-codebase-workflows/references/private-retrieval.md).
- Wyszukiwanie dla agentów: [Brave Search API](https://brave.com/search/api/), [Brave Search MCP](https://github.com/brave/brave-search-mcp-server), [skill web-search](https://www.skills.sh/brave/brave-search-skills/web-search), [Perplexity MCP](https://docs.perplexity.ai/docs/getting-started/integrations/mcp-server), [Perplexity CLI](https://docs.perplexity.ai/docs/cli/overview) do zleconego researchu na serwerze oraz [Exa](https://exa.ai/).

## PRD

- Przykładowe PRD: [aplikacja reklamacji elektroniki](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/Prompt%20examples/PRD-electronics-returns-complains-app.md) i [moduł analityki SQL](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/Prompt%20examples/PRD-analytics-SQL-module-returns-app.md). Na VM leżą w `~/DEV/jsystems-claude-code-2026-10/course-materials/Prompt examples/`.

## Dalsze kroki

- Trener: omówienie statusline dla Claude i Codex (tryb, zużycie limitów, okno kontekstu).
