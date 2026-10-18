# Przykłady zespołu AI Chat

Te definicje pozostają nieaktywne. W module 2.3 przygotuj własne pliki `.claude/agents/be-developer.md`, `.claude/agents/fe-developer.md` i `.claude/agents/qa-engineer.md` na podstawie PRD, ADR i rzeczywistej struktury aplikacji. Porównaj je z przykładami w `agents/`. Nie kopiuj całej historycznej biblioteki do aktywnego katalogu.

Wersja sprawdzona: Claude Code 2.1.302, 18.10.2026. Narzędzie delegowania nazywa się `Agent`; `Task` jest starszą nazwą i aliasem. Definicja zawiera frontmatter `name`, `description`, opcjonalnie `tools`, `model`, `permissionMode` i `memory`. `/agents` w bieżącej wersji wskazuje edycję plików; starszy kreator nie jest uniwersalną instrukcją. Pamięć `project` jest opcjonalna i wymaga kontroli zawartości przed commitem.

Zadania BE i FE mogą ruszyć po ustaleniu kontraktu streamingu. QA może równolegle przygotować scenariusze, lecz uruchamia E2E dopiero na połączonej, działającej aplikacji. Raport subagenta sprawdza agent główny i człowiek. Zagnieżdżona delegacja zależy od wersji i konfiguracji; przykłady nie udostępniają narzędzia `Agent`.

Aktywne `.mcp.json` używa na Linuxie `npx` bez `cmd /c`. Context7 może wymagać konta lub klucza po wykorzystaniu dostępu publicznego; klucz ustaw lokalnie, nigdy w commicie. Playwright MCP wymaga przeglądarki Chrome na VM. Przy pierwszym uruchomieniu zaakceptuj wyłącznie zaufane serwery w `/mcp`.

Historyczny hook bezpieczeństwa Maven zachowano w `hooks/maven-security.settings.json`. Nie jest aktywny w projekcie TypeScript. Przykłady hooków blokujących sekrety pozostają w `course-materials/hooks-example/`; przejrzyj skrypt i scal wybrane wpisy z własnymi ustawieniami.

Źródła: [Subagents](https://code.claude.com/docs/en/sub-agents), [MCP](https://code.claude.com/docs/en/mcp), [Settings](https://code.claude.com/docs/en/settings), [Hooks](https://code.claude.com/docs/en/hooks).
