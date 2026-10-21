import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DecisionCard } from "@/components/chat/decision-card";
import type { DecisionView } from "@/components/chat/decision-view";
import { toDecisionView } from "@/components/chat/decision-view";
import { DECISION_LABELS } from "@/lib/case/constants";
import { decisionLabelText } from "@/lib/case/labels";
import type { CaseUIMessage, SetDecisionPart } from "@/lib/case/messages";
import { isSetDecisionPart } from "@/lib/case/messages";
import { texts } from "@/lib/case/texts";
import {
  firstTurnMessages,
  withInput,
  withLabel,
  withOutput,
} from "@/tests/fixtures/messages/from-capture";

afterEach(cleanup);

function viewOf(message: CaseUIMessage): DecisionView {
  const part = message.parts.find(isSetDecisionPart) as SetDecisionPart;
  const view = toDecisionView(part);
  if (!view) {
    throw new Error("expected a decision view");
  }
  return view;
}

const capturedFirstAssistant = firstTurnMessages[1] as CaseUIMessage;

describe("DecisionCard (first decision)", () => {
  it.each(
    DECISION_LABELS
  )("renders the title, label text and data-label for %s", (label) => {
    const view = viewOf(withLabel(capturedFirstAssistant, label));
    const { container } = render(<DecisionCard view={view} />);

    expect(
      screen.getByRole("heading", { level: 3, name: texts.decision.title })
    ).toBeInTheDocument();
    expect(screen.getByText(decisionLabelText(label))).toBeInTheDocument();
    const root = container.querySelector('[data-testid="decision-card"]');
    expect(root).toHaveAttribute("data-label", label);
    expect(
      screen.queryByText(texts.decision.previousPrefix, { exact: false })
    ).toBeNull();
  });
});

describe("DecisionCard (updated decision)", () => {
  it("renders the updated title, previous label, change reason and reminder", () => {
    const base = withInput(capturedFirstAssistant, {
      changeReason: "Klient dostarczył zdjęcie opakowania.",
      greeting: null,
    });
    const updated = withOutput(base, {
      previousLabel: "rejected",
      reason: null,
      recorded: true,
    });
    const view = viewOf(withLabel(updated, "needs_info"));
    expect(view.isUpdate).toBe(true);

    render(<DecisionCard view={view} />);

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: texts.decision.updatedTitle,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `${texts.decision.previousPrefix} ${decisionLabelText("rejected")}`
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Klient dostarczył zdjęcie opakowania.")
    ).toBeInTheDocument();
    expect(screen.getByText(texts.decision.updateReminder)).toBeInTheDocument();
    expect(
      screen.getByText(decisionLabelText("needs_info"))
    ).toBeInTheDocument();
  });
});
