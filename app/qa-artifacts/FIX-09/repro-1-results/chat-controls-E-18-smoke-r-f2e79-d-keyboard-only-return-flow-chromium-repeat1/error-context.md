# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/chat-controls.spec.ts >> E-18 @smoke responsive layout and keyboard-only flow >> 360x800: no horizontal scroll and keyboard-only return flow
- Location: tests/e2e/chat-controls.spec.ts:194:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Analizujemy zdjęcie…', { exact: true }).first()
Expected: visible
Timeout: 90000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Analizujemy zdjęcie…', { exact: true }).first() with timeout 90000ms
  - waiting for getByText('Analizujemy zdjęcie…', { exact: true }).first()

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
        - radio "Zwrot" [checked]
        - text: Zwrot Chcę oddać sprawny sprzęt
        - radio "Reklamacja"
        - text: Reklamacja Sprzęt ma wadę lub usterkę
    - group "Miejsce zakupu":
      - text: Miejsce zakupu
      - radiogroup:
        - radio "Sklep internetowy" [checked]
        - text: Sklep internetowy
        - radio "Sklep stacjonarny"
        - text: Sklep stacjonarny
    - text: Kategoria sprzętu
    - combobox "Kategoria sprzętu": Smartfon
    - text: Nazwa lub model sprzętu
    - textbox "Nazwa lub model sprzętu":
      - /placeholder: np. Samsung Galaxy S24
      - text: Model testowy
    - text: Data zakupu
    - textbox "Data zakupu" [invalid]: 2026-12-10
    - paragraph: Data zakupu nie może być z przyszłości
    - text: Powód zwrotu (opcjonalnie)
    - textbox "Powód zwrotu (opcjonalnie)"
    - paragraph: 0 / 2000
    - group "Zdjęcie sprzętu":
      - text: Zdjęcie sprzętu
      - paragraph: Pokaż cały sprzęt z widocznym stanem obudowy i ekranu
      - paragraph: JPG, PNG lub WebP, maks. 10 MB
      - img "Podgląd wybranego zdjęcia"
      - text: phone-1.jpg
      - button "Usuń"
      - button "Wybierz zdjęcie"
      - paragraph: lub przeciągnij plik tutaj
      - button "Choose File"
    - button "Wyślij zgłoszenie"
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  21  |   private readonly page: Page;
  22  |   private submittedAt = 0;
  23  | 
  24  |   constructor(page: Page) {
  25  |     this.page = page;
  26  |   }
  27  | 
  28  |   /** Visible instance of a locator (the summary is rendered twice: mobile collapsible and desktop aside). */
  29  |   private visible(locator: Locator): Locator {
  30  |     return locator.locator("visible=true");
  31  |   }
  32  | 
  33  |   chatScreen(): Locator {
  34  |     return this.page.getByTestId("chat-screen");
  35  |   }
  36  | 
  37  |   formScreen(): Locator {
  38  |     return this.page.getByTestId("form-screen");
  39  |   }
  40  | 
  41  |   decisionCards(): Locator {
  42  |     return this.page.getByTestId("decision-card");
  43  |   }
  44  | 
  45  |   assistantMessages(): Locator {
  46  |     return this.page.getByTestId("assistant-message");
  47  |   }
  48  | 
  49  |   userMessages(): Locator {
  50  |     return this.page.getByTestId("user-message");
  51  |   }
  52  | 
  53  |   disclaimer(): Locator {
  54  |     return this.page.getByTestId("disclaimer");
  55  |   }
  56  | 
  57  |   input(): Locator {
  58  |     return this.page.getByLabel(texts.chat.inputLabel, { exact: true });
  59  |   }
  60  | 
  61  |   sendButton(): Locator {
  62  |     return this.page.getByRole("button", {
  63  |       exact: true,
  64  |       name: texts.chat.send,
  65  |     });
  66  |   }
  67  | 
  68  |   stopButton(): Locator {
  69  |     return this.page.getByRole("button", {
  70  |       exact: true,
  71  |       name: texts.chat.stop,
  72  |     });
  73  |   }
  74  | 
  75  |   summaryDecision(): Locator {
  76  |     return this.visible(this.page.getByTestId("summary-decision"));
  77  |   }
  78  | 
  79  |   /** The value cell (dd) of the summary row labelled "Dni od zakupu". */
  80  |   summaryDays(): Locator {
  81  |     return this.visible(
  82  |       this.page
  83  |         .getByText(texts.summary.daysSincePurchase, { exact: true })
  84  |         .locator("xpath=..")
  85  |         .locator("dd")
  86  |     );
  87  |   }
  88  | 
  89  |   photoThumbnail(): Locator {
  90  |     return this.visible(
  91  |       this.page.getByRole("button", {
  92  |         exact: true,
  93  |         name: texts.summary.photoOpen,
  94  |       })
  95  |     );
  96  |   }
  97  | 
  98  |   summaryToggle(): Locator {
  99  |     return this.page.getByRole("button", {
  100 |       name: new RegExp(texts.summary.toggle),
  101 |     });
  102 |   }
  103 | 
  104 |   newCaseButton(): Locator {
  105 |     return this.page.getByRole("button", {
  106 |       exact: true,
  107 |       name: texts.chat.newCase,
  108 |     });
  109 |   }
  110 | 
  111 |   /** Remembers the moment of the submit click so TTFC can be measured. */
  112 |   async submitCase(form: FormPage): Promise<void> {
  113 |     this.submittedAt = Date.now();
  114 |     await form.submit();
  115 |   }
  116 | 
  117 |   /** Waits for the processing steps in order: analyzing, then deciding. */
  118 |   async expectProcessingSteps(): Promise<void> {
  119 |     await expect(
  120 |       this.page.getByText(texts.processing.analyzing, { exact: true }).first()
> 121 |     ).toBeVisible();
      |       ^ Error: expect(locator).toBeVisible() failed
  122 |     await expect(
  123 |       this.page.getByText(texts.processing.deciding, { exact: true }).first()
  124 |     ).toBeVisible();
  125 |   }
  126 | 
  127 |   /** Waits for the first decision card after the last submitCase(); returns its label and TTFC in ms. */
  128 |   async waitForDecision(): Promise<Decision> {
  129 |     const card = this.decisionCards().first();
  130 |     await expect(card).toBeVisible({ timeout: DECISION_WAIT_MS });
  131 |     const ms = Date.now() - this.submittedAt;
  132 |     const label = await card.getAttribute("data-label");
  133 |     if (!isDecisionLabel(label)) {
  134 |       throw new Error(`decision card has unexpected data-label: ${label}`);
  135 |     }
  136 |     return { label, ms };
  137 |   }
  138 | 
  139 |   /** Waits until the assistant has finished streaming (the stop button is gone). */
  140 |   async waitForIdle(): Promise<void> {
  141 |     await expect(this.stopButton()).toHaveCount(0, { timeout: REPLY_WAIT_MS });
  142 |   }
  143 | 
  144 |   async firstAssistantText(): Promise<string> {
  145 |     await this.waitForIdle();
  146 |     return (await this.assistantMessages().first().innerText()).trim();
  147 |   }
  148 | 
  149 |   async lastAssistantText(): Promise<string> {
  150 |     await this.waitForIdle();
  151 |     return (await this.assistantMessages().last().innerText()).trim();
  152 |   }
  153 | 
  154 |   /** Types a message and sends it with the send button, then returns the new last assistant reply. */
  155 |   async sendAndWaitForReply(text: string): Promise<string> {
  156 |     const before = await this.assistantMessages().count();
  157 |     await this.input().fill(text);
  158 |     await this.sendButton().click();
  159 |     await expect(this.assistantMessages()).toHaveCount(before + 1, {
  160 |       timeout: REPLY_WAIT_MS,
  161 |     });
  162 |     return this.lastAssistantText();
  163 |   }
  164 | 
  165 |   async sendMessage(text: string): Promise<void> {
  166 |     await this.input().fill(text);
  167 |     await this.sendButton().click();
  168 |   }
  169 | 
  170 |   summaryLabel(): Promise<string | null> {
  171 |     return this.summaryDecision().getAttribute("data-label");
  172 |   }
  173 | 
  174 |   async openNewCaseDialog(): Promise<void> {
  175 |     await this.newCaseButton().click();
  176 |     await expect(this.newCaseDialog()).toBeVisible();
  177 |   }
  178 | 
  179 |   newCaseDialog(): Locator {
  180 |     return this.page
  181 |       .getByRole("alertdialog")
  182 |       .or(this.page.getByRole("dialog"))
  183 |       .filter({ hasText: texts.newCaseDialog.title });
  184 |   }
  185 | 
  186 |   /** Opens the summary photo overlay, expanding the mobile collapsible first when needed. */
  187 |   async openPhotoOverlay(): Promise<void> {
  188 |     if (!(await this.photoThumbnail().isVisible())) {
  189 |       await this.summaryToggle().click();
  190 |     }
  191 |     await this.photoThumbnail().click();
  192 |   }
  193 | }
  194 | 
  195 | /** Fills and submits the case form, waits for the processing steps and the first decision. */
  196 | export async function submitCaseAndWaitForDecision(
  197 |   page: Page,
  198 |   values: Parameters<FormPage["fillValid"]>[0]
  199 | ): Promise<{ chat: ChatPage; form: FormPage; decision: Decision }> {
  200 |   const form = new FormPage(page);
  201 |   const chat = new ChatPage(page);
  202 |   await form.goto();
  203 |   await form.fillValid(values);
  204 |   await chat.submitCase(form);
  205 |   await chat.expectProcessingSteps();
  206 |   const decision = await chat.waitForDecision();
  207 |   return { chat, decision, form };
  208 | }
  209 | 
```