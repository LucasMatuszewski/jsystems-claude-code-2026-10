import { expect, test } from "@playwright/test";
import { texts } from "../../lib/case/texts";
import { recordTtfc, TTFC_LIMIT_MS } from "./helpers/timing";
import { submitCaseAndWaitForDecision } from "./pages/chat.page";

const POLICY_REFERENCE = /§\s?\d+( ust\. \d+)?/;

test.describe("E-03 @smoke return online, phone with photo gets a decision", () => {
  test("decision card, first message structure, disclaimer, summary and TTFC", async ({
    page,
  }, testInfo) => {
    const { chat, decision } = await submitCaseAndWaitForDecision(page, {
      caseType: "return",
      category: "smartphone",
      channel: "online",
      daysAgo: 9,
      photo: "phone-1.jpg",
    });

    await expect(chat.chatScreen()).toBeVisible();
    expect(["accepted", "rejected", "needs_info", "escalated"]).toContain(
      decision.label
    );
    recordTtfc(testInfo, decision.ms);
    expect(decision.ms).toBeLessThan(TTFC_LIMIT_MS);

    const firstText = await chat.firstAssistantText();
    console.log(`E-03 label=${decision.label} ttfc_ms=${decision.ms}`);
    console.log(`E-03 first message:\n${firstText}`);

    const firstMessage = chat.assistantMessages().first();
    await expect(firstMessage).toContainText(texts.chat.assistantLabel);
    expect(firstText).toContain("Uzasadnienie");
    expect(firstText).toContain("Co dalej");
    await expect(firstMessage.locator("ol")).not.toHaveCount(0);
    expect(firstText).toMatch(POLICY_REFERENCE);

    await expect(chat.disclaimer()).toHaveCount(1);
    await expect(chat.disclaimer()).toHaveText(texts.decision.disclaimer);

    await expect(chat.summaryDecision()).toHaveAttribute(
      "data-label",
      decision.label
    );
    await expect(chat.summaryDays()).toHaveText("9");
  });
});

test.describe("E-04 return online, 40 days, repeated failure leads to rejection", () => {
  test("label rejected and the reply mentions a complaint (reklamacja)", async ({
    page,
  }) => {
    const { chat, decision } = await submitCaseAndWaitForDecision(page, {
      caseType: "return",
      category: "smartphone",
      channel: "online",
      daysAgo: 40,
      photo: "phone-1.jpg",
      reason:
        "Telefon od kilku dni sam się restartuje i nie da się z niego normalnie korzystać.",
    });

    const text = await chat.firstAssistantText();
    console.log(`E-04 label=${decision.label} ttfc_ms=${decision.ms}`);
    console.log(`E-04 first message:\n${text}`);
    expect(decision.label).toBe("rejected");
    expect(text).toMatch(/reklamac/i);
  });
});

test.describe("E-05 complaint online, 800 days old device, warranty rule", () => {
  test("label rejected, cites § 2 ust. 3 and mentions the warranty", async ({
    page,
  }) => {
    const { chat, decision } = await submitCaseAndWaitForDecision(page, {
      caseType: "complaint",
      category: "smartphone",
      channel: "online",
      daysAgo: 800,
      photo: "phone-3.jpeg",
      reason:
        "Telefon przestał się ładować i nie reaguje na podłączenie ładowarki.",
    });

    const text = await chat.firstAssistantText();
    console.log(`E-05 label=${decision.label} ttfc_ms=${decision.ms}`);
    console.log(`E-05 first message:\n${text}`);
    expect(decision.label).toBe("rejected");
    expect(text).toMatch(/§\s?2 ust\. 3/);
    expect(text).toMatch(/gwarancj/i);
  });
});
