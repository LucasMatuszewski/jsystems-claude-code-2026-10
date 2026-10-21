import type { UIMessage } from "ai";
import { z } from "zod";
import { DECISION_LABELS } from "./constants";

/** Shared (client + server) chat message contracts. Must not import from lib/ai/. */

export const MESSAGE_KINDS = ["case-submission", "follow-up"] as const;

export const caseMessageMetadataSchema = z.object({
  kind: z.enum(MESSAGE_KINDS),
});
export type CaseMessageMetadata = z.output<typeof caseMessageMetadataSchema>;

export const SET_DECISION_TOOL_NAME = "set_decision";

const labelSchema = z.enum(DECISION_LABELS);

/** First turn: greeting required (1–200 chars, trimmed non-empty), changeReason must be null. */
export const setDecisionFirstInputSchema = z.object({
  changeReason: z.null(),
  greeting: z.string().trim().min(1).max(200),
  label: labelSchema,
});

/** Follow-up: greeting null, changeReason 1–300 chars. */
export const setDecisionFollowUpInputSchema = z.object({
  changeReason: z.string().trim().min(1).max(300),
  greeting: z.null(),
  label: labelSchema,
});

/** Superset accepted when validating history. */
export const setDecisionHistoryInputSchema = z.object({
  changeReason: z.string().max(300).nullable(),
  greeting: z.string().max(200).nullable(),
  label: labelSchema,
});

export const setDecisionOutputSchema = z.object({
  previousLabel: labelSchema.nullable(),
  reason: z.literal("unchanged").nullable(),
  recorded: z.boolean(),
});

export type SetDecisionInput = z.output<typeof setDecisionHistoryInputSchema>;
export type SetDecisionOutput = z.output<typeof setDecisionOutputSchema>;

export type CaseTools = {
  set_decision: { input: SetDecisionInput; output: SetDecisionOutput };
};

export type CaseUIMessage = UIMessage<CaseMessageMetadata, never, CaseTools>;

export type SetDecisionPart = Extract<
  CaseUIMessage["parts"][number],
  { type: "tool-set_decision" }
>;

export function isSetDecisionPart(
  part: CaseUIMessage["parts"][number]
): part is SetDecisionPart {
  return part.type === "tool-set_decision";
}
