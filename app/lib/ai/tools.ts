import "server-only";
import { tool } from "ai";
import type { DecisionLabel } from "@/lib/case/constants";
import {
  type SetDecisionOutput,
  setDecisionFirstInputSchema,
  setDecisionFollowUpInputSchema,
  setDecisionOutputSchema,
} from "@/lib/case/messages";
import type { DecisionTurn } from "./prompts/decision-agent";

const DESCRIPTION =
  "Record the preliminary decision for this case. Call it exactly once in the first reply, and in later replies only when the decision changes.";

function execute(
  turn: DecisionTurn,
  currentLabel: DecisionLabel | null,
  label: DecisionLabel
): SetDecisionOutput {
  if (turn === "first") {
    return { previousLabel: null, reason: null, recorded: true };
  }
  if (label !== currentLabel) {
    return { previousLabel: currentLabel, reason: null, recorded: true };
  }
  return { previousLabel: currentLabel, reason: "unchanged", recorded: false };
}

/** Pure `set_decision` tool; the turn picks the input schema (ADR-002 §3.4). */
export function createSetDecisionTool(
  turn: DecisionTurn,
  currentLabel: DecisionLabel | null
) {
  return tool({
    description: DESCRIPTION,
    execute: (input: { label: DecisionLabel }) =>
      execute(turn, currentLabel, input.label),
    inputSchema:
      turn === "first"
        ? setDecisionFirstInputSchema
        : setDecisionFollowUpInputSchema,
    outputSchema: setDecisionOutputSchema,
  });
}
