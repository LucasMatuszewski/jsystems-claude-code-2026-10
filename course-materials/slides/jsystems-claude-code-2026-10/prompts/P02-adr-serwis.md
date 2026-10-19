Użyj zainstalowanego publicznego skilla `write-adr`, aby opisać architekturę **AI Chat** z aktualnego `docs/PRD.md`. Przeczytaj cały PRD, instrukcje repozytorium i istniejący szkielet. Zastosuj sposób pracy skilla, a dokumenty zapisz w `docs/ADR/`. Nie implementuj kodu. Zachowanie produktu wynika z PRD; ADR ustala techniczne decyzje i ich konsekwencje.

To greenfield w TypeScripcie na przygotowanej VM Ubuntu Linux (8 GB RAM, 4 rdzenie). Wspólne ramy kursu to Vercel AI SDK po stronie serwera, React z `useChat` i rzeczywiste strumieniowanie odpowiedzi. Porównaj dwa sensowne warianty: Next.js z endpointem w tej samej aplikacji oraz Vite + React z osobnym API Hono albo Express. Nie wybieraj stosu tylko dlatego, że występuje w historycznym przykładzie. Nie wprowadzaj Docker ani bazy, jeśli PRD ich nie potrzebuje.

## Biblioteki i źródła do porównania

- Vercel AI SDK: https://ai-sdk.dev/docs/introduction i przewodnik streamingu https://ai-sdk.dev/docs/ai-sdk-ui/chatbot . Zweryfikowany Context7 ID: `/websites/ai-sdk_dev`.
- AI SDK UI i React `useChat`: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat . Ustal aktualne importy, sposób wysyłania i strukturę wiadomości zamiast kopiować nieaktualny interfejs `ai/react`.
- Anthropic provider: https://ai-sdk.dev/providers/ai-sdk-providers/anthropic oraz oficjalne dokumenty API https://platform.claude.com/docs/ .
- OpenRouter provider: https://openrouter.ai/docs/community/vercel-ai-sdk i https://openrouter.ai/docs/ . Sprawdź dostępność modelu, obsługę streamingu, limity i trasę danych.
- Next.js: https://nextjs.org/docs .
- Vite: https://vite.dev/guide/ ; Hono: https://hono.dev/docs/ ; Express: https://expressjs.com/ .
- Playwright: https://playwright.dev/docs/intro .

Agent pobiera aktualną dokumentację przez Context7 lub z oficjalnych stron, porównuje opcje i podaje źródła z datą oraz wersjami. Uczestnik ocenia dowody i zatwierdza wybór. Nie zakładaj, że dostęp do Claude Code zapewnia środki na API aplikacji; sposób uwierzytelniania i model ustalamy osobno, bez odczytu wartości sekretów.

## Decyzje wymagające uzasadnienia

- Granica UI/API: odpowiedzialność za walidację, limit wiadomości z PRD, format żądania, model błędu oraz reprezentacja historii rozmowy. Nie narzucaj nieuzgodnionego limitu.
- Kontrakt streamingu: jak backend zamienia wiadomości UI na wiadomości modelu, jak wysyła strumień zgodny z używaną wersją AI SDK UI i jak frontend składa części odpowiedzi. Uwzględnij anulowanie, zamknięcie połączenia, timeout i niepełną odpowiedź.
- Dostawca: porównaj Anthropic i OpenRouter pod kątem potrzeb PRD, zgodności protokołu, dostępu, kosztów i ograniczeń danych. Zapisz nazwę wybranego modelu i wersję biblioteki dopiero po sprawdzeniu źródła.
- Stan rozmowy: czy wystarcza pamięć bieżącej sesji, co dzieje się po odświeżeniu i jaki zakres kontekstu wraca do modelu. Jeżeli trwała historia jest poza PRD, odłóż bazę danych i migracje.
- Sekrety i logi: klucz wyłącznie na serwerze, nazwy w `.env.example`, bez wartości w kodzie klienta, logach, screenshotach i Git. Przedstaw czytelny błąd dla braku konfiguracji.
- Bezpieczny rendering: tekst albo Markdown według PRD; treść modelu jest niezaufana, surowy HTML nie może wykonywać kodu. Opisz dostępność pola, przycisku i stanu generowania.
- Podział pracy: kontrakt i manifest zależności mają właściciela; `be-developer` i `fe-developer` dostają rozłączne obszary, a `qa-engineer` przygotowuje scenariusze i uruchamia E2E po integracji.

Dla każdego istotnego wyboru podaj realistyczną alternatywę, powód odrzucenia, konsekwencje i warunek ponownej oceny. Diagram komponentów i sekwencji ma objąć wysłanie wiadomości, przyrost strumienia, kontynuację i awarię. Opisz kontrakty, modele danych na poziomie pojęć oraz strategię testów powiązaną z kryteriami PRD. Oddziel testy jednostkowe, integracyjne i E2E. Integracyjne mogą zastąpić zewnętrzny model; E2E obejmuje prawdziwy stos i ograniczoną liczbę rzeczywistych żądań. Mock kontraktu powstaje z bezpiecznego, świeżego capture, nie z domysłu.

Zweryfikuj polecenia startu i testów w wybranym szkielecie, zanim wpiszesz je jako działające. Jeśli szkielet jeszcze nie istnieje, oznacz tę zależność i zaplanuj weryfikację po jego utworzeniu. Zachowaj źródła i wersje tak, aby następny agent mógł ponownie pobrać dokumentację. Niezależne decyzje rozdziel na odpowiednie ADR-y zgodnie ze skillem. Zakończ listą decyzji do zatwierdzenia, bez scaffoldingu i bez uruchamiania subagentów.
