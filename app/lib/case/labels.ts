import { DECISION_LABEL_TEXTS, type DecisionLabel } from "./constants";
import { type CaseUIMessage, isSetDecisionPart } from "./messages";

/**
 * ADR-002 §3.4: scan assistant messages newest → oldest; first `tool-set_decision` part in state
 * "output-available" with output.recorded === true → its input.label.
 * Within one message, the LAST qualifying part wins. Null if none.
 */
export function deriveCurrentLabel(
  messages: readonly CaseUIMessage[]
): DecisionLabel | null {
  for (const message of [...messages].reverse()) {
    if (message.role !== "assistant") {
      continue;
    }
    for (const part of [...message.parts].reverse()) {
      if (
        isSetDecisionPart(part) &&
        part.state === "output-available" &&
        part.output.recorded === true
      ) {
        return part.input.label;
      }
    }
  }
  return null;
}

export function decisionLabelText(label: DecisionLabel): string {
  return DECISION_LABEL_TEXTS[label];
}
