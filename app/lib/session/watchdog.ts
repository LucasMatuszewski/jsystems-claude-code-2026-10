import { type CaseUIMessage, isSetDecisionPart } from "@/lib/case/messages";

export const FOLLOW_UP_DEADLINE_MS = 60_000;

/**
 * ADR-004 §3.3 "first content part": a tool-set_decision part in any state, or
 * a text part with non-empty text. step-start, reasoning, source and metadata
 * never count.
 */
export function hasFirstContent(message: CaseUIMessage | undefined): boolean {
  if (message === undefined) {
    return false;
  }
  return message.parts.some(
    (part) =>
      isSetDecisionPart(part) || (part.type === "text" && part.text.length > 0)
  );
}

/** A tool-set_decision part in state output-available with output.recorded === true. */
export function hasRecordedDecision(
  message: CaseUIMessage | undefined
): boolean {
  if (message === undefined) {
    return false;
  }
  return message.parts.some(
    (part) =>
      isSetDecisionPart(part) &&
      part.state === "output-available" &&
      part.output.recorded === true
  );
}
