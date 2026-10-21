# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/chat-controls.spec.ts >> E-14 @smoke chat controls >> send disabled when empty, Shift+Enter newline, Enter sends, stop keeps partial text, no file input
- Location: tests/e2e/chat-controls.spec.ts:57:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Zatrzymaj', exact: true })
Expected: visible
Timeout: 90000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: 'Zatrzymaj', exact: true }) with timeout 90000ms
  - waiting for getByRole('button', { name: 'Zatrzymaj', exact: true })

```

```yaml
- banner:
  - img "x-kom"
  - heading "Asystent zwrotów i reklamacji" [level=1]
  - button "Nowe zgłoszenie"
- main:
  - complementary:
    - heading "Twoje zgłoszenie" [level=2]
    - button "Powiększ zdjęcie":
      - img "Zdjęcie zgłoszonego sprzętu"
    - term: Rodzaj zgłoszenia
    - definition: Zwrot
    - term: Miejsce zakupu
    - definition: Sklep internetowy
    - term: Kategoria
    - definition: Smartfon
    - term: Model
    - definition: Model testowy
    - term: Data zakupu
    - definition: 12.10.2026
    - term: Dni od zakupu
    - definition: "9"
    - term: Powód
    - definition: —
    - term: Aktualna decyzja
    - definition: Przekazanie do weryfikacji
  - log:
    - paragraph: Asystent AI
    - paragraph: Dziękuję za zgłoszenie — sprawdziłem widoczne informacje i przygotowałem wstępną ocenę.
    - heading "Decyzja" [level=3]
    - paragraph: Przekazanie do weryfikacji
    - heading "Uzasadnienie" [level=2]
    - paragraph: Zakup internetowy i 9 dni od zakupu oznaczają, że zgłoszenie mieści się w terminie zwrotu ustawowego z §2 ust. 1 Regulaminu zwrotów. Na zdjęciu widać liczne pęknięcia i rysy na dużej części ekranu. Same ślady używania nie wykluczają takiego zwrotu (§2 ust. 3), ale pracownik musi sprawdzić urządzenie, by ocenić, czy korzystanie wykraczało poza sprawdzenie jego cech i działania oraz czy nastąpiło zmniejszenie wartości. Ewentualne potrącenie ustala pracownik po oględzinach; nie mogę określić jego wysokości (§2 ust. 4). Dlatego wynik zależy od fizycznej kontroli urządzenia (§5 ust. 3).
    - heading "Co dalej" [level=2]
    - list:
      - listitem: Możesz przynieść smartfon do sklepu stacjonarnego albo odesłać go na adres do zwrotów podany w potwierdzeniu zamówienia.
      - listitem: Dołącz dowód zakupu. Pracownik obejrzy ekran i pozostały stan urządzenia, a następnie podejmie ostateczną decyzję.
      - listitem: Pamiętaj, że wstępna ocena nie jest oświadczeniem o odstąpieniu od umowy (§5 ust. 4).
    - paragraph: To jest wstępna ocena przygotowana przez asystenta AI. Nie stanowi decyzji sklepu ani formalnego zgłoszenia. Ostateczną decyzję podejmuje pracownik sklepu po oględzinach sprzętu.
    - text: "**bold** pytanie o zwrot"
    - paragraph: Asystent AI
    - paragraph: O co dokładnie chcesz zapytać w sprawie zwrotu? Możesz doprecyzować tutaj w czacie.
  - text: Wiadomość do asystenta
  - textbox "Wiadomość do asystenta":
    - /placeholder: Napisz wiadomość…
  - button "Wyślij" [disabled]:
    - img
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1   | import { expect, type Locator, type Page, test } from "@playwright/test";
  2   | import { DECISION_LABELS } from "../../lib/case/constants";
  3   | import { texts } from "../../lib/case/texts";
  4   | import { ChatPage, submitCaseAndWaitForDecision } from "./pages/chat.page";
  5   | import { FormPage, isoDaysAgo } from "./pages/form.page";
  6   | 
  7   | function firstReturnDecision(page: Page) {
  8   |   return submitCaseAndWaitForDecision(page, {
  9   |     caseType: "return",
  10  |     category: "smartphone",
  11  |     channel: "online",
  12  |     daysAgo: 9,
  13  |     photo: "phone-1.jpg",
  14  |   });
  15  | }
  16  | 
  17  | /** Moves the Tab focus until the target element is the active element (keyboard-only navigation). */
  18  | async function tabTo(page: Page, target: Locator): Promise<void> {
  19  |   for (let press = 0; press < 80; press += 1) {
  20  |     // biome-ignore lint/performance/noAwaitInLoops: each key press depends on the focus left by the previous one
  21  |     const focused = await target
  22  |       .evaluate((element) => element === document.activeElement)
  23  |       .catch(() => false);
  24  |     if (focused) {
  25  |       return;
  26  |     }
  27  |     await page.keyboard.press("Tab");
  28  |   }
  29  |   throw new Error("target element could not be reached with the Tab key");
  30  | }
  31  | 
  32  | /** Moves with ArrowDown until the option is the active element, then selects it with Enter. */
  33  | async function arrowSelect(page: Page, option: Locator): Promise<void> {
  34  |   for (let press = 0; press < 20; press += 1) {
  35  |     // biome-ignore lint/performance/noAwaitInLoops: each key press depends on the focus left by the previous one
  36  |     const focused = await option
  37  |       .evaluate((element) => element === document.activeElement)
  38  |       .catch(() => false);
  39  |     if (focused) {
  40  |       await page.keyboard.press("Enter");
  41  |       return;
  42  |     }
  43  |     await page.keyboard.press("ArrowDown");
  44  |   }
  45  |   throw new Error("option could not be reached with the arrow keys");
  46  | }
  47  | 
  48  | async function expectNoHorizontalScroll(page: Page): Promise<void> {
  49  |   const widths = await page.evaluate(() => ({
  50  |     innerWidth: window.innerWidth,
  51  |     scrollWidth: document.documentElement.scrollWidth,
  52  |   }));
  53  |   expect(widths.scrollWidth).toBeLessThanOrEqual(widths.innerWidth);
  54  | }
  55  | 
  56  | test.describe("E-14 @smoke chat controls", () => {
  57  |   test("send disabled when empty, Shift+Enter newline, Enter sends, stop keeps partial text, no file input", async ({
  58  |     page,
  59  |   }) => {
  60  |     const { chat } = await firstReturnDecision(page);
  61  | 
  62  |     // Empty input disables the send button.
  63  |     await expect(chat.input()).toHaveValue("");
  64  |     await expect(chat.sendButton()).toBeDisabled();
  65  | 
  66  |     // Shift+Enter inserts a newline and does not send.
  67  |     await chat.input().click();
  68  |     await chat.input().pressSequentially("Pierwsza linia");
  69  |     await page.keyboard.press("Shift+Enter");
  70  |     await chat.input().pressSequentially("druga linia");
  71  |     expect(await chat.input().inputValue()).toContain("\n");
  72  |     expect(await chat.userMessages().count()).toBe(0);
  73  |     await chat.input().fill("");
  74  | 
  75  |     // Enter sends; user text with markdown stays literal.
  76  |     const assistantBefore = await chat.assistantMessages().count();
  77  |     await chat.input().fill("**bold** pytanie o zwrot");
  78  |     await page.keyboard.press("Enter");
  79  |     await expect(chat.userMessages().last()).toContainText("**bold**");
  80  |     await expect(chat.assistantMessages()).toHaveCount(assistantBefore + 1);
  81  | 
  82  |     // While streaming the send button is replaced by the stop button.
> 83  |     await expect(chat.stopButton()).toBeVisible();
      |                                     ^ Error: expect(locator).toBeVisible() failed
  84  |     await expect(chat.sendButton()).toHaveCount(0);
  85  |     const streamed = chat.assistantMessages().last();
  86  |     await expect
  87  |       .poll(async () => (await streamed.innerText()).trim().length, {
  88  |         timeout: 60_000,
  89  |       })
  90  |       .toBeGreaterThan(0);
  91  | 
  92  |     // Stop ends streaming and keeps the partial reply text.
  93  |     await chat.stopButton().click();
  94  |     await expect(chat.stopButton()).toHaveCount(0);
  95  |     const partial = (await streamed.innerText()).trim();
  96  |     console.log(
  97  |       `E-14 partial reply after stop (${partial.length} chars):\n${partial}`
  98  |     );
  99  |     expect(partial.length).toBeGreaterThan(0);
  100 | 
  101 |     // The chat screen never offers a file input (AC-40, AC-41, AC-44, AC-46, AC-47).
  102 |     await expect(chat.chatScreen()).toBeVisible();
  103 |     await expect(page.locator('input[type="file"]')).toHaveCount(0);
  104 |   });
  105 | });
  106 | 
  107 | test.describe("E-15 new case dialog", () => {
  108 |   test("cancel keeps the chat, confirm starts an empty form", async ({
  109 |     page,
  110 |   }) => {
  111 |     const { chat } = await firstReturnDecision(page);
  112 |     const cardsBefore = await chat.decisionCards().count();
  113 | 
  114 |     await chat.openNewCaseDialog();
  115 |     await page
  116 |       .getByRole("button", { exact: true, name: texts.newCaseDialog.cancel })
  117 |       .click();
  118 |     await expect(chat.newCaseDialog()).toBeHidden();
  119 |     await expect(chat.chatScreen()).toBeVisible();
  120 |     await expect(chat.decisionCards()).toHaveCount(cardsBefore);
  121 | 
  122 |     await chat.openNewCaseDialog();
  123 |     await page
  124 |       .getByRole("button", { exact: true, name: texts.newCaseDialog.confirm })
  125 |       .click();
  126 |     await expect(chat.formScreen()).toBeVisible();
  127 |     await expect(page.getByRole("radio")).toHaveCount(4);
  128 |     await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  129 |     await expect(page.locator("#field-modelName")).toHaveValue("");
  130 |   });
  131 | });
  132 | 
  133 | test.describe("E-16 leaving the page", () => {
  134 |   test("reload on the chat screen shows a beforeunload dialog", async ({
  135 |     page,
  136 |   }) => {
  137 |     const { chat } = await firstReturnDecision(page);
  138 |     await expect(chat.chatScreen()).toBeVisible();
  139 | 
  140 |     const dialogPromise = page.waitForEvent("dialog", { timeout: 15_000 });
  141 |     const reloaded = page.reload();
  142 |     const dialog = await dialogPromise;
  143 |     expect(dialog.type()).toBe("beforeunload");
  144 |     await dialog.accept();
  145 |     await reloaded;
  146 |   });
  147 | 
  148 |   test("reload on the form screen shows no dialog", async ({ page }) => {
  149 |     const dialogTypes: string[] = [];
  150 |     page.on("dialog", async (dialog) => {
  151 |       dialogTypes.push(dialog.type());
  152 |       await dialog.accept();
  153 |     });
  154 |     const formPage = new FormPage(page);
  155 |     await formPage.goto();
  156 |     await page.reload();
  157 |     await expect(page.getByTestId("form-screen")).toBeVisible();
  158 |     expect(dialogTypes).toEqual([]);
  159 |   });
  160 | });
  161 | 
  162 | test.describe("E-17 summary photo overlay", () => {
  163 |   test("opens with the photo, closes with Esc, the close button and an outside click", async ({
  164 |     page,
  165 |   }) => {
  166 |     const { chat } = await firstReturnDecision(page);
  167 |     const overlay = page.getByRole("dialog");
  168 | 
  169 |     await chat.openPhotoOverlay();
  170 |     await expect(overlay).toBeVisible();
  171 |     await expect(overlay.locator("img")).toBeVisible();
  172 |     await page.keyboard.press("Escape");
  173 |     await expect(overlay).toBeHidden();
  174 | 
  175 |     await chat.openPhotoOverlay();
  176 |     await expect(overlay).toBeVisible();
  177 |     await overlay
  178 |       .getByRole("button", { exact: true, name: texts.summary.photoClose })
  179 |       .click();
  180 |     await expect(overlay).toBeHidden();
  181 | 
  182 |     await chat.openPhotoOverlay();
  183 |     await expect(overlay).toBeVisible();
```