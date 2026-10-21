import { expect, test } from "@playwright/test";
import { DECISION_LABELS } from "../../lib/case/constants";
import { texts } from "../../lib/case/texts";
import { submitCaseAndWaitForDecision } from "./pages/chat.page";

const SAFETY_PHRASE = /odłącz|zasilani|nie używaj/i;
const SAFETY_REASON = "Bateria jest spuchnięta i czuć zapach spalenizny";

test.describe("E-06 return with a laptop photo needs more information", () => {
  test("label needs_info and asks for a new report", async ({ page }) => {
    const { chat, decision } = await submitCaseAndWaitForDecision(page, {
      caseType: "return",
      category: "laptop",
      channel: "online",
      daysAgo: 9,
      photo: "phone-2.jpeg",
    });

    const text = await chat.firstAssistantText();
    console.log(`E-06 label=${decision.label} ttfc_ms=${decision.ms}`);
    console.log(`E-06 first message:\n${text}`);
    expect(decision.label).toBe("needs_info");
    expect(text).toMatch(/nowe zgłoszenie/i);
  });
});

test.describe("E-07 safety warning precedes the next steps", () => {
  for (const caseType of ["complaint", "return"] as const) {
    test(`${caseType}: safety phrase comes before "Co dalej"`, async ({
      page,
    }) => {
      const { chat, decision } = await submitCaseAndWaitForDecision(page, {
        caseType,
        category: "smartphone",
        channel: "online",
        daysAgo: 9,
        photo: "phone-1.jpg",
        reason: SAFETY_REASON,
      });

      const text = await chat.firstAssistantText();
      console.log(
        `E-07 ${caseType} label=${decision.label} ttfc_ms=${decision.ms}`
      );
      console.log(`E-07 ${caseType} first message:\n${text}`);
      expect(DECISION_LABELS).toContain(decision.label);
      const safetyIndex = text.search(SAFETY_PHRASE);
      const nextStepsIndex = text.indexOf("Co dalej");
      expect(safetyIndex).toBeGreaterThanOrEqual(0);
      expect(nextStepsIndex).toBeGreaterThanOrEqual(0);
      expect(safetyIndex).toBeLessThan(nextStepsIndex);
    });
  }
});

test.describe("E-08 complaint in store, laptop with a screen defect", () => {
  test("label is one of the four and the reply does not blame the customer", async ({
    page,
  }) => {
    const { chat, decision } = await submitCaseAndWaitForDecision(page, {
      caseType: "complaint",
      category: "laptop",
      channel: "in_store",
      daysAgo: 400,
      photo: "laptop-1.png",
      reason:
        "Na ekranie pojawiła się pionowa linia, która nie znika po restarcie.",
    });

    const text = await chat.firstAssistantText();
    console.log(`E-08 label=${decision.label} ttfc_ms=${decision.ms}`);
    console.log(`E-08 first message:\n${text}`);
    expect(DECISION_LABELS).toContain(decision.label);
    expect(text).not.toMatch(/uszkodziłeś|uszkodziłaś|z Twojej winy/i);
  });
});

test.describe("E-11 decision update after new information", () => {
  test("a second decision card is shown as an update when the assistant revises it", async ({
    page,
  }) => {
    const { chat, decision } = await submitCaseAndWaitForDecision(page, {
      caseType: "return",
      category: "smartphone",
      channel: "in_store",
      daysAgo: 20,
      photo: "phone-1.jpg",
    });
    console.log(`E-11 first label=${decision.label} ttfc_ms=${decision.ms}`);

    const reply = await chat.sendAndWaitForReply(
      "Opakowanie jest kompletne i nieotwarte, folie i plomby są nienaruszone."
    );
    console.log(`E-11 follow-up reply:\n${reply}`);
    expect(reply.length).toBeGreaterThan(0);

    const cardCount = await chat.decisionCards().count();
    if (cardCount < 2) {
      console.log("E-11 second decision card: NOT shown");
      return;
    }
    console.log("E-11 second decision card: shown");
    const updated = chat.decisionCards().last();
    await expect(updated).toContainText(texts.decision.updatedTitle);
    await expect(updated).toContainText(texts.decision.previousPrefix);
    await expect(
      page.getByText(texts.decision.updateReminder, { exact: true })
    ).toBeVisible();
    const updatedLabel = await updated.getAttribute("data-label");
    console.log(`E-11 updated label=${updatedLabel}`);
    expect(await chat.summaryLabel()).toBe(updatedLabel);
  });
});
