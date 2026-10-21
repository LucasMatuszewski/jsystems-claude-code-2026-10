# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/form.spec.ts >> E-01 @smoke form structure and validation >> complaint shows required reason label and enforces minimum length
- Location: tests/e2e/form.spec.ts:109:7

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: locator('#field-reason-error')
Expected: "Opisz problem (min. 20 znaków)"
Timeout: 90000ms
Error: element(s) not found

Call log:
  - Expect "toHaveText" locator('#field-reason-error') with timeout 90000ms
  - waiting for locator('#field-reason-error')

```

```yaml
- banner:
  - img "x-kom"
  - heading "Asystent zwrotów i reklamacji" [level=1]
- main:
  - paragraph: Opisz swój zwrot lub reklamację i dodaj zdjęcie sprzętu — otrzymasz wstępną ocenę zgłoszenia.
  - text: Zgłoszenie oceni asystent AI. Ocena jest wstępna i niewiążąca — ostateczną decyzję podejmuje pracownik sklepu po oględzinach sprzętu.
  - group:
    - group "Rodzaj zgłoszenia":
      - text: Rodzaj zgłoszenia
      - radiogroup:
        - radio "Zwrot"
        - text: Zwrot Chcę oddać sprawny sprzęt
        - radio "Reklamacja" [checked]
        - text: Reklamacja Sprzęt ma wadę lub usterkę
    - group "Miejsce zakupu":
      - text: Miejsce zakupu
      - radiogroup [invalid]:
        - radio "Sklep internetowy"
        - text: Sklep internetowy
        - radio "Sklep stacjonarny"
        - text: Sklep stacjonarny
      - paragraph: Wybierz miejsce zakupu
    - text: Kategoria sprzętu
    - combobox "Kategoria sprzętu" [invalid]: Wybierz kategorię
    - paragraph: Wybierz kategorię sprzętu
    - text: Nazwa lub model sprzętu
    - textbox "Nazwa lub model sprzętu" [invalid]:
      - /placeholder: np. Samsung Galaxy S24
    - paragraph: Podaj nazwę lub model sprzętu (min. 2 znaki)
    - text: Data zakupu
    - textbox "Data zakupu" [invalid]
    - paragraph: Podaj datę zakupu
    - text: Opisz problem
    - textbox "Opisz problem": Uszkodzony
    - paragraph: 10 / 2000
    - group "Zdjęcie sprzętu":
      - text: Zdjęcie sprzętu
      - paragraph: Pokaż wyraźnie uszkodzenie lub wadę
      - paragraph: JPG, PNG lub WebP, maks. 10 MB
      - button "Wybierz zdjęcie"
      - paragraph: lub przeciągnij plik tutaj
      - button "Choose File"
      - paragraph: Dodaj zdjęcie sprzętu.
    - button "Wyślij zgłoszenie"
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  25  |     page.locator("#field-photo-label"),
  26  |   ];
  27  | }
  28  | 
  29  | test.describe("E-01 @smoke form structure and validation", () => {
  30  |   test("seven fields appear in AC-01 order", async ({ page }) => {
  31  |     const formPage = new FormPage(page);
  32  |     await formPage.goto();
  33  | 
  34  |     const labels = fieldLabels(page);
  35  |     await Promise.all(labels.map((label) => expect(label).toBeVisible()));
  36  |     const boxes = await Promise.all(labels.map((label) => label.boundingBox()));
  37  |     const tops = boxes.map((box) => {
  38  |       if (box === null) {
  39  |         throw new Error("field label has no bounding box");
  40  |       }
  41  |       return box.y;
  42  |     });
  43  |     for (let index = 1; index < tops.length; index += 1) {
  44  |       expect(tops[index]).toBeGreaterThan(tops[index - 1] ?? Number.NaN);
  45  |     }
  46  |   });
  47  | 
  48  |   test("case type and channel radios exist unchecked and category lists nine options", async ({
  49  |     page,
  50  |   }) => {
  51  |     const formPage = new FormPage(page);
  52  |     await formPage.goto();
  53  | 
  54  |     const caseTypeNames = [
  55  |       texts.form.caseType.options.return,
  56  |       texts.form.caseType.options.complaint,
  57  |     ];
  58  |     const channelNames = [
  59  |       texts.form.purchaseChannel.options[PURCHASE_CHANNELS[0]],
  60  |       texts.form.purchaseChannel.options[PURCHASE_CHANNELS[1]],
  61  |     ];
  62  |     await Promise.all(
  63  |       [...caseTypeNames, ...channelNames].map(async (name) => {
  64  |         const radio = page.getByRole("radio", { exact: true, name });
  65  |         await expect(radio).toBeVisible();
  66  |         await expect(radio).not.toBeChecked();
  67  |       })
  68  |     );
  69  |     await expect(page.getByRole("radio")).toHaveCount(4);
  70  | 
  71  |     await page.locator("#field-category").click();
  72  |     await expect(page.getByRole("option")).toHaveText(
  73  |       CATEGORIES.map((category) => texts.form.category.options[category])
  74  |     );
  75  |     await page.keyboard.press("Escape");
  76  |   });
  77  | 
  78  |   test("AI-use notice is shown verbatim", async ({ page }) => {
  79  |     const formPage = new FormPage(page);
  80  |     await formPage.goto();
  81  | 
  82  |     await expect(page.getByTestId("ai-notice")).toHaveText(texts.form.aiNotice);
  83  |   });
  84  | 
  85  |   test("empty submit shows every error, focuses the first field and sends no analyze request", async ({
  86  |     page,
  87  |   }) => {
  88  |     const analyzeRequests: string[] = [];
  89  |     page.on("request", (request) => {
  90  |       if (new URL(request.url()).pathname === "/api/analyze") {
  91  |         analyzeRequests.push(request.method());
  92  |       }
  93  |     });
  94  |     const formPage = new FormPage(page);
  95  |     await formPage.goto();
  96  | 
  97  |     await formPage.submit();
  98  | 
  99  |     await Promise.all(
  100 |       FIELD_ERROR_MESSAGES.map(async ([field, message]) => {
  101 |         await expect(formPage.errorFor(field)).toBeVisible();
  102 |         await expect(formPage.errorFor(field)).toHaveText(message);
  103 |       })
  104 |     );
  105 |     await expect(page.locator("#field-caseType")).toBeFocused();
  106 |     expect(analyzeRequests).toEqual([]);
  107 |   });
  108 | 
  109 |   test("complaint shows required reason label and enforces minimum length", async ({
  110 |     page,
  111 |   }) => {
  112 |     const formPage = new FormPage(page);
  113 |     await formPage.goto();
  114 | 
  115 |     await formPage.chooseCaseType("complaint");
  116 |     const reasonLabel = page.locator('label[for="field-reason"]');
  117 |     await expect(reasonLabel).toContainText(texts.form.reason.labelComplaint);
  118 |     await expect(reasonLabel.locator('span[aria-hidden="true"]')).toHaveText(
  119 |       texts.form.requiredMarker
  120 |     );
  121 | 
  122 |     // "Uszkodzony" is exactly 10 characters, below the 20-character minimum.
  123 |     await formPage.fillReason("Uszkodzony");
  124 |     await formPage.submit();
> 125 |     await expect(formPage.errorFor("reason")).toHaveText(
      |                                               ^ Error: expect(locator).toHaveText(expected) failed
  126 |       texts.validation.reasonComplaintMin
  127 |     );
  128 |   });
  129 | 
  130 |   test("return shows optional reason label without required marker", async ({
  131 |     page,
  132 |   }) => {
  133 |     const formPage = new FormPage(page);
  134 |     await formPage.goto();
  135 | 
  136 |     await formPage.chooseCaseType("return");
  137 |     const reasonLabel = page.locator('label[for="field-reason"]');
  138 |     await expect(reasonLabel).toHaveText(texts.form.reason.labelReturn);
  139 |     await expect(reasonLabel.locator('span[aria-hidden="true"]')).toHaveCount(
  140 |       0
  141 |     );
  142 |   });
  143 | 
  144 |   test("reason counter, reason and model name limits and date max", async ({
  145 |     page,
  146 |   }) => {
  147 |     const formPage = new FormPage(page);
  148 |     await formPage.goto();
  149 | 
  150 |     await formPage.fillReason("Hello");
  151 |     await expect(page.locator("#field-reason-counter")).toHaveText("5 / 2000");
  152 |     await expect(page.locator("#field-reason-counter")).toHaveText(
  153 |       formatCounter(5)
  154 |     );
  155 |     await expect(page.locator("#field-reason")).toHaveAttribute(
  156 |       "maxlength",
  157 |       "2000"
  158 |     );
  159 |     await expect(page.locator("#field-modelName")).toHaveAttribute(
  160 |       "maxlength",
  161 |       "100"
  162 |     );
  163 |     await expect(page.locator("#field-purchaseDate")).toHaveAttribute(
  164 |       "max",
  165 |       todayInWarsaw()
  166 |     );
  167 |   });
  168 | });
  169 | 
  170 | test.describe("E-02 @smoke photo rules", () => {
  171 |   test("uploaded photo shows thumbnail, file name and remove action", async ({
  172 |     page,
  173 |   }) => {
  174 |     const formPage = new FormPage(page);
  175 |     await formPage.goto();
  176 | 
  177 |     await formPage.uploadPhoto("laptop-1.png");
  178 | 
  179 |     await expect(
  180 |       page.getByRole("img", { name: texts.form.photo.previewAlt })
  181 |     ).toBeVisible();
  182 |     await expect(page.getByText("laptop-1.png", { exact: true })).toBeVisible();
  183 |     await expect(
  184 |       page.getByRole("button", { exact: true, name: texts.form.photo.remove })
  185 |     ).toBeVisible();
  186 |     await expect(formPage.errorFor("photo")).toHaveCount(0);
  187 |   });
  188 | 
  189 |   test("a new photo replaces the previous one", async ({ page }) => {
  190 |     const formPage = new FormPage(page);
  191 |     await formPage.goto();
  192 | 
  193 |     await formPage.uploadPhoto("laptop-1.png");
  194 |     await expect(page.getByText("laptop-1.png", { exact: true })).toBeVisible();
  195 |     await formPage.uploadPhoto("laptop-2.webp");
  196 | 
  197 |     await expect(
  198 |       page.getByText("laptop-2.webp", { exact: true })
  199 |     ).toBeVisible();
  200 |     await expect(page.getByText("laptop-1.png", { exact: true })).toHaveCount(
  201 |       0
  202 |     );
  203 |     await expect(
  204 |       page.getByRole("img", { name: texts.form.photo.previewAlt })
  205 |     ).toHaveCount(1);
  206 |   });
  207 | 
  208 |   test("remove deletes the thumbnail", async ({ page }) => {
  209 |     const formPage = new FormPage(page);
  210 |     await formPage.goto();
  211 | 
  212 |     await formPage.uploadPhoto("laptop-2.webp");
  213 |     await expect(
  214 |       page.getByRole("img", { name: texts.form.photo.previewAlt })
  215 |     ).toBeVisible();
  216 |     await formPage.removePhoto();
  217 | 
  218 |     await expect(
  219 |       page.getByRole("img", { name: texts.form.photo.previewAlt })
  220 |     ).toHaveCount(0);
  221 |     await expect(
  222 |       page.getByRole("button", { exact: true, name: texts.form.photo.remove })
  223 |     ).toHaveCount(0);
  224 |   });
  225 | 
```