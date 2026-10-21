# Podsumowanie - dzień 3, 21 października 2026

Źródła: automatyczne podsumowanie spotkania Zoom (AI Companion), skorygowane i zanonimizowane, oraz [historia czatu](day-3-chat-history.md). Uczestników oznaczono inicjałami, trener zachowuje publiczne przypisanie: Łukasz Matuszewski. Godziny w czasie polskim.

## Szybkie podsumowanie

Spotkanie dotyczyło szkolenia technicznego prowadzonego przez Łukasza Matuszewskiego na temat wykorzystania agentów i narzędzi sztucznej inteligencji do tworzenia oprogramowania. Łukasz Matuszewski zademonstrował wtyczkę Playwright do obsługi przeglądarki, omówił wykorzystanie Open Routera oraz modeli Opus i Haiku, a także wyjaśnił znaczenie tworzenia specyfikacji nietechnicznych i technicznych (PRD i ADR) dla kierowania agentami. Pokazał, jak używać maszyn wirtualnych do testowania, jak ważne jest regularne tworzenie kopii zapasowych (Restic i Timeshift) oraz jak zarządzać sesjami agentów, w tym za pomocą poleceń `/fork` i `/rewind`. Sesja dotyczyła tworzenia i delegowania zadań podagentom, wykorzystania agenta wiodącego do koordynowania pracy oraz znaczenia testowania i ręcznej weryfikacji. Omówiono również wykorzystanie skills i reguł do kierowania zachowaniem agentów, rolę optymalizacji kontekstu i tokenów oraz potencjał wykorzystania agentów w procesach CI/CD. Rozmowa zakończyła się dyskusją na temat praktycznego zastosowania tych narzędzi w rzeczywistych projektach, w tym rozważań dotyczących mikrousług oraz wykorzystania wyspecjalizowanych modeli do analizy logów.

## Kolejne kroki

### Łukasz Matuszewski

- Wyślij link do promptu używanego w projekcie uczestnikom.
- Wyślij uczestnikom wtyczkę Playwright do przeglądarki.
- Wyślij narzędzia używane do tworzenia kopii zapasowych (Restic i Timeshift) uczestnikom.
- Wyślij przykładowy prompt dla ADR (TypeScript z Vercel AI SDK) do uczestników.
- Wyślij link do omawianych przykładów i technologii ADR.
- Wyślij plik PDF ze szczegółami dostępu do maszyn wirtualnych na czat.
- Wyślij uczestnikom instrukcje dotyczące tworzenia planu.
- Wyślij link do materiałów szkoleniowych i repozytorium zawierającego przykłady oraz dokumentację.
- Wyślij link do przykładowej linii statusu (`statusline.sh`).
- Wyślij link do folderu przykładów CI/CD.
- Wyślij link do frameworków opartych na specyfikacjach (np. Spec Kit).
- Wyślij link do czatu w celu uzyskania dalszych pytań.

### Współpraca

