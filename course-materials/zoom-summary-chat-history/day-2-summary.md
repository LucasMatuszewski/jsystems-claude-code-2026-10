# Podsumowanie - dzień 2, 20 października 2026

Źródła: automatyczne podsumowanie spotkania Zoom (AI Companion), zanonimizowane, oraz [historia czatu](day-2-chat-history.md). Uczestników oznaczono inicjałami, trener zachowuje publiczne przypisanie: Łukasz Matuszewski. Godziny w czasie polskim.

## Przegląd

Drugi dzień był praktyczną konfiguracją pracy z agentami: logowanie Claude Code i Codex na maszynach wirtualnych, klucze API i alternatywni dostawcy modeli, wybór modeli, skills i polecenia, narzędzia przeglądarki i komputera, MCP, zarządzanie kontekstem oraz wyszukiwanie dla agentów. Na koniec grupa zaczęła pracę nad specyfikacją aplikacji do zwrotów i reklamacji sprzętu elektronicznego.

Kluczowe pojęcia:

- **Subskrypcja vs API** - abonament daje pakiet użycia, API rozlicza każdy token. Prompt caching (cache) zmniejsza koszt powtarzanego kontekstu.
- **Okno kontekstu** - ilość danych, którą model widzi naraz. Agenci radzą sobie z dużymi zbiorami przez kompresję (compaction) i narzędzia podobne do RAG, np. [Context7](https://context7.com/).
- **Skills i polecenia** - pakiety instrukcji i narzędzi dla agenta. Skills traktujemy jak kod: wersjonujemy je i z czasem poprawiamy.
- **Code Mode** - agent pisze program, który przekształca kod, zamiast edytować każdy plik osobno ([materiał](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/Research/code-mode-and-algorithmic-code-migration-2026-10-13.md)).
- **Generaliści i eksperci** - agenci przejmują część zadań młodszych programistów, ale nadal potrzebni są ludzie, którzy nimi zarządzają i nadzorują ich pracę. Rośnie wartość generalistów.

## Organizacja

- Przerwy trwały do 11:40 i do 14:40.
- Materiały dnia: [słownik AI](https://devpowers.com/szkolenia/jsystems/claude-code-2026-10/slownik-ai.html) i [Prezentacja 2: Podstawy AI](https://devpowers.com/szkolenia/jsystems/claude-code-2026-10/Prezentacja_02_Podstawy_AI.html#2).
- Wklejanie w terminalu VM: Shift+Insert albo środkowy przycisk myszy.

## Temat 1: Logowanie agentów na zdalnej VM

- **Claude Code:** `claude auth login` na VM. URL logowania otwieramy na lokalnym komputerze, a wygenerowany adres `localhost` wklejamy z powrotem do Chrome na VM, co loguje sesję w TUI.
- **Codex:** `codex login --device-auth`. Najpierw trzeba włączyć logowanie kodem urządzenia w [ustawieniach bezpieczeństwa ChatGPT](https://chatgpt.com/settings/security), a kod wpisać na https://auth.openai.com/codex/device. Kodu urządzenia nigdy nie udostępniamy. W tych samych ustawieniach można wylogować wszystkie aktywne sesje.
- W Codex `/permissions` z opcją "Approve for me" to odpowiednik Auto mode w Claude: polecenia przechodzą kontrolę bezpieczeństwa. Uprawnienia i Autopilot w GitHub Copilot opisuje [osobny materiał](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/Research/copilot-vscode-autopilot-permissions-subagents.md).
- Dostęp do VPS/VM można ograniczyć do prywatnej sieci VPN, np. [Tailscale](https://tailscale.com/).

### Q&A

- **Ł.W. dołączył później po porannej awarii i pracuje lokalnie: co skonfigurować u siebie?** Łukasz wskazał materiały szkoleniowe, w tym [konfigurację alternatywnych dostawców](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/agent-configs/.bashrc-agents).
- **Problemy z logowaniem i terminalem na VM** rozwiązywano na bieżąco, m.in. widoczność terminala i wprowadzanie poleceń przy logowaniu do Codex.

## Temat 2: Alternatywni dostawcy i sekrety

- Klucze API trzymamy w `~/.config/secrets.sh`, funkcje i aliasy w `~/.bashrc-Agents`. Oba pliki ładuje `~/.bashrc`, najpierw sekrety. Prompt, którym agent sam przygotowuje tę konfigurację, jest w historii czatu (09:43).
- Przykładowe funkcje: `claude-mimo` z aliasem `ccm` ([Xiaomi MiMo w Claude Code](https://mimo.mi.com/docs/en-US/tokenplan/integration/claudecode)) oraz `claude-or` (OpenRouter z modelami DeepSeek i GLM).
- Gotowe wzorce: [.bashrc-agents](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/agent-configs/.bashrc-agents), [wersja dla PowerShell](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/agent-configs/claude-backends.ps1) i [konfiguracje Codex](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/tree/main/course-materials/agent-configs/codex), w tym dostawca Z.ai w `config.toml`.

## Temat 3: Wybór modelu

- Porównania modeli: [Arena](https://arena.ai/) z [rankingami](https://arena.ai/leaderboard), m.in. [WebDev](https://arena.ai/leaderboard/code/webdev) i [WebDev open source](https://arena.ai/leaderboard/code/webdev?license=open-source), oraz [Artificial Analysis](https://artificialanalysis.ai/). Na Arenie porównano strony wygenerowane przez Luna GPT i Sonnet 5.5 z jednego testowego promptu (linki i prompt w historii czatu).
- Porównano Sol, Opus, Sonnet i Luna pod kątem kosztu, zużycia tokenów i jakości. Łukasz polecił Sol jako opłacalny model do programowania, choć generuje mniej tokenów niż Opus. Wybór zależy od zadania i budżetu.
- Lokalny model [Qwen3.8-27B](https://huggingface.co/Qwen/Qwen3.8-27B) potrzebuje około 24 GB VRAM, najlepiej 32 GB.
- Dobre modele STT dla polskiego w Handy.computer: Canary 1B v2 i Parakeet TDT.
- Przykład skali pracy z agentami: [profil](https://github.com/steipete) i [blog](https://steipete.me/) twórcy OpenClaw.

### Q&A

- **J.: jak wybrać model spośród opcji w chmurze?** Według poziomu myślenia (niski, średni, maksymalny) i kosztu.
- **Angielski czy polski w promptach?** Angielski zużywa mniej tokenów i zwykle daje lepsze wyniki.
- **K.: czy modele różnią się między wersjami?** Tak, np. Opus 5.5 wydaje się bardziej rzeczowy od innych modeli.

## Temat 4: Skills, polecenia i narzędzia agentów

- Katalog [skills.sh](https://www.skills.sh/), m.in. [frontend-design](https://www.skills.sh/anthropics/skills/frontend-design), [create-design-system](https://www.skills.sh/edukeyteam/agent-toolbox/create-design-system), [grill-with-docs](https://www.skills.sh/mattpocock/skills/grill-with-docs) ([repozytorium](https://github.com/mattpocock/skills)).
- [agent-toolbox](https://github.com/EdukeyTeam/agent-toolbox) instalujemy poleceniem `npx --yes skills@latest add EdukeyTeam/agent-toolbox --skill '*'`. Omówiono instalację na poziomie projektu i globalną, skills publiczne i prywatne oraz różnicę między skills a poleceniami (polecenia można grupować i automatyzować).
- Demo skilla Create Design System: agent analizuje stronę, pobiera logo i zrzuty ekranu oraz tworzy dokumentację marki. Działa w trybie z widoczną przeglądarką albo headless, który lepiej pasuje do serwerów.
- Skills usuwające "AI slop" z tekstów: [ponytail](https://github.com/DietrichGebert/ponytail/blob/main/skills/ponytail/SKILL.md) i [caveman](https://github.com/juliusbrussee/caveman).
- Przeglądarka dla agentów: [Playwright Agent CLI](https://playwright.dev/agent-cli/introduction) i [Chrome DevTools CLI](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/docs/cli.md).
- Sterowanie komputerem: [Computer Use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool) i [Desktop Commander](https://desktopcommander.app/). Niektóre wtyczki niosą ryzyko bezpieczeństwa.
- `git worktree` do równoległej pracy agentów; platformy chmurowe pomagają uruchamiać agentów poza laptopem.

### Q&A

- **Bezpieczeństwo GitHub CLI i uprawnień agenta:** zalecany jest dostęp tylko do odczytu, a do zapisu osobne klucze. Omówiono też dostęp agenta do laptopa i uprawnienia repozytorium.
- **Dlaczego Claude nie przesunął suwaka na Allegro?** To zabezpieczenie anty-botowe, a jego obejście byłoby obejściem kontroli dostępu. Odmowa wynika z zabezpieczeń Anthropic; mniej zabezpieczone modele (np. MiMo, GLM, wersje [abliterated](https://abliteration.ai/abliterated-llm)) mogą zachować się inaczej.

## Temat 5: MCP, kontekst i wyszukiwanie

- [Wprowadzenie do MCP](https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro) i [budowanie serwerów MCP](https://modelcontextprotocol.io/docs/2026-07-28/develop/build-server). Narzędzia dajemy agentom jako lokalne CLI, serwery MCP albo skills, z uwagą na bezpieczeństwo i koszt kontekstu.
- Atlassian: [Rovo MCP Server](https://support.atlassian.com/atlassian-ai-gateway/docs/use-atlassian-rovo-mcp-server/), [Rovo MCP](https://www.atlassian.com/platform/rovo-mcp), [Personal Access Tokens w Bitbucket Server](https://confluence.atlassian.com/bitbucketserver0717/personal-access-tokens-1087535496.html) i [skill dla Bitbucket](https://github.com/EdukeyTeam/agent-toolbox/pull/24).
- `/context all` pokazuje pełny kontekst sesji Claude Code. Kompresja kontekstu ogranicza zużycie pamięci i koszt.
- [Context7](https://context7.com/) dostarcza aktualną dokumentację bibliotek (`npx ctx7 setup`, darmowe konto). Lokalny prywatny RAG opisuje [private-retrieval](https://github.com/EdukeyTeam/agent-toolbox/blob/main/skills/legacy-codebase-workflows/references/private-retrieval.md).
- Wyszukiwanie dla agentów: [Brave Search API](https://brave.com/search/api/), [Brave Search MCP](https://github.com/brave/brave-search-mcp-server), [skill web-search](https://www.skills.sh/brave/brave-search-skills/web-search), [Perplexity MCP](https://docs.perplexity.ai/docs/getting-started/integrations/mcp-server), [Perplexity CLI](https://docs.perplexity.ai/docs/cli/overview) do zleconego researchu na serwerze oraz [Exa](https://exa.ai/).

### Q&A

- **Ł.N.: na czym się skupić?** Na inżynierii i konfiguracji agentów. Łukasz uzupełnił to o zarządzanie kontekstem i kompresję jako sposób na niższe koszty.

## Temat 6: Specyfikacja aplikacji

- Grupa zaczęła tworzyć specyfikację aplikacji do zwrotów i reklamacji sprzętu elektronicznego. Przykładowe PRD: [aplikacja reklamacji elektroniki](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/Prompt%20examples/PRD-electronics-returns-complains-app.md) i [moduł analityki SQL](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/Prompt%20examples/PRD-analytics-SQL-module-returns-app.md). Na VM leżą w `~/DEV/jsystems-claude-code-2026-10/course-materials/Prompt examples/`.

## Zadania i następne kroki

Uczestnicy:

- Dokończyć specyfikację systemu projektowego dla wybranej aplikacji przy użyciu dostarczonych skills i odpowiedzieć na pytania agenta, żeby doprecyzować wymagania.
- Wylogować się z maszyn wirtualnych po zakończeniu szkolenia.

Trener (Łukasz Matuszewski):

- Dodać do slajdów instrukcję krok po kroku logowania na VM przez lokalny komputer.
- Podać link do badań o zmieniającej się roli generalistów i ekspertów w erze AI.
- Udostępnić przykłady skilla do obsługi code review.
- Omówić skill Create Design System, ADR oraz statusline dla Claude i Codex (tryb, zużycie limitów, okno kontekstu).

## Prywatność i bezpieczeństwo

- W historii czatu usunięto trzy klucze API i jednorazowy kod logowania. To klucze tymczasowe na czas szkolenia.
