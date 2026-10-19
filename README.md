# Claude Code - od zera do zespołu agentów AI (JSystems)

**Materiały szkoleniowe: [devpowers.com/szkolenia/jsystems/claude-code-2026-10](https://devpowers.com/szkolenia/jsystems/claude-code-2026-10/)**

- [Agenda i wszystkie materiały](https://devpowers.com/szkolenia/jsystems/claude-code-2026-10/agenda.html)
- [Slajdy](https://devpowers.com/szkolenia/jsystems/claude-code-2026-10/agenda.html#prezentacje)
- [Biblioteka promptów](https://devpowers.com/szkolenia/jsystems/claude-code-2026-10/prompty.html) · [Ćwiczenia](https://devpowers.com/szkolenia/jsystems/claude-code-2026-10/cwiczenia.html) · [Checklisty](https://devpowers.com/szkolenia/jsystems/claude-code-2026-10/checklisty.html) · [Słownik AI](https://devpowers.com/szkolenia/jsystems/claude-code-2026-10/slownik-ai.html)
- [Odpowiedzi na pytania z kursu](https://devpowers.com/szkolenia/jsystems/claude-code-2026-10/pytania.html) (uzupełniamy po każdym dniu)

Aktualny [program szkolenia](AGENDA.md).

Repozytorium uczestnika szkolenia JSystems (19-21.10.2026, online, 09:00-16:00). W czasie szkolenia (3 dni) przechodzimy pełny cykl wytwarzania oprogramowania z agentami AI: od pomysłu i wymagań (PRD), przez decyzje architektoniczne (ADR), plan, implementację i testy, po code review, bezpieczeństwo i CI/CD.

Głównym narzędziem warsztatu jest **Claude Code CLI** na przygotowanych maszynach Ubuntu Linux (8 GB RAM, 4 rdzenie). Claude Desktop i Claude Code w przeglądarce omawiamy jako pozostałe tryby pracy; Codex i Copilot służą wyłącznie porównaniom. Możesz pracować w swoim stosie (np. C# / .NET, Java, Python); przykład prowadzącego powstaje w TypeScript.

Głównym projektem jest **AI Chat**: backend TypeScript z Vercel AI SDK, streaming odpowiedzi i frontend React z `useChat`, rozwijany według PRD uzgodnionego podczas zajęć. Możesz też pracować nad własnym pomysłem, stosując ten sam proces. Po PRD omów architekturę i biblioteki, zapisz decyzje w ADR, ułóż plan i zależności zadań, a potem implementuj, testuj i przeglądaj zmiany przed utworzeniem PR. Przykładowy prompt PRD w `course-materials/` nie zastępuje dokumentu poprawionego z grupą.

## Trzy dni pracy nad AI Chat

1. 19.10: środowisko, tryby Claude Code, kontekst i instrukcje, PRD, ADR i szkielet AI Chat.
2. 20.10: MCP, Skills, własne definicje `be-developer`, `fe-developer`, `qa-engineer`, TDD oraz integracja streamingu z UI.
3. 21.10: praca równoległa w worktrees, testy E2E, review, Claude Code w chmurze i tryb `-p` w GitHub Actions.

Zajęcia: 09:00-16:00 Europe/Warsaw, online przez Zoom. [Przygotowanie do zajęć](https://devpowers.com/szkolenia/jsystems/claude-code-2026-10/preflight.html). [Prompty AI Chat](https://devpowers.com/szkolenia/jsystems/claude-code-2026-10/prompty.html) zawierają pełne zadania. Przykłady specjalistów w [bibliotece konfiguracji](course-materials/agent-configs/claude/ai-chat-examples.md) są nieaktywne; własne definicje powstaną podczas modułu 2.3. Kod aplikacji, PRD i ADR tworzymy na zajęciach, nie są gotowym rozwiązaniem w tym repozytorium.

## Biblioteka dodatkowa

`course-materials/` zawiera szeroką bibliotekę pełnych promptów, danych syntetycznych, checklist, przykładów konfiguracji i materiałów o innych agentach. To zasób do późniejszego czytania, nie lista narzędzi wymaganych na warsztacie. [Pełne prompty historyczne](course-materials/Prompt%20examples/) zachowano bez skracania; starsze twierdzenia o produktach, licencjach i komendach wymagają ponownego sprawdzenia. Podczas pracy z wybraną aplikacją agent nie powinien sam przeszukiwać `course-materials/`: zawarte tam PRD, ADR i instrukcje są przykładami, a nie wymaganiami tego projektu. Otwórz konkretny materiał dopiero wtedy, gdy go o to poprosisz.

Aktualne slajdy i materiały tego kursu są w [course-materials/slides/jsystems-claude-code-2026-10/](course-materials/slides/jsystems-claude-code-2026-10/index.html); to kopia [strony kursu](https://devpowers.com/szkolenia/jsystems/claude-code-2026-10/), która pozostaje źródłem prawdy.

W bibliotece znajdują się również **archiwalne materiały z wcześniejszego kursu o Claude Code**: [agenda](course-materials/course-agenda.md), [notatki](course-materials/Course%20Notes%20-%20AI%20in%20Programming.md), [quiz](course-materials/quizzes/day-1-anonymous-ai-basics-quiz.md), [przykłady konfiguracji](course-materials/agent-configs/claude/) i [słownik PDF](course-materials/AI%20dla%20Programist%C3%B3w%20-%20S%C5%82ownik%20przed%20szkoleniem.pdf). Zachowano je jako źródła do ponownego wykorzystania, **nie jako aktualną agendę ani konfigurację tego warsztatu**. Przykłady ustawień i skrypty należy dostosować i sprawdzić przed użyciem. `course-materials/exercise-data/hidden-patterns.md` jest archiwalnym kluczem trenerskim do danych syntetycznych.

Dodatkowe, niezależne przykłady: [promptu PRD](course-materials/Prompt%20examples/PRD-electronics-returns-complains-app.md) i [promptu ADR](course-materials/Prompt%20examples/ADR-generation-typescript-vercel-ai-sdk.md) z linkami do bibliotek (Chat SDK, OpenRouter Responses API, Vercel AI SDK), [jednego skryptu blokującego odczyt `.env`, kluczy SSH i `secrets/`](course-materials/hooks-example/) w Copilocie, Claude Code i Codex, oraz [agenta code review w CI/CD](course-materials/cicd-headless/agent-review/) - Azure Pipelines, GitLab CI, Bitbucket Pipelines, Jenkins i GitHub Actions, z wynikiem w komentarzu PR i zadaniu w Jira.

Skróty Codexa dla Bash i PowerShell znajdziesz w [przykładach profili](course-materials/agent-configs/README.md#codex-profiles). [Przykłady hooków](course-materials/hooks-example/) obejmują blokadę plików z sekretami oraz opcjonalne kontrole poleceń, treści zapisu, Javy i kontekstu sesji. Wybierz potrzebne wpisy i scal je z własną konfiguracją zgodnie z instrukcją.

## Granice

Używaj wyłącznie danych syntetycznych. Przed przekazaniem kontekstu agentowi sprawdź politykę organizacji i zakres dostępu. Przejrzyj każdy diff, wynik testów i uprawnienia proponowanych narzędzi. Testów nie zmieniaj po to, by ukryć nieukończone zachowanie.

Możliwość użycia chmury, Desktop i modeli zależy od konta oraz ustawień organizacji. Używasz własnej subskrypcji Claude albo konta zapewnionego przez organizatora. Agent w IDE i agent chmurowy to osobne środowiska. Funkcje edytora mogą się różnić od CLI i od innych IDE. [Stan narzędzi i źródła](docs/tool-facts.md) sprawdzono 18.10.2026.

Trener: Łukasz Matuszewski · [LinkedIn](https://www.linkedin.com/in/lukaszmatuszewski/) · [X](https://x.com/mrLumatic)
