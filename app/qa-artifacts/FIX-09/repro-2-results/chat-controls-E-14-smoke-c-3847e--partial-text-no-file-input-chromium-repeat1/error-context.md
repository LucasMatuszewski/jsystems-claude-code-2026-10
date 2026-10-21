# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/chat-controls.spec.ts >> E-14 @smoke chat controls >> send disabled when empty, Shift+Enter newline, Enter sends, stop keeps partial text, no file input
- Location: tests/e2e/chat-controls.spec.ts:57:7

# Error details

```
Test timeout of 180000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - img "x-kom" [ref=e4]
      - heading "Asystent zwrotów i reklamacji" [level=1] [ref=e5]
    - button "Nowe zgłoszenie" [ref=e7]
  - main [ref=e8]:
    - generic [ref=e10]:
      - complementary [ref=e11]:
        - generic [ref=e12]:
          - heading "Twoje zgłoszenie" [level=2] [ref=e13]
          - button "Powiększ zdjęcie" [ref=e14]:
            - img "Zdjęcie zgłoszonego sprzętu" [ref=e15]
          - generic [ref=e16]:
            - generic [ref=e17]:
              - term [ref=e18]: Rodzaj zgłoszenia
              - definition [ref=e19]: Zwrot
            - generic [ref=e20]:
              - term [ref=e21]: Miejsce zakupu
              - definition [ref=e22]: Sklep internetowy
            - generic [ref=e23]:
              - term [ref=e24]: Kategoria
              - definition [ref=e25]: Smartfon
            - generic [ref=e26]:
              - term [ref=e27]: Model
              - definition [ref=e28]: Model testowy
            - generic [ref=e29]:
              - term [ref=e30]: Data zakupu
              - definition [ref=e31]: 12.10.2026
            - generic [ref=e32]:
              - term [ref=e33]: Dni od zakupu
              - definition [ref=e34]: "9"
            - generic [ref=e35]:
              - term [ref=e36]: Powód
              - definition [ref=e37]: —
            - generic [ref=e38]:
              - term [ref=e39]: Aktualna decyzja
              - definition [ref=e40]:
                - generic [ref=e41]: Przekazanie do weryfikacji
      - generic [ref=e49]:
        - log [ref=e50]:
          - generic [ref=e52]:
            - generic [ref=e54]:
              - paragraph [ref=e55]: Asystent AI
              - generic [ref=e56]:
                - paragraph [ref=e57]: Dziękuję za zgłoszenie — sprawdzę, jak ta sytuacja wygląda według zasad zwrotu.
                - generic [ref=e58]:
                  - heading "Decyzja" [level=3] [ref=e65]
                  - paragraph [ref=e66]: Przekazanie do weryfikacji
              - generic [ref=e67]:
                - heading "Uzasadnienie" [level=2] [ref=e68]
                - paragraph [ref=e69]: Zakup internetowy sprzed 9 dni mieści się w terminie zwrotu ustawowego, czyli odstąpienia od umowy zawartej na odległość w ciągu 14 dni (§2 ust. 1 Regulaminu zwrotów). Na zdjęciu widać liczne pęknięcia na całej powierzchni ekranu oraz ciemną część wyświetlacza. Takie uszkodzenia same w sobie nie wykluczają zwrotu ustawowego, ale pracownik musi ocenić urządzenie fizycznie i ustalić, czy korzystanie wykraczało poza sprawdzenie jego cech i działania oraz czy doszło do zmniejszenia wartości (§2 ust. 3–4). Dlatego wynik wymaga oględzin. To zgłoszenie jest wstępną oceną, a nie oświadczeniem o odstąpieniu od umowy (§5 ust. 4).
                - heading "Co dalej" [level=2] [ref=e70]
                - list [ref=e71]:
                  - listitem [ref=e72]: Jeśli chcesz skorzystać ze zwrotu, złóż oświadczenie o odstąpieniu od umowy. Samo zgłoszenie go nie zastępuje.
                  - listitem [ref=e73]: Po złożeniu oświadczenia masz 14 dni na odesłanie urządzenia. Możesz też przynieść je do sklepu stacjonarnego albo wysłać na adres do zwrotów podany w potwierdzeniu zamówienia; dołącz dowód zakupu (§2 ust. 6, §5 ust. 2).
                  - listitem [ref=e74]: Pracownik obejrzy telefon i podejmie ostateczną decyzję (§5 ust. 3).
              - paragraph [ref=e75]: To jest wstępna ocena przygotowana przez asystenta AI. Nie stanowi decyzji sklepu ani formalnego zgłoszenia. Ostateczną decyzję podejmuje pracownik sklepu po oględzinach sprzętu.
            - generic [ref=e76]: "**bold** pytanie o zwrot"
            - generic [ref=e79]:
              - paragraph [ref=e80]: Asystent AI
              - paragraph [ref=e82]: Napisz proszę, jakie konkretnie pytanie o zwrot chcesz zadać — na przykład o termin, oświadczenie o odstąpieniu albo oględziny telefonu.
        - generic [ref=e83]:
          - generic [ref=e84]: Wiadomość do asystenta
          - textbox "Wiadomość do asystenta" [active] [ref=e86]:
            - /placeholder: Napisz wiadomość…
          - button "Wyślij" [disabled]
  - region "Notifications alt+T"
  - alert [ref=e87]
```