import type { TestInfo } from "@playwright/test";

/** Time-to-first-content limit from submit click to the decision card (AC-03). */
export const TTFC_LIMIT_MS = 60_000;

/** Records a measured time-to-first-content as a test annotation for the report. */
export function recordTtfc(testInfo: TestInfo, ms: number): void {
  testInfo.annotations.push({ description: String(ms), type: "ttfc_ms" });
}
