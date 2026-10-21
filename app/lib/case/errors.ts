import { z } from "zod";
import { texts } from "./texts";

export const APP_ERROR_CODES = [
  "VALIDATION_ERROR",
  "PHOTO_REQUIRED",
  "UNSUPPORTED_IMAGE_TYPE",
  "PHOTO_TOO_LARGE",
  "UNSUPPORTED_CONTENT_TYPE",
  "REQUEST_TOO_LARGE",
  "ANALYSIS_FAILED",
  "ANALYSIS_TIMEOUT",
  "CONFIGURATION_ERROR",
  "NOT_IMPLEMENTED",
  "DECISION_FAILED",
  "DECISION_TIMEOUT",
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

/** In-stream codes never go in an HTTP envelope. */
export type HttpErrorCode = Exclude<
  AppErrorCode,
  "DECISION_FAILED" | "DECISION_TIMEOUT"
>;

export const HTTP_STATUS: Record<HttpErrorCode, number> = {
  ANALYSIS_FAILED: 502,
  ANALYSIS_TIMEOUT: 504,
  CONFIGURATION_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  PHOTO_REQUIRED: 400,
  PHOTO_TOO_LARGE: 413,
  REQUEST_TOO_LARGE: 413,
  UNSUPPORTED_CONTENT_TYPE: 415,
  UNSUPPORTED_IMAGE_TYPE: 415,
  VALIDATION_ERROR: 400,
};

export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.enum(APP_ERROR_CODES),
    fields: z.record(z.string(), z.string()).optional(),
    message: z.string().min(1),
  }),
});
export type ErrorEnvelope = z.output<typeof errorEnvelopeSchema>;

export function isAppErrorCode(value: unknown): value is AppErrorCode {
  return (
    typeof value === "string" &&
    (APP_ERROR_CODES as readonly string[]).includes(value)
  );
}

/**
 * JSON error response with the shared envelope. The status comes from
 * HTTP_STATUS and the message from texts.errors; `fields` is included only
 * when given.
 */
export function errorResponse(
  code: HttpErrorCode,
  fields?: Record<string, string>
): Response {
  const error: ErrorEnvelope["error"] = {
    code,
    message: texts.errors[code],
  };
  if (fields !== undefined) {
    error.fields = fields;
  }
  return new Response(JSON.stringify({ error } satisfies ErrorEnvelope), {
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    },
    status: HTTP_STATUS[code],
  });
}
