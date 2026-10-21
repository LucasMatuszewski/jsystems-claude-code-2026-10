import { expect, type Page, test } from "@playwright/test";
import { CATEGORIES, PURCHASE_CHANNELS } from "../../lib/case/constants";
import { todayInWarsaw } from "../../lib/case/days";
import { formatCounter, texts } from "../../lib/case/texts";
import { FormPage } from "./pages/form.page";

const FIELD_ERROR_MESSAGES = [
  ["caseType", texts.validation.caseTypeRequired],
  ["purchaseChannel", texts.validation.purchaseChannelRequired],
  ["category", texts.validation.categoryRequired],
  ["modelName", texts.validation.modelNameLength],
  ["purchaseDate", texts.validation.purchaseDateRequired],
  ["photo", texts.validation.photoRequired],
] as const;

/** Each field's label element, in the AC-01 order (case type, channel, category, model, date, reason, photo). */
function fieldLabels(page: Page) {
  return [
    page.getByText(texts.form.caseType.label, { exact: true }),
    page.getByText(texts.form.purchaseChannel.label, { exact: true }),
    page.getByText(texts.form.category.label, { exact: true }),
    page.getByText(texts.form.modelName.label, { exact: true }),
    page.getByText(texts.form.purchaseDate.label, { exact: true }),
    page.locator('label[for="field-reason"]'),
    page.locator("#field-photo-label"),
  ];
}

test.describe("E-01 @smoke form structure and validation", () => {
  test("seven fields appear in AC-01 order", async ({ page }) => {
    const formPage = new FormPage(page);
    await formPage.goto();

    const labels = fieldLabels(page);
    await Promise.all(labels.map((label) => expect(label).toBeVisible()));
    const boxes = await Promise.all(labels.map((label) => label.boundingBox()));
    const tops = boxes.map((box) => {
      if (box === null) {
        throw new Error("field label has no bounding box");
      }
      return box.y;
    });
    for (let index = 1; index < tops.length; index += 1) {
      expect(tops[index]).toBeGreaterThan(tops[index - 1] ?? Number.NaN);
    }
  });

  test("case type and channel radios exist unchecked and category lists nine options", async ({
    page,
  }) => {
    const formPage = new FormPage(page);
    await formPage.goto();

    const caseTypeNames = [
      texts.form.caseType.options.return,
      texts.form.caseType.options.complaint,
    ];
    const channelNames = [
      texts.form.purchaseChannel.options[PURCHASE_CHANNELS[0]],
      texts.form.purchaseChannel.options[PURCHASE_CHANNELS[1]],
    ];
    await Promise.all(
      [...caseTypeNames, ...channelNames].map(async (name) => {
        const radio = page.getByRole("radio", { exact: true, name });
        await expect(radio).toBeVisible();
        await expect(radio).not.toBeChecked();
      })
    );
    await expect(page.getByRole("radio")).toHaveCount(4);

    await page.locator("#field-category").click();
    await expect(page.getByRole("option")).toHaveText(
      CATEGORIES.map((category) => texts.form.category.options[category])
    );
    await page.keyboard.press("Escape");
  });

  test("AI-use notice is shown verbatim", async ({ page }) => {
    const formPage = new FormPage(page);
    await formPage.goto();

    await expect(page.getByTestId("ai-notice")).toHaveText(texts.form.aiNotice);
  });

  test("empty submit shows every error, focuses the first field and sends no analyze request", async ({
    page,
  }) => {
    const analyzeRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/analyze") {
        analyzeRequests.push(request.method());
      }
    });
    const formPage = new FormPage(page);
    await formPage.goto();

    await formPage.submit();

    await Promise.all(
      FIELD_ERROR_MESSAGES.map(async ([field, message]) => {
        await expect(formPage.errorFor(field)).toBeVisible();
        await expect(formPage.errorFor(field)).toHaveText(message);
      })
    );
    await expect(page.locator("#field-caseType")).toBeFocused();
    expect(analyzeRequests).toEqual([]);
  });

  test("complaint shows required reason label and enforces minimum length", async ({
    page,
  }) => {
    const formPage = new FormPage(page);
    await formPage.goto();

    await formPage.chooseCaseType("complaint");
    const reasonLabel = page.locator('label[for="field-reason"]');
    await expect(reasonLabel).toContainText(texts.form.reason.labelComplaint);
    await expect(reasonLabel.locator('span[aria-hidden="true"]')).toHaveText(
      texts.form.requiredMarker
    );

    // "Uszkodzony" is exactly 10 characters, below the 20-character minimum.
    await formPage.fillReason("Uszkodzony");
    await formPage.submit();
    await expect(formPage.errorFor("reason")).toHaveText(
      texts.validation.reasonComplaintMin
    );
  });

  test("return shows optional reason label without required marker", async ({
    page,
  }) => {
    const formPage = new FormPage(page);
    await formPage.goto();

    await formPage.chooseCaseType("return");
    const reasonLabel = page.locator('label[for="field-reason"]');
    await expect(reasonLabel).toHaveText(texts.form.reason.labelReturn);
    await expect(reasonLabel.locator('span[aria-hidden="true"]')).toHaveCount(
      0
    );
  });

  test("reason counter, reason and model name limits and date max", async ({
    page,
  }) => {
    const formPage = new FormPage(page);
    await formPage.goto();

    await formPage.fillReason("Hello");
    await expect(page.locator("#field-reason-counter")).toHaveText("5 / 2000");
    await expect(page.locator("#field-reason-counter")).toHaveText(
      formatCounter(5)
    );
    await expect(page.locator("#field-reason")).toHaveAttribute(
      "maxlength",
      "2000"
    );
    await expect(page.locator("#field-modelName")).toHaveAttribute(
      "maxlength",
      "100"
    );
    await expect(page.locator("#field-purchaseDate")).toHaveAttribute(
      "max",
      todayInWarsaw()
    );
  });
});

