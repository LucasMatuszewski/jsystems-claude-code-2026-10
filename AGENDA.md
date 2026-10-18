## Program szkolenia

### Dzień 1: Fundamenty i start projektu

**Temat przewodni:** Poznaj Claude Code i zbuduj fundament projektu

#### Moduł 1.1: Wprowadzenie i konfiguracja

- Omówienie doświadczeń uczestników, poznajmy się
- AI w programowaniu w 2026: agenci, nie asystenci
- Krótki przegląd trendów i case studies wykorzystania agentów AI
- Korzyści vs ryzyka (halucynacje, nadmierne poleganie, context rot, koszty)
- Weryfikacja środowiska: Claude Code CLI, Desktop App, IDE, Node.js, Git
- Pierwsze uruchomienie Claude Code — interaktywny test

**Cel:** Gotowe środowisko, wspólny punkt startowy

#### Moduł 1.2: Claude Code — tryby pracy i kluczowe funkcje

- Claude Code CLI: tryb interaktywny vs jednorazowe polecenia (-p)
- Claude Desktop App: chat z kodem, Hyper-V sandbox (Windows)
- Claude Web z remote environments (cloud)
- Porównanie trybów: kiedy CLI, kiedy Desktop, kiedy Web
- Kluczowe komendy, np.: /resume, /compact, /context, /model, /permissions
- Modele: Opus vs Sonnet vs Haiku + alternatywy (np. GLM-5) — kiedy który
- Zarządzanie kontekstem: okno kontekstowe, kompresja, context rot
- Uprawnienia i tryby bezpieczeństwa (allowedTools, denyTools, Sandbox)

**Cel:** Swobodna praca z Claude Code w każdym trybie

#### Moduł 1.3: Context Engineering i konfiguracja agenta

- Od Prompt Engineering do Context Engineering
- CLAUDE.md i AGENTS.md — instrukcje dla agenta na poziomie projektu i globalnym
- Struktura kontekstu: system prompt, pliki konfiguracyjne, pamięć
- Path-based rules vs nested CLAUDE.md: różne zasady dla różnych folderów
- Praktyka: tworzenie CLAUDE.md i AGENTS.md dla naszego projektu
- Best practices: co wpisywać, czego unikać (max 200 lini), jak iterować

**Cel:** Skonfigurowany agent z jasnymi instrukcjami i zasadami pracy

#### Moduł 1.4: Projekt — AI Chat z Vercel AI SDK

- Omówienie projektu: prosty AI Chat (Backend + Frontend)
- Przygotowanie PRD (Product Requirements Document)
- Architektura: TypeScript, Vercel AI SDK (BE + FE), streaming
- Przygotowanie ADR (Architecture Decision Records)
- Agent inicjalizuje template projektu z Vercel AI

**Cel:** Plan aplikacji AI Chat (funkcjonalny i techniczny)

#### Praca domowa (Dzień 1)

- Dokończenie scaffoldingu jeśli nie ukończony
- Rozbudowa CLAUDE.md o preferencje i konwencje projektowe
- Eksperymentowanie z trybami Claude Code (CLI, Desktop, Web)

### Dzień 2: Narzędzia, sub-agenci i budowa funkcjonalności

**Temat przewodni:** Deleguj pracę do zespołu agentów AI

#### Moduł 2.1: MCP — Model Context Protocol

- Czym jest MCP i dlaczego coraz częściej używamy Skills zamiast MCP
- Konfiguracja MCP Servers w Claude Code (.mcp.json, settings)
- Context7 MCP — pobieranie aktualnej dokumentacji (zamiast halucynacji)
- Playwright MCP — automatyzacja przeglądarki, analiza stron, E2E
- Inne przydatne serwery MCP (GitHub, filesystem, custom)
- Praktyka: stworzenie Design Guidelines na podstawie dowolnej strony z Playwright MCP

**Cel:** Agent z dostępem do aktualnej dokumentacji i przeglądarki

#### Moduł 2.2: Skills - dawanie umiejętności i workflow

- Skills — reużywalne umiejętności dla agentów
- Instalowanie istniejących skills jako bazowych template do dalszego rozwoju
- Tworzenie własnych skills w oparciu o historię sesji i nasz workflow
- Dodawanie skryptów i narzędzi (np. bash, CLI, MCP) w ramach skills
- Custom slash commands

