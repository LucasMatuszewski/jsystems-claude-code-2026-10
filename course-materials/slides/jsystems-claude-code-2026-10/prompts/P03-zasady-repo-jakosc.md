Sprawdź to repozytorium i zaproponuj zwięzłe instrukcje projektowe dla Claude Code. Ustalaj tylko reguły uzasadnione rzeczywistym szkieletem AI Chat; nie przenoś języka, runnera testów, menedżera pakietów, ścieżek ustawień ani składni innego narzędzia bez sprawdzenia. TypeScript, Vercel AI SDK, React useChat i streaming są ramami kursu, a szczegóły architektury wynikają z ADR.

Jeśli istnieje `course-materials/`, traktuj go jako nieaktywną bibliotekę dydaktyczną. Agent aplikacji nie może sam jej przeszukiwać ani odczytywać, chyba że użytkownik wskaże konkretny materiał do bieżącego zadania. Przykładowe PRD i ADR nie są wymaganiami ani decyzjami tej aplikacji. Zapisz tę granicę w głównych instrukcjach oraz aktywnym pliku dla narzędzia, zachowując możliwość jawnie zleconej pracy nad materiałami.

Najpierw opisz faktyczną strukturę repozytorium i sprawdzone polecenia. Wskaż, które dokumenty zawierają wymagania produktu, decyzje architektoniczne, polityki, testy i syntetyczne dane. Rozróżnij dokumenty już istniejące od wyników przyszłych ćwiczeń. Wskaż katalogi generowane, sekrety i dane, które nie mogą trafić do Git. Jeśli polecenie nie działa w tym środowisku, przytocz dokładny błąd i nie przedstawiaj go jako sprawdzonego.

Zaproponuj krótkie instrukcje obejmujące:

1. Cel AI Chat, dokumenty rozstrzygające zachowanie i granice kodu aplikacji względem materiałów kursowych. Gdy PRD lub ADR nie powstały, wskaż tę zależność zamiast je zastępować.
2. Polecenia szybkiego testu, pełnej weryfikacji, lint/typecheck i uruchomienia aplikacji, wyłącznie na podstawie tego projektu. Nie wymyślaj nazw skryptów ani gotowego wyniku.
3. Zakres zadania: istotne źródła, mały plan, jedno kryterium akceptacji, przegląd diffu. Bramka przed commitem wymaga właściwych testów i kontroli typów, właściwych plików oraz rozwiązania błędów. Staging obejmuje jawne ścieżki; bez `git add -A`, `git add .` i `git commit -a`.
4. Testowanie zachowania według specyfikacji: najpierw test, jego oczekiwana porażka, minimalna implementacja, ponowny test i refaktoryzacja przy zielonej weryfikacji. Osobno zapisuj uruchomienie aplikacji oraz kontrolę UI/API. Nie osłabiaj asercji, aby ukryć defekt.
5. Wywołania modelu: unit może zastępować zależności, integration zastępuje tylko zewnętrzny LLM, E2E działa na rzeczywistym stosie. Przed utworzeniem mocka uzyskaj bezpieczny capture aktualnego kontraktu w autoryzowanym środowisku. Nie ujawniaj wartości sekretów ani danych uczestników i klientów.
6. Warunki zatrzymujące ukończenie: nieprzechodzące wymagane testy, nieprzejrzany diff, niesprawdzone twierdzenie, pliki prywatne lub wygenerowane, zmiana poza przyjętym zakresem. Agent zgłasza dokładny brak zamiast uznać zadanie za zakończone.

Jeżeli frontend i backend mają rzeczywiście odmienne konwencje lub polecenia, zaproponuj niewielkie instrukcje lokalne. Wspólne reguły zachowaj w AGENTS.md, a w CLAUDE.md użyj jawnego importu `@AGENTS.md`. Claude Code nie ładuje automatycznie samego AGENTS.md jako pamięci. Dla reguł ścieżek porównaj `.claude/rules/*.md` z `paths` i zagnieżdżony CLAUDE.md; nie kopiuj bez namysłu przepisu na symlink z innego narzędzia.

Kontekst AI Chat: kontrakt endpointu i streamingu ustalamy przed równoległą pracą. Role to `be-developer`, `fe-developer` oraz `qa-engineer`; uczestnik definiuje je w module 2.3. Przykłady w `course-materials/agent-configs/claude/` są nieaktywne. Wskaż właściciela wspólnego kontraktu i lockfile. QA może przygotować scenariusze równolegle, lecz E2E uruchamia po integracji. Nie zakładaj autoryzacji ani bazy historii, jeśli PRD ich nie wymaga.

Zwróć pełną proponowaną treść plików, sprawdzone polecenia i wyniki oraz przykład zadania uruchamiającego bramkę jakości. Nie zmieniaj ustawień globalnych i nie instaluj narzędzi w ramach tego zadania. Wyjaśnij każdą regułę, dla której nie znalazłeś źródła, zamiast przedstawiać preferencję jako fakt projektu.
