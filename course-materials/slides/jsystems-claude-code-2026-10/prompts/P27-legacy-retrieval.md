# P27 - Wyszukiwanie kodu i dokumentacji frameworka

Zaprojektujmy osobne narzędzie do repozytorium frameworka i aplikacji, które z niego korzystają. Poza repozytorium materiałów kursowych. Na początek użyjmy publicznego jFTP; bez prywatnego kodu klienta. Sprawdź aktualne oficjalne dokumenty i gotowe silniki, zanim proponujesz budowę wszystkiego od zera.

Indeks ma obejmować oryginalny kod oraz sprawdzone karty API. Zapisuj repo, wersję/commit, typ źródła, symbol, ścieżkę, linie i hash. Rozdziel opis wygenerowany od kodu, który go potwierdza. Dla konkretnego zadania zwracaj mały zestaw cytowanych fragmentów; brak dowodu ma być widoczny.

W planie zacznij od wyszukiwania symboli i tekstu. Zaproponuj porównanie z hybrydą tekst + embeddings; łącz rankingi i usuń duplikaty. Reranker zaplanuj tylko, jeśli poprawi wynik testów przy rozsądnym czasie. Zaplanuj ocenę na tych samych, wcześniej zapisanych pytaniach: API, zachowanie, caller, nieistniejący symbol i nieaktualna wersja. Uwzględnij zmianę oraz usunięcie pliku w planie testów.

Dla klienta Context7 sprawdź `--base-url` i zgodność odpowiedzi dwóch endpointów: `/api/v2/libs/search` oraz `/api/v2/context`. Zgodny klient nie potwierdza jakości wyszukiwania. Oddaj najpierw porównanie opcji i plan eksperymentu. Implementację narzędzia podejmiemy w osobnym projekcie po wyborze zakresu.
