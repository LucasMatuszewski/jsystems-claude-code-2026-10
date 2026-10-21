import { describe, expect, it } from "vitest";
import type { DecisionLabel } from "@/lib/case/constants";
import { DECISION_LABELS } from "@/lib/case/constants";
import type { CaseUIMessage, SetDecisionPart } from "@/lib/case/messages";
import { isSetDecisionPart } from "@/lib/case/messages";
import {
  asStreaming,
  capturedFirstLabel,
  firstTurnMessages,
  followUpMessages,
  withInput,
  withLabel,
  withOutput,
  withoutOutput,
} from "@/tests/fixtures/messages/from-capture";
import { toDecisionView } from "./decision-view";

function setDecisionPartOf(message: CaseUIMessage): SetDecisionPart {
  const part = message.parts.find(isSetDecisionPart);
  if (!part) {
    throw new Error("expected a set_decision part");
  }
  return part;
}

const capturedFirstAssistant = firstTurnMessages[1] as CaseUIMessage;
const capturedFirstPart = setDecisionPartOf(capturedFirstAssistant);

/** Follow-up update variation: recorded change with previousLabel set. */
function updatedPart(
  previousLabel: DecisionLabel,
  label: DecisionLabel
): SetDecisionPart {
  const withNewLabel = withLabel(capturedFirstAssistant, label);
  const withFollowUpInput = withInput(withNewLabel, {
    changeReason: "Klient dostarczył dodatkowe informacje o opakowaniu.",
    greeting: null,
  });
  return setDecisionPartOf(
    withOutput(withFollowUpInput, {
      previousLabel,
      reason: null,
      recorded: true,
    })
  );
}

describe("toDecisionView", () => {
  it("maps the captured first-turn part to a non-update view", () => {
    const view = toDecisionView(capturedFirstPart);
    expect(view).not.toBeNull();
    expect(view?.label).toBe(capturedFirstLabel);
    expect(view?.previousLabel).toBeNull();
    expect(view?.isUpdate).toBe(false);
    expect(view?.changeReason).toBeNull();
    expect(view?.greeting).toEqual(expect.any(String));
    expect(view?.greeting?.trim().length).toBeGreaterThan(0);
  });

  it.each(
    DECISION_LABELS
  )("maps the label %s from a controlled variation of the captured part", (label) => {
    const part = setDecisionPartOf(withLabel(capturedFirstAssistant, label));
    expect(toDecisionView(part)?.label).toBe(label);
  });

  it("maps a recorded follow-up with previousLabel to an update view", () => {
    const view = toDecisionView(updatedPart("needs_info", "escalated"));
    expect(view).toEqual({
      changeReason: "Klient dostarczył dodatkowe informacje o opakowaniu.",
      greeting: null,
      isUpdate: true,
      label: "escalated",
      previousLabel: "needs_info",
    });
  });

  it("returns null when the output is not recorded", () => {
    const unrecorded = setDecisionPartOf(
      withOutput(capturedFirstAssistant, {
        previousLabel: "needs_info",
        reason: null,
        recorded: false,
      })
    );
    expect(toDecisionView(unrecorded)).toBeNull();
  });

  it("returns null while the input is only available (no output yet)", () => {
    const part = setDecisionPartOf(withoutOutput(capturedFirstAssistant));
    expect(toDecisionView(part)).toBeNull();
  });

  it("returns null while the input is still streaming", () => {
    const part = setDecisionPartOf(asStreaming(capturedFirstAssistant));
    expect(toDecisionView(part)).toBeNull();
  });

  it("is derived from the captured follow-up messages without a second decision", () => {
    const decisionParts = followUpMessages.flatMap((message) =>
      message.parts.filter(isSetDecisionPart)
    );
    expect(decisionParts).toHaveLength(1);
  });
});
