import { daysSincePurchase, todayInWarsaw } from "../../../lib/case/days";

export type CaseTypeValue = "return" | "complaint";
export type PurchaseChannelValue = "online" | "in_store";

export const SYNTHETIC_MODEL_NAME = "Testowy Model X1";
export const SYNTHETIC_COMPLAINT_REASON =
  "Urządzenie przestało działać poprawnie kilka dni temu, proszę o ocenę zgłoszenia.";

/** YYYY-MM-DD that is `n` calendar days before today in Europe/Warsaw. */
export function purchaseDateDaysAgo(n: number, now: Date = new Date()): string {
  const today = todayInWarsaw(now);
  const [year = 0, month = 1, day = 1] = today.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day - n));
  return utc.toISOString().slice(0, 10);
}

export type FormFields = {
  caseType: CaseTypeValue;
  purchaseChannel: PurchaseChannelValue;
  category: string;
  modelName: string;
  purchaseDate: string;
  reason: string;
};

/** Synthetic multipart text fields for a case (ADR-003 §5.1). */
export function formFields(options: {
  caseType: CaseTypeValue;
  purchaseChannel: PurchaseChannelValue;
  category: string;
  daysAgo: number;
  reason?: string;
}): FormFields {
  const reason =
    options.reason ??
    (options.caseType === "complaint" ? SYNTHETIC_COMPLAINT_REASON : "");
  return {
    caseType: options.caseType,
    category: options.category,
    modelName: SYNTHETIC_MODEL_NAME,
    purchaseChannel: options.purchaseChannel,
    purchaseDate: purchaseDateDaysAgo(options.daysAgo),
    reason,
  };
}

/** The test's own day count, to compare with the server's daysSincePurchase. */
export function expectedDaysSincePurchase(purchaseDate: string): number {
  return daysSincePurchase(purchaseDate, todayInWarsaw());
}
