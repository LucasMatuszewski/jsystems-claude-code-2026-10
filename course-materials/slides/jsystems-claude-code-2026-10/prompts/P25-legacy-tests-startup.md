# P25 - Testy charakterystyki i naprawa uruchomienia

Pracuję w osobnym klonie https://github.com/sai-pullabhotla/jftp, nie w materiałach kursowych. Punkt odniesienia: `14e62ceba4e371c2a0b955604b10f065f46f4f7d`. Zapisz rzeczywistą rewizję i stan Git.

Wybierz małe, obserwowalne zachowanie istniejącego kodu. Najpierw sprawdź importy i minimalne wymagania kompilacji. Jeśli test nie może się uruchomić, zaproponuj wąskie przygotowanie środowiska testowego; oddziel je od naprawy całego projektu. Nie zaczynaj od GUI ani sieci, jeśli prostszy fragment daje użyteczny test.

Opisz aktualne zachowanie w teście, uruchom go i zachowaj wynik. Wprowadź tymczasową zmianę zachowania, potwierdź, że test ją wykrywa, i cofnij tylko tę zmianę. Nie deklaruj sukcesu bez uruchomienia testu. Test aktualnego zachowania nie jest automatycznie wymaganiem nowej funkcji.

Następnie diagnozuj kolejne błędy oryginalnego budowania i startu. Dla każdej naprawy pokaż błąd, przyczynę popartą źródłem, opcje, wybraną najmniejszą zmianę, diff i sprawdzenie. Nowy moduł lub zmiana POM jest dopuszczalna po mojej decyzji i uzasadnieniu. Nie zastępuj brakującego API atrapą. Nie rób szerokiej aktualizacji przy okazji jednego błędu.

Raportuj osobno kompilację, testy, kontrolę zasobów, start Swing i transfer. Przy braku ekranu zapisz dokładny wynik próby i ograniczenie. Test transferu tylko z lokalnym serwerem i danymi syntetycznymi, gdy ten zakres uzgodnimy. Odśwież dokumentację zmienionej konfiguracji.
