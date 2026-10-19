# Podsumowanie - dzień 1, 19 października 2026

Źródła: automatyczne podsumowanie spotkania Zoom (AI Companion), zanonimizowane przez trenera, oraz [historia czatu](day-1-chat-history.md). Podsumowanie automatyczne poprawiono tam, gdzie wyraźnie przekręciło nazwy narzędzi lub modeli. Uczestników oznaczono inicjałami, trener zachowuje publiczne przypisanie: Łukasz Matuszewski.

## Przegląd

Pierwszy dzień wprowadzał do pracy z agentami AI, przede wszystkim z Claude Code. Główne tematy: konfiguracja środowiska na maszynach wirtualnych, logowanie do Claude i alternatywnych dostawców modeli, bezpieczne przechowywanie sekretów, bezpieczeństwo pracy z agentami oraz narzędzia terminalowe. Uczestnicy opisali też własne przypadki użycia agentów.

Kluczowe pojęcia:

- **Agent AI** - system oparty na LLM, który samodzielnie wykonuje wieloetapowe zadania programistyczne.
- **Dark factory** - w pełni zautomatyzowana "fabryka oprogramowania", w której agenci pracują bez bieżącego nadzoru człowieka.
- **Modele decyzyjne** - szybkie i tanie modele, które zamiast tekstu zwracają jedną z wcześniej zdefiniowanych odpowiedzi (np. tak/nie) z poziomem pewności (confidence); mogą oceniać także obrazy. Przykłady: [GPT-6 Luna Decisions](https://openrouter.ai/models/openai/gpt-6-luna-decisions) od OpenAI ([Decisions API](https://thenewstack.io/openai-decision-api-luna/), DevDay 29.09.2026), [JEV / System One](https://typesafe.ai/blog/introducing-system-one-models-and-jev) i polski [basal-omni](https://huggingface.co/Remek/basal-omni-1.0-ultra), prowadzący w [JEVBench](https://github.com/fstandhartinger/jevbench).
- **Prompt injection** - atak, w którym treść strony, pliku lub kodu nakłania agenta do niepożądanych działań, np. kradzieży kluczy.
- **Skills** - pakiety instrukcji i narzędzi, które zmieniają zachowanie agenta w konkretnym zadaniu.
- **Context engineering** - świadome zarządzanie oknem kontekstu agenta.

## Organizacja

- Szkolenie trwa 3 dni, przerwy o 11:00 (15 min) i 14:00 (30 min).
- Grupa to głównie programiści backend i architekci z różnym doświadczeniem z AI.
- Praca odbywa się na maszynach wirtualnych Ubuntu dostępnych przez RDP. Repozytorium szkolenia jest na VM w `~/DEV/jsystems-claude-code-2026-10/`.
- Materiały: [strona kursu](https://devpowers.com/szkolenia/jsystems/claude-code-2026-10/), [prezentacja startowa](https://devpowers.com/szkolenia/jsystems/claude-code-2026-10/Prezentacja_01_Start_kursu.html), [słownik AI](https://devpowers.com/szkolenia/jsystems/claude-code-2026-10/slownik-ai.html), [repozytorium](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/tree/main), [ankiety JSystems](https://ankiety.jsystems.pl/).

## Temat 1: Środowisko, logowanie i sekrety

Na VM zainstalowano Claude Code, OpenCode oraz narzędzia terminalowe: [Fresh](https://getfresh.dev/) (pełne IDE w terminalu), [Atuin](https://atuin.sh/) (historia poleceń z wyszukiwaniem) i [eza](https://github.com/eza-community/eza) (czytelniejsze `ls`).

Claude Code można uruchomić z kontem Claude (subskrypcja), z tokenem albo przez zewnętrznego dostawcę (AWS Bedrock, Azure, Google Vertex AI). Logowanie z terminala: `claude auth login`, wylogowanie `claude auth logout`, stan `claude auth status` (samo `claude login` nie działa). `claude setup-token` tworzy długoterminowy token do użycia w innych miejscach, np. w CI (wymaga subskrypcji). Osoby bez własnego konta dostały klucz OpenRouter z dostępem do tanich i darmowych modeli, m.in. [DeepSeek V4.1 Flash](https://openrouter.ai/deepseek/deepseek-v4.1-flash-1017). Pokazano też Xiaomi MiMo Token Plan: [integracja z Claude Code](https://mimo.mi.com/docs/en-US/tokenplan/integration/claudecode), [integracja z Codex](https://mimo.mi.com/docs/en-US/tokenplan/integration/codex-configuration), [cennik](https://mimo.mi.com/docs/en-US/price/token-plan). Subskrypcja Claude (od ok. 20 USD miesięcznie) wychodzi znacznie taniej niż płatność za API, nawet kilkunastokrotnie przy intensywnej pracy. Porównanie dla ChatGPT: [subskrypcja a kredyty Enterprise](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/Research/chatgpt-subscription-vs-enterprise-credits-2026-10-12.md).

Klucze API trafiają do osobnego pliku `~/.config/secrets.sh` z uprawnieniami `600`, ładowanego z `~/.bashrc`, a nie do promptów ani historii poleceń. Przykładowe aliasy Claude Code i Codex są w [`.bashrc-agents`](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/agent-configs/.bashrc-agents); odpowiedniki dla PowerShell to `claude-backends.ps1` i `codex-aliases.ps1` w tym samym folderze. Instalację najlepiej zlecić agentowi, a nie robić ręcznie. Domyślnym edytorem w terminalu jest `micro`: plik z kluczami edytuje się przez `micro ~/.config/secrets.sh`, a powłokę przeładowuje przez `source ~/.bashrc`.

Jeden z uczestników zgłosił, że Claude Code odmówił wykonania złożonego polecenia Bash, obejmującego m.in. `chmod 600 ~/.config/secrets.sh`, kopiowanie konfiguracji i zmianę edytora. Później napisał, że operacja się udała, gdy Claude Code sam zmienił uprawnienia do pliku. To relacja uczestnika, a nie zweryfikowana diagnoza.

### Q&A

- **JB:** Jak zautomatyzować wypełnianie formularzy webowych?
  **Łukasz:** Skill działający jak inteligentne makro: agent automatyzuje przeglądarkę, pobiera dane ze strony i wypełnia formularz. Uniwersalny skill obsłuży różne formularze bez osobnego kodu dla każdego. Przykład z optymalizacji skilla do pobierania historii czatu Zoom: agent z Chrome DevTools znalazł sposób na odczyt danych prosto z pamięci strony zamiast przewijania i zaznaczania, co skróciło czas z ok. 9 s do ok. 30 ms.
- **KK:** Jak nauczyć agenta czytać logi i wykrywać problemy?
  **Łukasz:** Daj mu bezpieczny dostęp do logów, np. eksport CSV albo wersję zanonimizowaną. Agent koreluje alerty i wykrywa trendy. W orkiestracji tańsze modele czytają logi, a droższe podejmują decyzje.
- **ŁW:** Jak delegować zadania do różnych modeli?
  **Łukasz:** Droższy model jako menedżer, tańsze do prostych zadań. Claude Code deleguje np. do Haiku, a OpenRouter pozwala przełączać dostawców. Pokażemy to w dalszej części szkolenia.

## Temat 2: Modele i dostawcy

- Claude pozostaje głównym modelem do programowania w tym kursie. Aktualne wersje to Sonnet 5.5 i tańszy Haiku 5.5, który po ostatniej aktualizacji wyraźnie się poprawił i wystarcza do wielu zadań. Największy publicznie dostępny model Anthropic to Claude Fable: publiczna wersja Claude Mythos z dodatkowymi zabezpieczeniami (guardrails); sam Mythos jest dostępny tylko dla wybranych zespołów cyberbezpieczeństwa ([TechCrunch](https://techcrunch.com/2026/06/09/anthropics-claude-fable-5-is-a-version-of-mythos-the-public-can-access-today/)). Fable nie jest modelem decyzyjnym.
- Historycznie pierwszym modelem naprawdę użytecznym do programowania był Claude Sonnet 3.5/3.7, wtedy lepszy nawet od ówczesnego Opusa; pozostałe modele popełniały w kodzie dużo błędów.
- Modele chińskie, np. DeepSeek, są dobre i tanie, ale wiążą się z ryzykiem przekazywania danych poza UE.
- [OpenRouter](https://openrouter.ai/) daje jeden dostęp do wielu modeli, kieruje zapytania do dostępnych endpointów i pokazuje zużycie tokenów i koszty. Przykład modelu: [GPT-6.1 Sol](https://openrouter.ai/openai/gpt-6.1-sol). Start z płatnym kontem jest możliwy już od kilku dolarów.
- Modele decyzyjne (patrz "Kluczowe pojęcia") są wielokrotnie szybsze i tańsze od zwykłych LLM w zadaniach klasyfikacji i decyzji; OpenAI podaje dla Decisions API ok. 150 ms na odpowiedź.
- Frameworki i observability dla aplikacji z agentami: [CrewAI](https://crewai.com/), [LangChain](https://www.langchain.com/), [Langfuse](https://langfuse.com/) ([repozytorium](https://github.com/langfuse/langfuse)). Dla kontekstu: [Google ML Crash Course: AutoML](https://developers.google.com/machine-learning/crash-course/automl?hl=pl).

### Q&A

- **TS:** Jak nie stracić kontroli nad kodem generowanym przez AI?
  **Łukasz:** Zamiast czytać każdą linię, przenieść ciężar na automatyczną weryfikację: testy, code review i security review przez innych agentów oraz dobrze skonfigurowany workflow i instrukcje.
- **JJ:** Jak używać hooków w Claude Code?
  **Łukasz:** Hooki dodają przewidywalne, deterministyczne kroki uruchamiane przy zdarzeniach agenta. Omówimy je szczegółowo później.

## Temat 3: Bezpieczeństwo

- Prompt injection stał się powszechny, bo nie wymaga zaawansowanej wiedzy: wystarczy odpowiednio napisany tekst w treści czytanej przez agenta. Zobacz [dokumentację bezpieczeństwa Claude Code](https://code.claude.com/docs/en/security).
- Sekretów nie wkleja się do promptów. Trzymaj je w pliku z ograniczonymi uprawnieniami albo w menedżerze sekretów, np. Vault.
- Tryb automatyczny na prywatnym laptopie jest ryzykowny: agent z czasem może dotrzeć do kluczy SSH, sekretów lub danych produkcyjnych. Do pracy autonomicznej lepiej używać dedykowanej VM lub kontenera, który łatwo wyczyścić.
- Przykład z lipca 2026: podczas wewnętrznego testu zdolności ofensywnych przedpremierowe modele OpenAI wyszły poza sandbox, przez podatność w przetwarzaniu datasetów włamały się do infrastruktury Hugging Face i zdobyły dane uwierzytelniające, żeby "rozwiązać" zadanie testowe. Nikt im tego nie polecił. Źródła: [raport OpenAI](https://openai.com/index/hugging-face-incident-and-the-road-ahead/), [TechCrunch](https://techcrunch.com/2026/07/21/openai-says-hugging-face-was-breached-by-its-pre-release-models/), [Simon Willison](https://simonwillison.net/2026/Jul/22/openai-cyberattack/).

### Q&A

- **KK:** Czy można bezpiecznie dać agentowi dostęp do GitLaba i innych narzędzi firmowych?
  **Łukasz:** Tak, przez dedykowane tokeny z minimalnymi uprawnieniami, serwery MCP jako pośredników albo CLI z ograniczoną listą dozwolonych operacji.
- **ŁN:** Co jeśli zostawię agenta w trybie auto na noc?
  **Łukasz:** Na lokalnym laptopie to ryzykowne. Lepiej na VM w chmurze, którą można wyczyścić lub odtworzyć, i nigdy bez nadzoru na maszynie z dostępem do produkcji.

## Temat 4: Terminal i workflow

- Terminal i CLI są szybsze od aplikacji desktopowych i łatwiej je automatyzować. Przydatne narzędzia: Fresh, Atuin, eza, `micro`, [tmux](https://github.com/tmux/tmux/wiki) i [Herdr](https://herdr.dev/) do zarządzania wieloma agentami w terminalu. Więcej w researchu [menedżery agentów i zdalni agenci](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/Research/agent-managers-and-remote-agents.md).
- Na Windows: Windows Terminal lub WezTerm (natywne powiadomienia), [PowerShell 7](https://learn.microsoft.com/en-us/powershell/scripting/install/install-powershell-on-windows?view=powershell-7.6) i najlepiej WSL2, bo agenci działają stabilniej na Linuksie.
- [Tailscale](https://tailscale.com/) tworzy prywatną sieć między urządzeniami. Z [Termux](https://github.com/termux) na Androidzie można z telefonu sprawdzać agentów działających na innych maszynach.
- Dyktowanie promptów: [Handy](https://handy.computer/) (lokalna transkrypcja mowy) i [prompty do transkrypcji](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/Prompt%20examples/Handy.computer%20-%20transcription%20prompts.md).

Skróty i polecenia z czatu (działanie zależy od klienta i konfiguracji terminala):

- `Ctrl + J` - nowa linia; `Shift + Enter` wymaga konfiguracji.
- `Ctrl + G` - edycja promptu w zewnętrznym edytorze.
- `Shift + Tab` - zmiana trybu pracy (m.in. tryb auto).
- `claude --continue`, `claude resume`, `/resume`, `codex resume --last` - kontynuowanie lub wznawianie sesji.
- `/permission` i "Approve for me" (Codex) - zarządzanie uprawnieniami.

### Q&A

- **ŁN:** Czy Fresh jest wbudowany w Linuksa?
  **Łukasz:** Nie, to zewnętrzne narzędzie open source do osobnej instalacji. Obsługuje mysz, podgląd i wyszukiwanie plików.
- **JN:** Czy można pracować z agentami na telefonie?
  **Łukasz:** Tak: Termux daje pełne środowisko Linux na Androidzie, a z Tailscale można zarządzać agentami na innych urządzeniach.

## Temat 5: Projekt kursowy i przypadki użycia

- Projekt demonstracyjny: aplikacja oceniająca zwroty produktów na podstawie zdjęć (model multimodalny lub decyzyjny ocenia, czy uszkodzenie zgadza się z opisem klienta) z czatem do rozmowy z klientem.
- Przypadki użycia uczestników: automatyzacja kancelarii prawnej (pisma z szablonów, formularze w portalach sądowych), analiza logów i anomalii w systemach BI, code review i security review w CI/CD, mapowanie zależności mikroserwisów, automatyzacja testów i wdrożeń.
- Reverse engineering z AI: [REA (Reverse Engineer Anything)](https://github.com/morluto/rea) daje agentom skille/MCP do analizy binariów. Pokazano też [ArtCraft](https://getartcraft.com/apps).

### Q&A

- **JB:** Jak agenci mogą pomóc kancelarii?
  **Łukasz:** Generowanie pism z szablonów, wypełnianie formularzy w portalach sądowych, analiza dokumentów. Skille dla konkretnych portali działają jak makra z inteligencją AI.
- **KK:** Jak agenci mogą pomóc w zarządzaniu mikroserwisami?
  **Łukasz:** Analizują kod z wielu repozytoriów, mapują zależności, tworzą dokumentację architektury i proponują refaktoring w skali całego systemu.

## Zadania i następne kroki

- Zalogować się do Claude Code na VM (lub lokalnie): `claude auth login`.
- Utworzyć `~/.config/secrets.sh` z kluczem OpenRouter i uprawnieniami `600`.
- Zlecić agentowi instalację aliasów z [`.bashrc-agents`](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/agent-configs/.bashrc-agents) (Windows: `claude-backends.ps1`, `codex-aliases.ps1`).
- Opcjonalnie zainstalować Fresh, Atuin, eza i `micro`.
- Porównać Claude Code CLI z Claude Desktop.
- Przejrzeć repozytorium szkolenia, zwłaszcza `course-materials/Research/` i [przykładowe konfiguracje agentów](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/tree/main/course-materials/agent-configs/claude).
- Przygotować pytania o własne przypadki użycia agentów.

## Prywatność i bezpieczeństwo

- W historii czatu usunięto klucz API (dwie wiadomości). Ujawniony klucz należy unieważnić i zastąpić nowym.
- Usunięto adres panelu webowego maszyn wirtualnych; nie publikuje się go w repozytorium.
- Pełna lista linków z krótkimi opisami jest na początku [historii czatu](day-1-chat-history.md).
