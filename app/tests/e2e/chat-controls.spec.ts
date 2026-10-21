import { expect, type Locator, type Page, test } from "@playwright/test";
import { DECISION_LABELS } from "../../lib/case/constants";
import { texts } from "../../lib/case/texts";
import { ChatPage, submitCaseAndWaitForDecision } from "./pages/chat.page";
import { FormPage, isoDaysAgo } from "./pages/form.page";

function firstReturnDecision(page: Page) {
  return submitCaseAndWaitForDecision(page, {
    caseType: "return",
    category: "smartphone",
    channel: "online",
    daysAgo: 9,
    photo: "phone-1.jpg",
  });
}

/** Moves the Tab focus until the target element is the active element (keyboard-only navigation). */
async function tabTo(page: Page, target: Locator): Promise<void> {
  for (let press = 0; press < 80; press += 1) {
    // biome-ignore lint/performance/noAwaitInLoops: each key press depends on the focus left by the previous one
    const focused = await target
      .evaluate((element) => element === document.activeElement)
      .catch(() => false);
    if (focused) {
      return;
    }
    await page.keyboard.press("Tab");
  }
  throw new Error("target element could not be reached with the Tab key");
}

/** Moves with ArrowDown until the option is the active element, then selects it with Enter. */
async function arrowSelect(page: Page, option: Locator): Promise<void> {
  for (let press = 0; press < 20; press += 1) {
    // biome-ignore lint/performance/noAwaitInLoops: each key press depends on the focus left by the previous one
    const focused = await option
      .evaluate((element) => element === document.activeElement)
      .catch(() => false);
    if (focused) {
      await page.keyboard.press("Enter");
      return;
    }
    await page.keyboard.press("ArrowDown");
  }
  throw new Error("option could not be reached with the arrow keys");
}

async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const widths = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(widths.scrollWidth).toBeLessThanOrEqual(widths.innerWidth);
}

test.describe("E-14 @smoke chat controls", () => {
  test("send disabled when empty, Shift+Enter newline, Enter sends, stop keeps partial text, no file input", async ({
    page,
  }) => {
    const { chat } = await firstReturnDecision(page);

    // Empty input disables the send button.
    await expect(chat.input()).toHaveValue("");
    await expect(chat.sendButton()).toBeDisabled();

    // Shift+Enter inserts a newline and does not send.
    await chat.input().click();
    await chat.input().pressSequentially("Pierwsza linia");
    await page.keyboard.press("Shift+Enter");
    await chat.input().pressSequentially("druga linia");
    expect(await chat.input().inputValue()).toContain("\n");
    expect(await chat.userMessages().count()).toBe(0);
    await chat.input().fill("");

    // Enter sends; user text with markdown stays literal.
    const assistantBefore = await chat.assistantMessages().count();
    await chat.input().fill("**bold** pytanie o zwrot");
    await page.keyboard.press("Enter");
    await expect(chat.userMessages().last()).toContainText("**bold**");
    await expect(chat.assistantMessages()).toHaveCount(assistantBefore + 1);

    // While streaming the send button is replaced by the stop button.
    await expect(chat.stopButton()).toBeVisible();
    await expect(chat.sendButton()).toHaveCount(0);
    const streamed = chat.assistantMessages().last();
    await expect
      .poll(async () => (await streamed.innerText()).trim().length, {
        timeout: 60_000,
      })
      .toBeGreaterThan(0);

    // Stop ends streaming and keeps the partial reply text.
    await chat.stopButton().click();
    await expect(chat.stopButton()).toHaveCount(0);
    const partial = (await streamed.innerText()).trim();
    console.log(
      `E-14 partial reply after stop (${partial.length} chars):\n${partial}`
    );
    expect(partial.length).toBeGreaterThan(0);

    // The chat screen never offers a file input (AC-40, AC-41, AC-44, AC-46, AC-47).
    await expect(chat.chatScreen()).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
  });
});