- Uczestnicy: wypełnij ankietę szkoleniową ([ankiety.jsystems.pl](https://ankiety.jsystems.pl/)) przy użyciu identyfikatora podanego w pliku PDF.
- Uczestnicy: uruchom agentów i plan stworzony podczas szkolenia.
- Uczestnicy: utwórz nową sesję dla fazy realizacji planu.
- Uczestnicy: skonfiguruj linię statusu dla Claude'a zgodnie z pokazem.
- Uczestnicy: przejrzyj dokumenty PRD i ADR i upewnij się, że są one źródłem prawdy dla projektu.
- Uczestnicy: skorzystaj z dostarczonej listy kontrolnej, aby poprowadzić konfigurację projektu i agenta.

## Podsumowanie

### Maszyny wirtualne do tworzenia aplikacji

Łukasz Matuszewski poprowadził dyskusję na temat wykorzystania maszyn wirtualnych i agentów do tworzenia aplikacji, podkreślając znaczenie dokumentacji i wymagań technicznych (ADR) dla kierowania procesem. Zalecił użycie konkretnych narzędzi, takich jak wtyczka Playwright do obsługi przeglądarki oraz Restic i Timeshift do tworzenia kopii zapasowych danych, a także udostępnianie zasobów i przykładów, aby pomóc zespołowi skutecznie wdrożyć te praktyki. Podczas sesji omówiono sposób pracy z agentami, w tym polecenia `/fork` (kopia sesji) i `/rewind` (edycja poprzednich promptów), a Łukasz Matuszewski zachęcił zespół do przetestowania i optymalizacji swoich podejść przy użyciu maszyn wirtualnych przed pełnym wdrożeniem. Udostępniono też przykładowe prompty [PRD](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/Prompt%20examples/PRD-electronics-returns-complains-app.md), [ADR](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/Prompt%20examples/ADR-generation-typescript-vercel-ai-sdk.md) i [planu z mapą zależności subagentów](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/Prompt%20examples/Plan-SubAgents-matrix-dependency-map.md).

### Integracja modeli i delegowanie zadań

Omówiono wykorzystanie różnych modeli i narzędzi do różnych zadań, podkreślając znaczenie wykorzystania najlepszego dostępnego modelu, w szczególności Opusa, dla większości zadań. Doradzano poszukiwanie szablonów i platform usprawniających rozwój oraz zaproponowano wykorzystanie Open Routera do integracji. Ł.N. pytał o delegowanie zadań różnym modelom i sugerował przegląd modeli lub procesów pod kątem zgodności. Łukasz Matuszewski planował wdrożyć umiejętność delegowania zadań do innego modelu i wspominał o aktualizacji podsumowań po szkoleniu. Rozmawiano też o doborze szablonu aplikacji z Next.js i AI SDK oraz o modelach mowy na tekst po polsku ([materiał](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/Research/speech-to-text-models-polish-handy.md), rekomendacja NVIDIA Canary 1B v2).

### Delegowanie zadań i zarządzanie agentami

Dyskusja dotyczyła wdrożenia delegowania zadań z wykorzystaniem podagentów oraz procesu weryfikacji spójności kodu. Łukasz Matuszewski wyjaśnił, jak podzielić realizację zadania na podzadania i delegować je podagentom przy użyciu Opusa, przedstawiając konkretny przykład weryfikacji zgodności dokumentów ADR względem PRD i instrukcji projektu z priorytetami od P1 do P5. Zademonstrował proces tworzenia i zarządzania podagentami, w tym wykorzystanie narzędzi takich jak Git i polecenia terminalowe dla lepszej wydajności. Omówiono również korzyści i wyzwania związane z używaniem agentów niestandardowych w porównaniu z wbudowanymi narzędziami, takimi jak Copilot, oraz rozważano optymalizację przepływu pracy poprzez tworzenie agentów na bieżąco zamiast wstępnego definiowania ich w folderach.

### Plan wdrożenia agenta

Zespół omówił wdrożenie planu agentów, przy czym Łukasz Matuszewski podkreślił znaczenie ustalania limitów połączeń dla MVP ze względu na względy kosztowe i zalecił stosowanie mniejszych, tańszych modeli, takich jak Haiku, do konkretnych zadań. Wyjaśnił, że agentom należy dostarczać wyłącznie istotne informacje i dokumenty niezbędne do wykonywania ich konkretnych zadań, a nie przytłaczać ich niepotrzebnymi szczegółami, oraz że główny agent orkiestrujący powinien zarządzać podagentami i podejmować kluczowe decyzje. Dyskusja dotyczyła również potrzeby odniesienia się w planie do odpowiednich fragmentów plików PRD i ADR przy jednoczesnym unikaniu niepotrzebnego powielania informacji oraz znaczenia wykorzystywania plików tymczasowych do przechowywania szczegółowych informacji dla podagentów, gdy jest to konieczne. Udostępniono przykładowe polecenie `/goal` dla agenta orkiestrującego.

### Omówienie planu wdrożenia

Łukasz Matuszewski omówił wdrożenie planu z konkretną specyfikacją, w tym delegowanie agentów do usług i zarządzanie procesem. Rozwiązano problemy związane ze starszym kodem, wykorzystaniem tokenów oraz wyzwaniami związanymi z pisaniem i testowaniem kodu, szczególnie w przypadku starszych projektów. Zespół zgodził się na stworzenie szczegółowego planu podczas nowej sesji, w tym harmonogramów, adresów i niezbędnej dokumentacji, przy jednoczesnym zapewnieniu, że wszyscy agenci pracują w tej samej gałęzi, aby uniknąć konfliktów. Łukasz Matuszewski wspomniał również o znaczeniu stosowania odpowiednich narzędzi i praktyk, takich jak zmienne środowiskowe i klucze produkcyjne, oraz obiecał przesłać poprawki do planu do przeglądu.

### Konfiguracja klucza Open Router

Omówiono implementację klucza Open Router oraz rozwiano obawy dotyczące jego dodania do systemu. Wyjaśniono proces tworzenia i konfiguracji klucza w zmiennych środowiskowych, podkreślając znaczenie kontroli jakości na każdym etapie wdrożenia. Łukasz Matuszewski podkreślił również korzyści płynące z wykorzystania drzew decyzyjnych i diagramów dla lepszego zrozumienia i planowania procesów, zwłaszcza w przypadku złożonych projektów. Podkreślono potrzebę dokumentowania instrukcji w sposób jasny i oddzielny od kodu, aby uniknąć nieporozumień i zapewnić prawidłowe wykorzystanie agentów i narzędzi.

### Wdrożenie agenta Claude

Zespół omówił wdrożenie i rozwiązywanie problemów z agentem Claude, koncentrując się na konfiguracji linii statusu i uprawnień. Natknęli się na pewne problemy techniczne z terminalem, które wymagały ponownego uruchomienia sesji, ale pomyślnie skonfigurowali linię statusu za pomocą instrukcji z repozytorium materiałów szkoleniowych ([statusline.sh](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/agent-configs/claude/statusline.sh)). Dyskusja obejmowała różne aspekty wdrożenia, w tym limity tokenów, tryb zatwierdzania i kwestie bezpieczeństwa, a zespół zauważył, że chociaż sandbox zapewnia dodatkowe bezpieczeństwo, nie jest to idealne rozwiązanie ze względu na ograniczenia dotyczące opuszczania środowiska.

### Przerwa i późny przyjazd

Spotkanie miało przerwy do 12:05 i do 14:40. Po drugiej przerwie uczestnicy wrócili i powitali spóźnione przybycie A., która doświadczyła opóźnień związanych z pracą. Łukasz Matuszewski podsumował dla niej najważniejsze informacje ze szkolenia i podał przykłady dla Codex.

### Aktualizacje materiałów szkoleniowych

Łukasz Matuszewski omówił implementację materiałów szkoleniowych i aktualizacji kodu w repozytorium, podkreślając znaczenie użycia przykładowej linii statusu dla Claude'a w pliku `statusline.sh`. Wyjaśnił proces ustawiania tej linii statusu dla całego użytkownika i dodawania jej do ustawień JSON Claude'a. Podkreślił również potrzebę aktualizacji agentów i usuwania niepotrzebnych instrukcji z plików w celu poprawy jakości i wydajności kodu. Dyskusja dotyczyła znaczenia jasnej dokumentacji, w tym opisów projektu i zamierzonych użytkowników, aby pomóc agentom podejmować lepsze decyzje.

### Wdrożenie i optymalizacja narzędzi agentów

Łukasz Matuszewski omówił implementację i optymalizację narzędzi agentowych, koncentrując się na recenzjach kodu, zarządzaniu tokenami oraz ustawieniach konfiguracyjnych. Udostępnił różne zasoby i konfiguracje do pracy z agentami Claude'a, w tym ustawienia optymalizacji tokenów i procesów CI/CD. Sesja obejmowała demonstrację sposobu skonfigurowania dostępu do GitHub przy użyciu osobistych tokenów dostępowych oraz omawiała znaczenie efektywnego zarządzania tokenami w celu obniżenia kosztów. Udostępniono materiały takie jak [notatki kursowe](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/blob/main/course-materials/Course%20Notes%20-%20AI%20in%20Programming.md), [skill do obsługi uwag z code review](https://github.com/EdukeyTeam/agent-toolbox/tree/main/skills/respond-to-code-review), [skill do pisania AGENTS.md](https://github.com/EdukeyTeam/agent-toolbox/tree/main/skills/write-agents-md), [listę kontrolną harness](https://devpowers.com/szkolenia/jsystems/claude-code-2026-10/checklisty.html#harness), [przykłady CI/CD](https://github.com/LucasMatuszewski/jsystems-claude-code-2026-10/tree/main/course-materials/cicd-headless) oraz narzędzia takie jak [lazygit](https://github.com/jesseduffield/lazygit) i [git delta](https://github.com/dandavison/delta). Przypomniano uczestnikom o wypełnieniu ankiety po szkoleniu.

### Mikrousługi i zarządzanie agentami

T. pytał o zarządzanie zmianami w wielu mikrousługach w konfiguracji wielorepozytoryjnej, a Łukasz Matuszewski zasugerował użycie agentów z narzędziami takimi jak Nx dla środowisk monorepo i polecił różne narzędzia, takie jak Repo Map i Repromix, do lepszego zarządzania bazą kodu. Dostarczył wskazówek dotyczących rozpoczęcia pracy z agentami, w tym sprawdzania uprawnień, reguł i instalowania niezbędnych narzędzi, a także zasugerował stworzenie nowej umiejętności w celu usprawnienia procesu planowania na podstawie doświadczeń zdobytych podczas sesji.

Ł. pytał o wykorzystanie agentów do autonomicznej analizy logów na dużą skalę w środowiskach chmurowych, a Łukasz Matuszewski zalecił zbadanie istniejących narzędzi, takich jak Hermes, i zaproponował zastosowanie wyspecjalizowanych modeli do analizy logów, zauważając potencjalne korzyści kosztowe i wydajnościowe takiego podejścia.
