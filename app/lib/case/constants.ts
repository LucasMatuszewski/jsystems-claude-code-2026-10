import { texts } from "./texts";

export { REASON_MAX } from "./texts";

export const CASE_TYPES = ["return", "complaint"] as const;
export const PURCHASE_CHANNELS = ["online", "in_store"] as const;
/** Order matches AC-04. */
export const CATEGORIES = [
  "smartphone",
  "laptop",
  "tablet",
  "desktop",
  "monitor",
  "tv",
  "audio",
  "console",
  "other",
] as const;
export const DECISION_LABELS = [
  "accepted",
  "rejected",
  "needs_info",
  "escalated",
] as const;

export type CaseType = (typeof CASE_TYPES)[number];
export type PurchaseChannel = (typeof PURCHASE_CHANNELS)[number];
export type Category = (typeof CATEGORIES)[number];
export type DecisionLabel = (typeof DECISION_LABELS)[number];

export const MODEL_NAME_MIN = 2;
export const MODEL_NAME_MAX = 100;
export const REASON_COMPLAINT_MIN = 20;
export const CHAT_MESSAGE_MAX = 2000;

export const CASE_TYPE_LABELS: Record<CaseType, string> =
  texts.form.caseType.options;
export const PURCHASE_CHANNEL_LABELS: Record<PurchaseChannel, string> =
  texts.form.purchaseChannel.options;
export const CATEGORY_LABELS: Record<Category, string> =
  texts.form.category.options;
export const DECISION_LABEL_TEXTS: Record<DecisionLabel, string> =
  texts.decision.labels;