**Cel:** Skonfigurowane narzędzia i workflows dla agentów

#### Moduł 2.3: Sub-agenci — delegowanie zadań

- Architektura sub-agentów w Claude Code: Task tool, agent types
- Jak Claude Code orkiestruje sub-agentów (główny agent kontroluje)
- Typy sub-agentów: Explore, Plan, custom (np. BE dev, FE dev, QA)
- Konfiguracja sub-agentów, pamięć i zasad pracy zespołowej
- Praktyka: definiowanie specjalistów dla naszego projektu
    - be-developer — backend TypeScript
    - fe-developer — frontend React/Vercel AI SDK
    - qa-engineer — testy i jakość
- Delegowanie pierwszych zadań do sub-agentów
- Monitorowanie i feedback: jak kontrolować jakość pracy sub-agentów

**Cel:** Skonfigurowany zespół sub-agentów, pierwsze delegowane zadania

#### Moduł 2.4: Rozpoczęcie budowy aplikacji z sub-agentami

- TDD z agentem: Red → Green → Refactor
- Agent pisze testy PRZED kodem produkcyjnym
- Implementacja API backendu (streaming, Vercel AI SDK)
- React + Vercel AI SDK: useChat, streaming, komponenty
- Integracja frontend ↔ backend
    - Sub-agent be-developer buduje endpoint chat
    - Sub-agent fe-developer buduje UI czatu
    - Sub-agent qa robi Code Review i testy E2E wygenerowanego kodu
- Git: granularne commity po każdej zielonej fazie

**Cel:** Wstępny kod aplikacji zbudowany przez wielu agentów

#### Praca domowa (Dzień 2)

- Dokończenie podstawowej aplikacji jeśli czas lub limity Claude nie pozwoliły na szkoleniu
- Dla chętnych: rozbudowa aplikacji (np. historia czatów, markdown rendering)
- Eksperymentowanie z delegowaniem zadań do sub-agentów
- Optymalizacja CLAUDE.md i AGENTS.md na podstawie doświadczeń z dnia

### Dzień 3: Zespoły agentów, jakość i produkcja

**Temat przewodni:** Orkiestruj zespół agentów i przygotuj projekt na produkcję

#### Moduł 3.1: Agent Teams — praca równoległa

- Od sub-agentów do zespołów: orkiestracja wielu agentów
- Git Worktrees: izolowane środowiska dla równoległej pracy agentów
- Task Plan Matrix: planowanie zależności, fazy, briefing agentów
- Praktyka: rozdzielenie zadań między agentów pracujących równolegle
    - Agent 1: nowa funkcjonalność backendu (w worktree)
    - Agent 2: nowa funkcjonalność frontendu (w worktree)
    - Agent 3: testy E2E (w worktree)
- Merge i rozwiązywanie konfliktów

**Cel:** Dokończenie aplikacji z wieloma agentami równolegle, merge wyników

#### Moduł 3.2: Testowanie i jakość z AI

- Agent self-assessment: feedback loop z TDD (unit, integration)
- Sub-agent qa-engineer: generowanie testów E2E (skill) i testy manualne (MCP)
- Playwright MCP do testów manualnych (automatyzacja przeglądarki)
- Code review z agentem: security, jakość, best practices
- Ograniczenia i konieczność ludzkiego przeglądu

**Cel:** Zestaw testów pokrywający kluczowe funkcjonalności, code review

#### Moduł 3.3: Claude w chmurze i podstawy CI/CD

- Claude Web z remote environments: agent pracujący w chmurze
- Konfiguracja środowiska w chmurze (secrets, starting script, GitHub integration)
- Headless mode w CI/CD: Claude Code bez interakcji (-p) w GitHub Actions
- Koszty i optymalizacja: tokeny, modele, cache

**Cel:** Zrozumienie pracy agenta w chmurze, Claude Web vs CI/CD

#### Moduł 3.4: Podsumowanie i dalsze kroki

- Demo: przegląd projektów uczestników
- Retrospektywa: co zadziałało, co wymaga poprawy
- Best practices pracy z Claude Code w zespole
- Zaawansowane tematy na przyszłość, modele lokalne (np. Gemma 4)
- Zasoby do dalszej nauki i rozwoju

**Cel:** Utrwalenie wiedzy, gotowość do samodzielnej pracy z Claude Code
