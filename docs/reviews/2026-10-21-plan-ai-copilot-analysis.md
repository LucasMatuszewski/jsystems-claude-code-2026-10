Mam dla Ciebie analizę z sugerowanymi zmianami oraz nowy skill `plan-ai-copilot`. Analizę oparłem na tej rozmowie i na commitach, które później poprawiały PRD i ADR. Te poprawki pokazują, czego zabrakło przy planowaniu.

## Błędy i co można było zrobić lepiej

**PRD (moja część)**
1. **PRD było wewnętrznie sprzeczne.** W §9.2 karta decyzji była na samej górze, a AC-24 zaczynało od powitania. W ADR trzeba to było rozstrzygać osobno.
2. **Zasada bezpieczeństwa nie działała dla zwrotów.** Instrukcja o spuchniętej baterii (§7) była tylko w regulaminie reklamacji, a AC-21 zabraniało dawać agentowi drugi regulamin. Przy zwrocie agent nie miałby skąd jej znać.
3. **Założenie przeczyło regule.** „Agent nigdy nie przelicza dat” kłóciło się z „data dostawy podana w czacie to nowa informacja”. Dopiero po przeglądzie ADR ustalono, że w takim przypadku sprawa trafia do weryfikacji przez człowieka.
4. **Zostawiłem otwarte pytanie, które blokowało ADR.** Chodzi o limit wiadomości w czacie. Trzeba było o to zapytać od razu.
5. **Wpisałem niezweryfikowany fakt jako pewny.** 14-dniowy termin odpowiedzi na reklamację trafił do regulaminu, choć potwierdzało go tylko źródło komercyjne. Ostrzegłem o tym w czacie, ale w dokumentach nie był oznaczony.
6. **Za łatwo przeszedłem nad sprzecznością co do użytkownika.** Brief mówił „dla pracowników”, a wybrana odpowiedź to „klient końcowy”. Powinienem był wprost zapytać, która wersja obowiązuje. Ta rozbieżność nadal jest w repo: `assets/example-images/README.md` pisze „pracownik wgrywa zdjęcie”.
7. **Nie zdefiniowałem strefy czasowej dla „dziś”.** ADR musiało dopisać interpretację według daty warszawskiej.
8. **Niespójny proces.** Nie commitowałem. PRD trafiło do historii później niż ADR. Sekcję o tonie poprawiałem dopiero po napisaniu.

**ADR i implementacja, czyli to, czego nie wyłapało planowanie**
- Parametry modelu nie zostały sprawdzone prawdziwym wywołaniem. Model rozumujący nie obsługuje `temperature`, przez co OpenRouter zwracał 404 dla każdego zapytania (D-AI9).
- Nie ustalono, który `.env` ładują aplikacja i testy. Ręczne `npm run start` w ogóle nie widziało głównego `.env`, a Playwright to ukrywał.
- ADR wspominało o Playwright MCP, a AGENTS.md wymaga CLI. Do tego pisało o testach na prawdziwym stacku jako „kosztownych”, więc agenci się przed nimi wahali.
- Podsumowania w ADR-000 rozjechały się z ADR-001…005 i trzeba było osobnego commita na synchronizację.
- Typowe pułapki przeglądarkowe nie były opisane. Przykład: `fetch` bez `this`, czyli błąd „Illegal invocation”.

## Sugerowane zmiany (nie wprowadzałem ich)

**Skill `write-prd`**
- Dodać krok „Stage 0”: sprawdzić `assets/` (w tym README zdjęć testowych) i porównać je z briefem.
- Dodać osobny przegląd spójności po napisaniu: §9 zgodne z AC, wejścia agenta pokrywają wszystkie jego reguły, założenia nie przeczą regułom.
- Wprowadzić zasadę: fakty niepotwierdzone źródłem pierwotnym oznaczać w dokumencie, a nie tylko w czacie.
- Pytania blokujące ADR (limity, timeouty) zamykać przed pisaniem.
- Po zapisaniu PRD commitować je zgodnie z AGENTS.md.
- Ograniczyć w PRD liczby techniczne, takie jak 1568 px czy obsługa kluczy API.

**Skill `write-adr`**
- Obowiązkowo sprawdzać możliwości modelu prawdziwym wywołaniem.
- Pytać o lokalizację `.env`.
- Definiować, co liczy się jako „pierwszy token” przy streamingu.
- Pilnować zgodności nazw narzędzi z AGENTS.md.
- Po napisaniu robić cross-review PRD i ADR z listą proponowanych poprawek PRD do akceptacji.

**PRD i repo**
- Ujednolicić personę: albo poprawić `assets/example-images/README.md`, albo zapisać w PRD §12, że README zostało z wcześniejszej koncepcji.
- 14-dniowy termin odpowiedzi na reklamację oznaczyć w `docs/policies/complaint-policy.md` jako do weryfikacji.
- Przenieść §7 (bezpieczeństwo) do wspólnego dokumentu, zamiast wyjątku w AC-21.

## Nowy skill: `plan-ai-copilot`

Wystarczy napisać na przykład `/plan-ai-copilot copilot do reklamacji ubezpieczeniowych`. Skill przeprowadza cały proces w etapach i zatrzymuje się po każdym, czekając na Twoją zgodę:

0. Sprawdza repo: git, `assets/`, zdjęcia testowe i ich README.
1. Zbiera brief z gotowego szablonu z domyślnymi wartościami z tego projektu. Pyta tylko o luki i o kilka obowiązkowych kwestii: kto jest użytkownikiem, które pola zmieniają reguły, reguły wspólne dla obu typów spraw, limit wiadomości, podstawa prawna, modele, lokalizacja `.env`. Wynik zapisuje w `docs/brief.md`.
2. Pisze PRD przez `write-prd`, potem robi przegląd według checklisty i commituje.
3. Pisze regulaminy (zasady numeracji §, weryfikacja faktów, wspólne reguły) i commituje osobno.
4. Pisze ADR przez `write-adr`, potem robi cross-review z PRD. Proponowane zmiany PRD pokazuje do akceptacji.
5. Przygotowuje plan implementacji dla subagentów, ale tylko na Twoją prośbę.

Każdy punkt checklisty pochodzi z konkretnej poprawki opisanej wyżej.

Pliki:
- `.claude/skills/plan-ai-copilot/SKILL.md`
- `.claude/skills/plan-ai-copilot/references/brief-template.md`
- `.claude/skills/plan-ai-copilot/references/review-checklist.md`
- `.claude/skills/plan-ai-copilot/references/rule-documents.md`

**Skill nie jest zacommitowany.** `.gitignore` (linia 11) celowo wyklucza `.claude/skills/`, a `write-prd` i `write-adr` też nie są śledzone. Skill działa lokalnie i jest już dostępny w tej sesji. Jeśli chcesz go mieć w repo, mogę dodać wyjątek w `.gitignore` albo przenieść go do Twojego pluginu `agent-toolbox`.

W repo są też nieśledzone pliki, których nie ruszałem: `app/components/ui/accordion.tsx`, `qa-artifacts/` i `secrets`. Pliku `secrets` nie należy commitować.

Mogę wprowadzić sugerowane zmiany do `write-prd`, `write-adr` i PRD. Każda poszłaby jako osobny commit na gałęzi `feature/hardware-service-decision-copilot`.