test.describe("E-15 new case dialog", () => {
  test("cancel keeps the chat, confirm starts an empty form", async ({
    page,
  }) => {
    const { chat } = await firstReturnDecision(page);
    const cardsBefore = await chat.decisionCards().count();

    await chat.openNewCaseDialog();
    await page
      .getByRole("button", { exact: true, name: texts.newCaseDialog.cancel })
      .click();
    await expect(chat.newCaseDialog()).toBeHidden();
    await expect(chat.chatScreen()).toBeVisible();
    await expect(chat.decisionCards()).toHaveCount(cardsBefore);

    await chat.openNewCaseDialog();
    await page
      .getByRole("button", { exact: true, name: texts.newCaseDialog.confirm })
      .click();
    await expect(chat.formScreen()).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(4);
    await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
    await expect(page.locator("#field-modelName")).toHaveValue("");
  });
});

test.describe("E-16 leaving the page", () => {
  test("reload on the chat screen shows a beforeunload dialog", async ({
    page,
  }) => {
    const { chat } = await firstReturnDecision(page);
    await expect(chat.chatScreen()).toBeVisible();

    const dialogPromise = page.waitForEvent("dialog", { timeout: 15_000 });
    const reloaded = page.reload();
    const dialog = await dialogPromise;
    expect(dialog.type()).toBe("beforeunload");
    await dialog.accept();
    await reloaded;
  });

  test("reload on the form screen shows no dialog", async ({ page }) => {
    const dialogTypes: string[] = [];
    page.on("dialog", async (dialog) => {
      dialogTypes.push(dialog.type());
      await dialog.accept();
    });
    const formPage = new FormPage(page);
    await formPage.goto();
    await page.reload();
    await expect(page.getByTestId("form-screen")).toBeVisible();
    expect(dialogTypes).toEqual([]);
  });
});

test.describe("E-17 summary photo overlay", () => {
  test("opens with the photo, closes with Esc, the close button and an outside click", async ({
    page,
  }) => {
    const { chat } = await firstReturnDecision(page);
    const overlay = page.getByRole("dialog");

    await chat.openPhotoOverlay();
    await expect(overlay).toBeVisible();
    await expect(overlay.locator("img")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(overlay).toBeHidden();

    await chat.openPhotoOverlay();
    await expect(overlay).toBeVisible();
    await overlay
      .getByRole("button", { exact: true, name: texts.summary.photoClose })
      .click();
    await expect(overlay).toBeHidden();

    await chat.openPhotoOverlay();
    await expect(overlay).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(overlay).toBeHidden();
  });
});

test.describe("E-18 @smoke responsive layout and keyboard-only flow", () => {
  for (const viewport of [
    { height: 800, name: "360x800", width: 360 },
    { height: 1080, name: "1920x1080", width: 1920 },
  ]) {
    test(`${viewport.name}: no horizontal scroll and keyboard-only return flow`, async ({
      page,
    }) => {
      await page.setViewportSize({
        height: viewport.height,
        width: viewport.width,
      });
      const formPage = new FormPage(page);
      const chat = new ChatPage(page);
      await formPage.goto();
      await expectNoHorizontalScroll(page);

      // Keyboard-only: radios with Space, select with Enter/ArrowDown, text fields by Tab.
      await tabTo(
        page,
        page.getByRole("radio", {
          exact: true,
          name: texts.form.caseType.options.return,
        })
      );
      await page.keyboard.press("Space");
      await tabTo(
        page,
        page.getByRole("radio", {
          exact: true,
          name: texts.form.purchaseChannel.options.online,
        })
      );
      await page.keyboard.press("Space");
      await tabTo(page, page.locator("#field-category"));
      await page.keyboard.press("Enter");
      await arrowSelect(
        page,
        page.getByRole("option", {
          exact: true,
          name: texts.form.category.options.smartphone,
        })
      );
      await tabTo(page, page.locator("#field-modelName"));
      await page.keyboard.type("Model testowy");
      await tabTo(page, page.locator("#field-purchaseDate"));
      const [year = "", month = "", day = ""] = isoDaysAgo(9).split("-");
      await page.keyboard.type(`${month}${day}${year}`);
      // The file input is the one allowed programmatic step.
      await formPage.uploadPhoto("phone-1.jpg");
      await tabTo(
        page,
        page.getByRole("button", { exact: true, name: texts.form.submit })
      );
      await page.keyboard.press("Enter");

      await chat.expectProcessingSteps();
      await expect(chat.chatScreen()).toBeVisible();
      const decision = await chat.waitForDecision();
      expect(DECISION_LABELS).toContain(decision.label);
      await expectNoHorizontalScroll(page);
    });
  }
});
