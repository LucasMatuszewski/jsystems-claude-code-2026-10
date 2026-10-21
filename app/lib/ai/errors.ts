import "server-only";
import { ConfigurationError } from "./env";

export type AiErrorCode =
  | "ANALYSIS_FAILED"
  | "ANALYSIS_TIMEOUT"
  | "DECISION_FAILED"
  | "DECISION_TIMEOUT"
  | "CONFIGURATION_ERROR";

/** Error raised by AI calls; `code` is the only detail that may leave the server. */
export class AiError extends Error {
  readonly code: AiErrorCode;

  constructor(code: AiErrorCode, options?: { cause?: unknown }) {
    super(code, options);
    this.name = "AiError";
    this.code = code;
  }
}

const TIMEOUT_NAMES: ReadonlySet<string> = new Set([
  "AbortError",
  "TimeoutError",
]);
const MAX_CAUSE_DEPTH = 5;

/** True for AbortError / TimeoutError, including errors nested in `cause`. */
export function isTimeoutOrAbort(error: unknown, depth = 0): boolean {
  if (error === null || typeof error !== "object") {
    return false;
  }
  const { name, cause } = error as { name?: unknown; cause?: unknown };
  if (typeof name === "string" && TIMEOUT_NAMES.has(name)) {
    return true;
  }
  if (depth >= MAX_CAUSE_DEPTH) {
    return false;
  }
  return cause !== undefined && isTimeoutOrAbort(cause, depth + 1);
}

/** Maps any error from an AI call to the public error code for its phase. */
export function toAiErrorCode(
  error: unknown,
  phase: "analysis" | "decision"
): AiErrorCode {
  if (error instanceof ConfigurationError) {
    return "CONFIGURATION_ERROR";
  }
  if (isTimeoutOrAbort(error)) {
    return phase === "analysis" ? "ANALYSIS_TIMEOUT" : "DECISION_TIMEOUT";
  }
  return phase === "analysis" ? "ANALYSIS_FAILED" : "DECISION_FAILED";
}
