import type { Page } from "@playwright/test";
import type {
  CaseType,
  Category,
  PurchaseChannel,
} from "../../../lib/case/constants";
import { todayInWarsaw } from "../../../lib/case/days";
import { texts } from "../../../lib/case/texts";
import { type ExamplePhotoName, examplePhotoPath } from "../helpers/photos";

export type FormField =
  | "caseType"
  | "purchaseChannel"
  | "category"
  | "modelName"
  | "purchaseDate"
  | "reason"
  | "photo";

const DAY_MS = 86_400_000;

/** ISO calendar date (YYYY-MM-DD) that is `days` before today in Europe/Warsaw. */
export function isoDaysAgo(days: number): string {
  const [year = 1970, month = 1, day = 1] = todayInWarsaw()
    .split("-")
    .map(Number);
  const utc = Date.UTC(year, month - 1, day) - days * DAY_MS;
  return new Date(utc).toISOString().slice(0, 10);
}

export class FormPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  async chooseCaseType(caseType: CaseType): Promise<void> {
    await this.page
      .getByRole("radio", {
        exact: true,
        name: texts.form.caseType.options[caseType],
      })
      .click();
  }

  async chooseChannel(channel: PurchaseChannel): Promise<void> {
    await this.page
      .getByRole("radio", {
        exact: true,
        name: texts.form.purchaseChannel.options[channel],
      })
      .click();
  }

  async chooseCategory(category: Category): Promise<void> {
    await this.page.locator("#field-category").click();
    await this.page
      .getByRole("option", {
        exact: true,
        name: texts.form.category.options[category],
      })
      .click();
  }

  async fillModel(text: string): Promise<void> {
    await this.page.locator("#field-modelName").fill(text);
  }

  async fillPurchaseDate(iso: string): Promise<void> {
    await this.page.locator("#field-purchaseDate").fill(iso);
  }

  async fillReason(text: string): Promise<void> {
    await this.page.locator("#field-reason").fill(text);
  }

  async uploadPhoto(fileName: ExamplePhotoName): Promise<void> {
    await this.page
      .locator('input[type="file"]')
      .setInputFiles(examplePhotoPath(fileName));
  }

  async removePhoto(): Promise<void> {
    await this.page
      .getByRole("button", { exact: true, name: texts.form.photo.remove })
      .click();
  }

  async submit(): Promise<void> {
    await this.page
      .getByRole("button", { exact: true, name: texts.form.submit })
      .click();
  }

  errorFor(field: FormField) {
    return this.page.locator(`#field-${field}-error`);
  }

  async fillValid(values: {
    caseType: CaseType;
    channel: PurchaseChannel;
    category: Category;
    daysAgo: number;
    reason?: string;
    photo: ExamplePhotoName;
  }): Promise<void> {
    await this.chooseCaseType(values.caseType);
    await this.chooseChannel(values.channel);
    await this.chooseCategory(values.category);
    await this.fillModel("Model testowy");
    await this.fillPurchaseDate(isoDaysAgo(values.daysAgo));
    if (values.reason !== undefined) {
      await this.fillReason(values.reason);
    }
    await this.uploadPhoto(values.photo);
  }
}
