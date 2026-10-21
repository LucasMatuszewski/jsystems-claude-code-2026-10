# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/reduction.spec.ts >> E-21 @smoke photo reduction >> outgoing analyze request carries a reduced JPEG with kept aspect ratio
- Location: tests/e2e/reduction.spec.ts:11:7

# Error details

```
Test timeout of 180000ms exceeded.
```

```
Error: page.waitForRequest: Test timeout of 180000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - img "x-kom" [ref=e4]
      - heading "Asystent zwrotów i reklamacji" [level=1] [ref=e5]
  - main [ref=e6]:
    - generic [ref=e7]:
      - paragraph [ref=e8]: Opisz swój zwrot lub reklamację i dodaj zdjęcie sprzętu — otrzymasz wstępną ocenę zgłoszenia.
      - generic [ref=e9]: Zgłoszenie oceni asystent AI. Ocena jest wstępna i niewiążąca — ostateczną decyzję podejmuje pracownik sklepu po oględzinach sprzętu.
      - group [ref=e11]:
        - group "Rodzaj zgłoszenia" [ref=e12]:
          - radiogroup [ref=e14]:
            - generic [ref=e15] [cursor=pointer]:
              - generic [ref=e16]:
                - radio "Zwrot" [checked] [ref=e17]
                - radio [checked] [aria-hidden]
                - generic [ref=e20]: Zwrot
              - generic [ref=e21]: Chcę oddać sprawny sprzęt
            - generic [ref=e22] [cursor=pointer]:
              - generic [ref=e23]:
                - radio "Reklamacja" [ref=e24]
                - radio [aria-hidden]
                - generic [ref=e25]: Reklamacja
              - generic [ref=e26]: Sprzęt ma wadę lub usterkę
        - group "Miejsce zakupu" [ref=e27]:
          - radiogroup [ref=e29]:
            - generic [ref=e30] [cursor=pointer]:
              - radio "Sklep internetowy" [checked] [ref=e31]
              - radio [checked] [aria-hidden]
              - generic [ref=e34]: Sklep internetowy
            - generic [ref=e35] [cursor=pointer]:
              - radio "Sklep stacjonarny" [ref=e36]
              - radio [aria-hidden]
              - generic [ref=e37]: Sklep stacjonarny
        - generic [ref=e38]:
          - generic [ref=e39]: Kategoria sprzętu
          - combobox "Kategoria sprzętu" [ref=e40]:
            - generic: Laptop
          - combobox [aria-hidden] [ref=e41]
        - generic [ref=e42]:
          - generic [ref=e43]: Nazwa lub model sprzętu
          - textbox "Nazwa lub model sprzętu" [ref=e44]:
            - /placeholder: np. Samsung Galaxy S24
            - text: Model testowy
        - generic [ref=e45]:
          - generic [ref=e46]: Data zakupu
          - textbox "Data zakupu" [ref=e47]: 2026-10-18
        - generic [ref=e48]:
          - generic [ref=e49]: Powód zwrotu (opcjonalnie)
          - textbox "Powód zwrotu (opcjonalnie)" [ref=e50]
          - paragraph [ref=e51]: 0 / 2000
        - group "Zdjęcie sprzętu" [ref=e52]:
          - paragraph [ref=e54]: Pokaż cały sprzęt z widocznym stanem obudowy i ekranu
          - paragraph [ref=e55]: JPG, PNG lub WebP, maks. 10 MB
          - generic [ref=e56]:
            - generic [ref=e57]:
              - img "Podgląd wybranego zdjęcia" [ref=e58]
              - generic [ref=e59]:
                - generic [ref=e60]: laptop-1.png
                - button "Usuń" [ref=e61]
            - button "Wybierz zdjęcie" [ref=e62]
            - paragraph [ref=e63]: lub przeciągnij plik tutaj
            - button "Choose File" [ref=e64]
        - alert [ref=e65]:
          - paragraph [ref=e66]: Nie udało się przeanalizować zgłoszenia. Spróbuj ponownie.
          - generic [ref=e67]:
            - button "Spróbuj ponownie" [ref=e68]
            - button "Zamknij" [ref=e69]
        - button "Wyślij zgłoszenie" [ref=e70]
  - region "Notifications alt+T"
  - alert [ref=e71]
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | import { findPart, isJpeg, jpegSize, parseMultipart } from "./helpers/photos";
  3  | import { FormPage } from "./pages/form.page";
  4  | 
  5  | const MAX_UPLOAD_BYTES = 1_048_576;
  6  | const MAX_LONG_EDGE = 1568;
  7  | /** laptop-1.png source dimensions (JPEG content): 3024 x 3135. */
  8  | const SOURCE_ASPECT = 3024 / 3135;
  9  | 
  10 | test.describe("E-21 @smoke photo reduction", () => {
  11 |   test("outgoing analyze request carries a reduced JPEG with kept aspect ratio", async ({
  12 |     page,
  13 |   }) => {
  14 |     const formPage = new FormPage(page);
  15 |     await formPage.goto();
  16 |     await formPage.fillValid({
  17 |       caseType: "return",
  18 |       category: "laptop",
  19 |       channel: "online",
  20 |       daysAgo: 3,
  21 |       photo: "laptop-1.png",
  22 |     });
  23 | 
  24 |     // Passive observation: no interception, the request goes to the real server.
> 25 |     const requestPromise = page.waitForRequest(
     |                                 ^ Error: page.waitForRequest: Test timeout of 180000ms exceeded.
  26 |       (candidate) =>
  27 |         new URL(candidate.url()).pathname === "/api/analyze" &&
  28 |         candidate.method() === "POST"
  29 |     );
  30 |     await formPage.submit();
  31 |     const request = await requestPromise;
  32 | 
  33 |     const body = request.postDataBuffer();
  34 |     expect(body).not.toBeNull();
  35 |     const contentType = request.headers()["content-type"] ?? "";
  36 |     const photo = findPart(
  37 |       parseMultipart(body ?? Buffer.alloc(0), contentType),
  38 |       "photo"
  39 |     );
  40 | 
  41 |     expect(photo.body.length).toBeLessThanOrEqual(MAX_UPLOAD_BYTES);
  42 |     expect(isJpeg(photo.body)).toBe(true);
  43 | 
  44 |     const { width, height } = jpegSize(photo.body);
  45 |     expect(Math.max(width, height)).toBeLessThanOrEqual(MAX_LONG_EDGE);
  46 |     expect(Math.abs(width - height * SOURCE_ASPECT)).toBeLessThanOrEqual(1);
  47 |   });
  48 | });
  49 | 
```