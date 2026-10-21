import { describe, expect, it } from "vitest";
import type { CaseUIMessage } from "../../../lib/case/messages";
import { isSetDecisionPart } from "../../../lib/case/messages";
import {
  asStreaming,
  capturedFirstLabel,
  firstTurnMessages,
  followUpMessages,
  withLabel,
  withoutOutput,
} from "./from-capture";

describe("firstTurnMessages (derived from the C-04 capture)", () => {
  it("is [hidden case submission, assistant reply]", () => {
    expect(firstTurnMessages).toHaveLength(2);
    const [submission, assistant] = firstTurnMessages;
    expect(submission?.role).toBe("user");
    expect(submission?.metadata?.kind).toBe("case-submission");
    expect(assistant?.role).toBe("assistant");
  });

  it("assistant has a set_decision part in output-available with recorded=true before a text part", () => {
    const assistant = firstTurnMessages[1] as CaseUIMessage;
    const decisionIndex = assistant.parts.findIndex(isSetDecisionPart);
    const textIndex = assistant.parts.findIndex((part) => part.type === "text");
    expect(decisionIndex).toBeGreaterThanOrEqual(0);
    expect(textIndex).toBeGreaterThan(decisionIndex);

    const decision = assistant.parts[decisionIndex];
    if (!decision || !isSetDecisionPart(decision)) {
      throw new Error("expected a set_decision part");
    }
    expect(decision.state).toBe("output-available");
    expect(decision.output).toMatchObject({ recorded: true });
  });

  it("takes greeting and label from the captured tool input", () => {
    const assistant = firstTurnMessages[1] as CaseUIMessage;
    const decision = assistant.parts.find(isSetDecisionPart);
    if (!decision || !isSetDecisionPart(decision)) {
      throw new Error("expected a set_decision part");
    }
    expect(decision.input.changeReason).toBeNull();
    expect(decision.input.greeting).toBe(
      "Dziękuję za zgłoszenie — sprawdziłem widoczne informacje o telefonie."
    );
    expect(decision.input.label).toBe(capturedFirstLabel);
  });

  it("assistant text starts with the captured Markdown heading", () => {
    const assistant = firstTurnMessages[1] as CaseUIMessage;
    const text = assistant.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("");
    expect(text.startsWith("## Uzasadnienie")).toBe(true);
    expect(text).toContain("## Co dalej");
  });
});

describe("followUpMessages (derived from the C-05 capture)", () => {
  it("is the first turn followed by the captured user follow-up and assistant reply", () => {
    expect(followUpMessages).toHaveLength(firstTurnMessages.length + 2);
    expect(followUpMessages.slice(0, firstTurnMessages.length)).toEqual(
      firstTurnMessages
    );
    const userFollowUp = followUpMessages.at(-2);
    const assistantFollowUp = followUpMessages.at(-1);
    expect(userFollowUp?.role).toBe("user");
    expect(userFollowUp?.metadata?.kind).toBe("follow-up");
    expect(userFollowUp?.parts).toEqual([
      {
        text: "Opakowanie jest kompletne i nieotwarte, folie i plomby są nienaruszone.",
        type: "text",
      },
    ]);
    expect(assistantFollowUp?.role).toBe("assistant");
    expect(
      assistantFollowUp?.parts.some((part) => isSetDecisionPart(part))
    ).toBe(false);
    expect(
      assistantFollowUp?.parts.some(
        (part) => part.type === "text" && part.text.length > 0
      )
    ).toBe(true);
  });
});

describe("controlled variations of the captured part", () => {
  it("withLabel changes only input.label", () => {
    const assistant = firstTurnMessages[1] as CaseUIMessage;
    const original = assistant.parts.find(isSetDecisionPart);
    const changed = withLabel(assistant, "rejected").parts.find(
      isSetDecisionPart
    );
    if (!(original && changed && isSetDecisionPart(changed))) {
      throw new Error("expected set_decision parts");
    }
    expect(changed.input).toEqual({ ...original.input, label: "rejected" });
    expect(changed.output).toEqual(original.output);
  });

  it("withoutOutput sets state input-available and drops output", () => {
    const assistant = withoutOutput(firstTurnMessages[1] as CaseUIMessage);
    const part = assistant.parts.find(isSetDecisionPart);
    expect(part?.state).toBe("input-available");
    expect(part && "output" in part).toBe(false);
  });

  it("asStreaming sets state input-streaming", () => {
    const assistant = asStreaming(firstTurnMessages[1] as CaseUIMessage);
    const part = assistant.parts.find(isSetDecisionPart);
    expect(part?.state).toBe("input-streaming");
  });
});
