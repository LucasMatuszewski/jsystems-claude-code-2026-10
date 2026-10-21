import { expect, test } from "@playwright/test";
import { texts } from "../../lib/case/texts";
import { ChatPage } from "./pages/chat.page";
import { FormPage, isoDaysAgo } from "./pages/form.page";

const FAILURE_WAIT_MS = 70_000;

test.describe("E-22 failed analysis returns to the form with data preserved", () => {
  test("AC-22 banner after a failed analysis, data kept, retry processes again", async ({
    page,
  }) => {
    const form = new FormPage(page);
    const chat = new ChatPage(page);
    await form.goto();
    await form.fillValid({
      caseType: "return",
      category: "smartphone",
      channel: "online",
      daysAgo: 9,
      photo: "phone-1.jpg",
    });
    await chat.submitCase(form);

    const banner = page.getByText(texts.submission.failed, { exact: true });
    await expect(banner).toBeVisible({ timeout: FAILURE_WAIT_MS });
    await expect(page.getByTestId("form-screen")).toBeVisible();
    await expect(chat.chatScreen()).toHaveCount(0);

    // Everything the user entered is still there.
    await expect(
      page.getByRole("radio", {
        exact: true,
        name: texts.form.caseType.options.return,
      })
    ).toBeChecked();
    await expect(
      page.getByRole("radio", {
        exact: true,
        name: texts.form.purchaseChannel.options.online,
      })
    ).toBeChecked();
    await expect(page.locator("#field-category")).toContainText(
      texts.form.category.options.smartphone
    );
    await expect(page.locator("#field-modelName")).toHaveValue("Model testowy");
    await expect(page.locator("#field-purchaseDate")).toHaveValue(
      isoDaysAgo(9)
    );
    await expect(page.getByAltText(texts.form.photo.previewAlt)).toBeVisible();

    // Retry runs the processing again and ends with the same banner.
    await page
      .getByRole("button", { exact: true, name: texts.submission.retry })
      .click();
    await expect(
      page.getByText(texts.processing.analyzing, { exact: true }).first()
    ).toBeVisible();
    await expect(banner).toBeVisible({ timeout: FAILURE_WAIT_MS });
  });
});
