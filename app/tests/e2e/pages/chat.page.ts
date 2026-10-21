import { expect, type Locator, type Page } from "@playwright/test";
import {
  DECISION_LABELS,
  type DecisionLabel,
} from "../../../lib/case/constants";
import { texts } from "../../../lib/case/texts";
import { FormPage } from "./form.page";

/** Upper bound for waiting on a decision; the TTFC assertion (< 60 s) is made by the specs. */
const DECISION_WAIT_MS = 65_000;
const REPLY_WAIT_MS = 120_000;

export type Decision = { label: DecisionLabel; ms: number };

export function isDecisionLabel(value: string | null): value is DecisionLabel {
  return DECISION_LABELS.some((label) => label === value);
}

/** Page object for the chat screen. Only passive observation and real user actions. */
export class ChatPage {
  private readonly page: Page;
  private submittedAt = 0;

  constructor(page: Page) {
    this.page = page;
  }

  /** Visible instance of a locator (the summary is rendered twice: mobile collapsible and desktop aside). */
  private visible(locator: Locator): Locator {
    return locator.locator("visible=true");
  }

  chatScreen(): Locator {
    return this.page.getByTestId("chat-screen");
  }

  formScreen(): Locator {
    return this.page.getByTestId("form-screen");
  }

  decisionCards(): Locator {
    return this.page.getByTestId("decision-card");
  }

  assistantMessages(): Locator {
    return this.page.getByTestId("assistant-message");
  }

  userMessages(): Locator {
    return this.page.getByTestId("user-message");
  }

  disclaimer(): Locator {
    return this.page.getByTestId("disclaimer");
  }

  input(): Locator {
    return this.page.getByLabel(texts.chat.inputLabel, { exact: true });
  }

  sendButton(): Locator {
    return this.page.getByRole("button", {
      exact: true,
      name: texts.chat.send,
    });
  }

  stopButton(): Locator {
    return this.page.getByRole("button", {
      exact: true,
      name: texts.chat.stop,
    });
  }

  summaryDecision(): Locator {
    return this.visible(this.page.getByTestId("summary-decision"));
  }

  /** The value cell (dd) of the summary row labelled "Dni od zakupu". */
  summaryDays(): Locator {
    return this.visible(
      this.page
        .getByText(texts.summary.daysSincePurchase, { exact: true })
        .locator("xpath=..")
        .locator("dd")
    );
  }

  photoThumbnail(): Locator {
    return this.visible(
      this.page.getByRole("button", {
        exact: true,
        name: texts.summary.photoOpen,
      })
    );
  }

  summaryToggle(): Locator {
    return this.page.getByRole("button", {
      name: new RegExp(texts.summary.toggle),
    });
  }

  newCaseButton(): Locator {
    return this.page.getByRole("button", {
      exact: true,
      name: texts.chat.newCase,
    });
  }

  /** Remembers the moment of the submit click so TTFC can be measured. */
  async submitCase(form: FormPage): Promise<void> {
    this.submittedAt = Date.now();
    await form.submit();
  }

  /** Waits for the processing steps in order: analyzing, then deciding. */
  async expectProcessingSteps(): Promise<void> {
    await expect(
      this.page.getByText(texts.processing.analyzing, { exact: true }).first()
    ).toBeVisible();
    await expect(
      this.page.getByText(texts.processing.deciding, { exact: true }).first()
    ).toBeVisible();
  }

  /** Waits for the first decision card after the last submitCase(); returns its label and TTFC in ms. */
  async waitForDecision(): Promise<Decision> {
    const card = this.decisionCards().first();
    await expect(card).toBeVisible({ timeout: DECISION_WAIT_MS });
    const ms = Date.now() - this.submittedAt;
    const label = await card.getAttribute("data-label");
    if (!isDecisionLabel(label)) {
      throw new Error(`decision card has unexpected data-label: ${label}`);
    }
    return { label, ms };
  }

  /** Waits until the assistant has finished streaming (the stop button is gone). */
  async waitForIdle(): Promise<void> {
    await expect(this.stopButton()).toHaveCount(0, { timeout: REPLY_WAIT_MS });
  }

  async firstAssistantText(): Promise<string> {
    await this.waitForIdle();
    return (await this.assistantMessages().first().innerText()).trim();
  }

  async lastAssistantText(): Promise<string> {
    await this.waitForIdle();
    return (await this.assistantMessages().last().innerText()).trim();
  }

  /** Types a message and sends it with the send button, then returns the new last assistant reply. */
  async sendAndWaitForReply(text: string): Promise<string> {
    const before = await this.assistantMessages().count();
    await this.input().fill(text);
    await this.sendButton().click();
    await expect(this.assistantMessages()).toHaveCount(before + 1, {
      timeout: REPLY_WAIT_MS,
    });
    return this.lastAssistantText();
  }

  async sendMessage(text: string): Promise<void> {
    await this.input().fill(text);
    await this.sendButton().click();
  }

  summaryLabel(): Promise<string | null> {
    return this.summaryDecision().getAttribute("data-label");
  }

  async openNewCaseDialog(): Promise<void> {
    await this.newCaseButton().click();
    await expect(this.newCaseDialog()).toBeVisible();
  }

  newCaseDialog(): Locator {
    return this.page
      .getByRole("alertdialog")
      .or(this.page.getByRole("dialog"))
      .filter({ hasText: texts.newCaseDialog.title });
  }

  /** Opens the summary photo overlay, expanding the mobile collapsible first when needed. */
  async openPhotoOverlay(): Promise<void> {
    if (!(await this.photoThumbnail().isVisible())) {
      await this.summaryToggle().click();
    }
    await this.photoThumbnail().click();
  }
}

/** Fills and submits the case form, waits for the processing steps and the first decision. */
export async function submitCaseAndWaitForDecision(
  page: Page,
  values: Parameters<FormPage["fillValid"]>[0]
): Promise<{ chat: ChatPage; form: FormPage; decision: Decision }> {
  const form = new FormPage(page);
  const chat = new ChatPage(page);
  await form.goto();
  await form.fillValid(values);
  await chat.submitCase(form);
  await chat.expectProcessingSteps();
  const decision = await chat.waitForDecision();
  return { chat, decision, form };
}
