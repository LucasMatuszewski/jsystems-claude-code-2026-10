# COURSE-NAME (COURSE-ORGANIZER)

**Materiały szkoleniowe: [devpowers.com/szkolenia/COURSE-SITE](https://devpowers.com/szkolenia/COURSE-SITE/)**

- [Agenda i wszystkie materiały](https://devpowers.com/szkolenia/COURSE-SITE/agenda.html)
- [Slajdy](https://devpowers.com/szkolenia/COURSE-SITE/agenda.html#prezentacje)
- [Biblioteka promptów](https://devpowers.com/szkolenia/COURSE-SITE/prompty.html) · [Ćwiczenia](https://devpowers.com/szkolenia/COURSE-SITE/cwiczenia.html) · [Checklisty](https://devpowers.com/szkolenia/COURSE-SITE/checklisty.html) · [Słownik AI](https://devpowers.com/szkolenia/COURSE-SITE/slownik-ai.html)
- [Wyniki ankiety przed szkoleniem](https://devpowers.com/szkolenia/COURSE-SITE/raport-przed.html) · [Odpowiedzi na pytania z kursu](https://devpowers.com/szkolenia/COURSE-SITE/pytania.html) (uzupełniamy po każdym dniu)

Aktualny [program szkolenia](AGENDA.md).

Repozytorium uczestnika szkolenia COURSE-ORGANIZER (COURSE-DATES, online, 09:00-16:00). W czasie szkolenia (COURSE-DURATION) przechodzimy pełny cykl wytwarzania oprogramowania z agentami AI: od pomysłu i wymagań (PRD), przez decyzje architektoniczne (ADR), plan, implementację i testy, po code review, bezpieczeństwo i CI/CD.

Głównym agentem warsztatu jest **OpenAI Codex CLI**, a te same koncepcje pokazujemy także w **Claude Code** i **GitHub Copilot**. Możesz pracować w swoim stosie (np. C# / .NET, Java, Python); przykład prowadzącego powstaje w TypeScript.

Głównym projektem grupy jest aplikacja do obsługi zwrotów i reklamacji elektroniki, rozwijana według PRD uzgodnionego podczas zajęć. Możesz też pracować nad własnym pomysłem, stosując ten sam proces. Po PRD omów architekturę i biblioteki, zapisz decyzje w ADR, ułóż plan i zależności zadań, a potem implementuj, testuj i przeglądaj zmiany przed utworzeniem PR. Przykładowy prompt PRD w `course-materials/` nie zastępuje dokumentu poprawionego z grupą.

## Biblioteka dodatkowa

`course-materials/` zawiera szeroką bibliotekę pełnych promptów, danych syntetycznych, checklist, przykładów konfiguracji i materiałów o innych agentach. To zasób do późniejszego czytania, nie lista narzędzi wymaganych na warsztacie. [Pełne prompty historyczne](course-materials/Prompt%20examples/) zachowano bez skracania; starsze twierdzenia o produktach, licencjach i komendach wymagają ponownego sprawdzenia. Podczas pracy z wybraną aplikacją agent nie powinien sam przeszukiwać `course-materials/`: zawarte tam PRD, ADR i instrukcje są przykładami, a nie wymaganiami tego projektu. Otwórz konkretny materiał dopiero wtedy, gdy go o to poprosisz.

W bibliotece znajdują się również **archiwalne materiały z wcześniejszego kursu o Claude Code**: [agenda](course-materials/course-agenda.md), [slajdy](course-materials/slides/claude-code-2026-07/), [notatki](course-materials/Course%20Notes%20-%20AI%20in%20Programming.md), [quiz](course-materials/quizzes/day-1-anonymous-ai-basics-quiz.md), [przykłady konfiguracji](course-materials/agent-configs/claude/) i [słownik PDF](course-materials/AI%20dla%20Programist%C3%B3w%20-%20S%C5%82ownik%20przed%20szkoleniem.pdf). Zachowano je jako źródła do ponownego wykorzystania, **nie jako aktualną agendę ani konfigurację tego warsztatu**. Przykłady ustawień i skrypty należy dostosować i sprawdzić przed użyciem. `course-materials/exercise-data/hidden-patterns.md` jest archiwalnym kluczem trenerskim do danych syntetycznych.

Warto zacząć od: [promptu PRD](course-materials/Prompt%20examples/PRD-electronics-returns-complains-app.md) i [promptu ADR](course-materials/Prompt%20examples/ADR-generation-typescript-vercel-ai-sdk.md) z linkami do bibliotek (Chat SDK, OpenRouter Responses API, Vercel AI SDK), [jednego skryptu blokującego odczyt `.env`, kluczy SSH i `secrets/`](course-materials/hooks-example/) w Copilocie, Claude Code i Codex, oraz [agenta code review w CI/CD](course-materials/cicd-headless/agent-review/) - Azure Pipelines, GitLab CI, Bitbucket Pipelines, Jenkins i GitHub Actions, z wynikiem w komentarzu PR i zadaniu w Jira.

Skróty Codexa dla Bash i PowerShell znajdziesz w [przykładach profili](course-materials/agent-configs/README.md#codex-profiles). [Przykłady hooków](course-materials/hooks-example/) obejmują blokadę plików z sekretami oraz opcjonalne kontrole poleceń, treści zapisu, Javy i kontekstu sesji. Wybierz potrzebne wpisy i scal je z własną konfiguracją zgodnie z instrukcją.

## Granice

Używaj wyłącznie danych syntetycznych. Przed przekazaniem kontekstu agentowi sprawdź politykę organizacji i zakres dostępu. Przejrzyj każdy diff, wynik testów i uprawnienia proponowanych narzędzi. Testów nie zmieniaj po to, by ukryć nieukończone zachowanie.

Możliwość użycia agenta chmurowego, MCP, CLI i pul AI Credits zależy od planu oraz ustawień organizacji. Agent w IDE i agent chmurowy to osobne środowiska. Funkcje edytora mogą się różnić od CLI i od innych IDE. [Stan narzędzi i źródła](docs/tool-facts.md) wymagają ponownego sprawdzenia przed zajęciami.

Trener: Łukasz Matuszewski · [LinkedIn](https://www.linkedin.com/in/lukaszmatuszewski/) · [X](https://x.com/mrLumatic)