test.describe("E-02 @smoke photo rules", () => {
  test("uploaded photo shows thumbnail, file name and remove action", async ({
    page,
  }) => {
    const formPage = new FormPage(page);
    await formPage.goto();

    await formPage.uploadPhoto("laptop-1.png");

    await expect(
      page.getByRole("img", { name: texts.form.photo.previewAlt })
    ).toBeVisible();
    await expect(page.getByText("laptop-1.png", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { exact: true, name: texts.form.photo.remove })
    ).toBeVisible();
    await expect(formPage.errorFor("photo")).toHaveCount(0);
  });

  test("a new photo replaces the previous one", async ({ page }) => {
    const formPage = new FormPage(page);
    await formPage.goto();

    await formPage.uploadPhoto("laptop-1.png");
    await expect(page.getByText("laptop-1.png", { exact: true })).toBeVisible();
    await formPage.uploadPhoto("laptop-2.webp");

    await expect(
      page.getByText("laptop-2.webp", { exact: true })
    ).toBeVisible();
    await expect(page.getByText("laptop-1.png", { exact: true })).toHaveCount(
      0
    );
    await expect(
      page.getByRole("img", { name: texts.form.photo.previewAlt })
    ).toHaveCount(1);
  });

  test("remove deletes the thumbnail", async ({ page }) => {
    const formPage = new FormPage(page);
    await formPage.goto();

    await formPage.uploadPhoto("laptop-2.webp");
    await expect(
      page.getByRole("img", { name: texts.form.photo.previewAlt })
    ).toBeVisible();
    await formPage.removePhoto();

    await expect(
      page.getByRole("img", { name: texts.form.photo.previewAlt })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { exact: true, name: texts.form.photo.remove })
    ).toHaveCount(0);
  });

  test("photo hint follows the selected case type", async ({ page }) => {
    const formPage = new FormPage(page);
    await formPage.goto();

    await expect(page.getByText(texts.form.photo.hints.return)).toHaveCount(0);
    await expect(page.getByText(texts.form.photo.hints.complaint)).toHaveCount(
      0
    );

    await formPage.chooseCaseType("return");
    await expect(page.getByText(texts.form.photo.hints.return)).toBeVisible();

    await formPage.chooseCaseType("complaint");
    await expect(
      page.getByText(texts.form.photo.hints.complaint)
    ).toBeVisible();
    await expect(page.getByText(texts.form.photo.hints.return)).toHaveCount(0);
  });
});

test.describe("E-02 photo rejection cases", () => {
  const HEIC_REASON =
    "Requires a real HEIC photo / a real photo > 10 MB in assets/example-images (ADR-005 §3.2)";

  test.fixme("rejects HEIC (AC-11)", {
    annotation: { description: HEIC_REASON, type: "fixme" },
  }, async ({ page }) => {
    const formPage = new FormPage(page);
    await formPage.goto();
    await page
      .locator('input[type="file"]')
      .setInputFiles(
        `${process.cwd()}/../assets/example-images/REAL-HEIC-PHOTO-REQUIRED.heic`
      );
    await expect(formPage.errorFor("photo")).toHaveText(
      texts.validation.photoFormat
    );
  });

  test.fixme("rejects > 10 MB (AC-12)", {
    annotation: { description: HEIC_REASON, type: "fixme" },
  }, async ({ page }) => {
    const formPage = new FormPage(page);
    await formPage.goto();
    await page
      .locator('input[type="file"]')
      .setInputFiles(
        `${process.cwd()}/../assets/example-images/REAL-PHOTO-OVER-10MB-REQUIRED.jpg`
      );
    await expect(formPage.errorFor("photo")).toHaveText(
      texts.validation.photoTooLarge
    );
  });
});
