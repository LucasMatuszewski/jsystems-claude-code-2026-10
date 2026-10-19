Użyj zainstalowanego publicznego skilla `write-prd`, aby przygotować `docs/PRD.md` dla aplikacji **AI Chat**. To aplikacja budowana od pustego szkieletu na trzydniowym warsztacie. Skill prowadzi rozmowę o wymaganiach i sposób zapisu dokumentu; poniższe informacje są pełnym kontekstem produktu, a nie gotową specyfikacją architektury. Nie implementuj teraz aplikacji i nie zastępuj rozmowy o brakujących wymaganiach własnymi założeniami.

## Problem i użytkownik

Użytkownik chce prowadzić rozmowę z modelem AI w prostej aplikacji webowej. Nie chce czekać na całą odpowiedź bez informacji o postępie ani tracić wpisanego tekstu, gdy dostawca zwróci błąd. Potrzebuje czytelnej historii bieżącej rozmowy, rozróżnienia wiadomości użytkownika i modelu oraz jasnego stanu wysyłania, generowania i błędu. Interfejs ma działać na komputerze i telefonie. Używamy wyłącznie danych syntetycznych i krótkich, nieszkodliwych pytań testowych.

Główny użytkownik wpisuje wiadomość, wysyła ją i widzi stopniowo dopisywaną odpowiedź. Druga persona to osoba rozwijająca aplikację: musi móc odtworzyć błąd, sprawdzić kontrakt i uruchomić testy bez ujawniania poświadczeń. Rozdziel jej potrzeby od funkcji samego czatu. Określ, po czym poznamy, że pierwszy przepływ jest gotowy, zamiast mierzyć sukces liczbą wygenerowanych plików.

## Przepływy i zachowanie do uzgodnienia

- Rozpoczęcie nowej rozmowy: pusty widok ma objaśniać następny krok, mieć etykietę pola wiadomości i przycisk wysłania. Ustal z uczestnikiem przykładowe teksty po polsku i dostępność klawiaturą.
- Wysłanie wiadomości: walidujemy pusty tekst oraz białe znaki. Przed implementacją uzgodnij granicę długości wiadomości i sposób pokazania błędu. Nie wymyślaj arbitralnego limitu.
- Streaming: po wysłaniu użytkownik widzi swoją wiadomość, stan pracy i przyrost odpowiedzi. Ustal zachowanie przy drugiej próbie wysłania podczas generowania. Nie akceptuj jedynie animacji udającej strumień gotowej odpowiedzi.
- Kontynuacja: kolejne pytanie korzysta z kontekstu bieżącej rozmowy. Uzgodnij, jak duża historia jest przekazywana i jak użytkownik zaczyna nową rozmowę. Nie dodawaj automatycznie bazy danych.
- Błąd dostawcy lub sieci: czytelny komunikat, zachowany wpisany tekst i możliwość świadomej ponownej próby. Nie pokazuj klucza, surowego stack trace ani pełnych poufnych żądań.
- Przerwanie odpowiedzi i ponawianie: zapytaj, czy należą do pierwszego zakresu. Jeśli tak, opisz widoczny stan częściowej odpowiedzi i warunki ponowienia. Nie zakładaj takiego samego zachowania dla przerwania i awarii.
- Odpowiedź zawierająca kod lub Markdown: uzgodnij, czy pierwsza wersja wyświetla tekst, czy bezpiecznie renderuje Markdown. Surowy HTML i skrypty z modelu nie mogą wykonywać się w przeglądarce.

Techniczne ramy szkolenia to TypeScript, backend i frontend, streaming oraz Vercel AI SDK z React `useChat`. W PRD zapisz je jako znane ograniczenia, lecz wybór Next.js albo Vite z osobnym API, dostawcy i wersji SDK zostaw do ADR. Klucz modelu pozostaje po stronie serwera. Subskrypcja do pracy z Claude Code nie jest automatycznie kluczem API do budowanej aplikacji.

## Zakres pierwszej wersji i dowody

Zaproponuj najmniejszą spójną wersję: jedna rozmowa w bieżącej sesji, wiadomości tekstowe, prawdziwy streaming, obsługa błędu i czytelny interfejs. Poza tym zakresem pozostają płatności, konta użytkowników, RAG, upload plików, narzędzia wykonywane przez model i trwała historia, chyba że świadomie zmienimy zakres. Historia wielu rozmów i Markdown mogą być rozszerzeniem po działającym minimum.

Przygotuj co najmniej cztery przypadki demonstracyjne: poprawna wiadomość z przyrostem tekstu, kontynuacja rozmowy, pusty input oraz awaria usługi. Dla każdego zapisz widoczny wynik i numerowane kryteria akceptacji, z których tester może wyprowadzić uczciwy test. Dodaj mapowanie kryterium -> scenariusz -> dowód. Nie wymagaj dokładnego brzmienia odpowiedzi probabilistycznego modelu; sprawdzamy zachowanie aplikacji i kontrakt.

Najpierw przeczytaj instrukcje repozytorium i rzeczywisty stan szkieletu. Zadawaj tylko pytania, których odpowiedzi brakuje i które zmieniają zachowanie produktu. Oddziel ustalone fakty od propozycji i otwartych pytań. Po rozmowie zapisz dokument według skilla, pokaż zakres do przeglądu i zakończ. Implementacja, delegowanie oraz tworzenie gałęzi nie należą do tego zadania.
