import { type AppErrorCode, errorEnvelopeSchema } from "@/lib/case/errors";
import {
  analyzeResponseSchema,
  type CaseContext,
  type CaseForm,
  type ImageAnalysis,
} from "@/lib/case/schemas";
import type { SubmissionError } from "@/lib/session/state";

/** Client-side deadline for the whole submission (ADR-004 §3.3). */
export const SUBMISSION_DEADLINE_MS = 60_000;

export type SubmitDeps = {
  reduce: (file: Blob) => Promise<{ blob: Blob }>;
  fetch: typeof fetch;
  createObjectURL: (b: Blob) => string;
};

export type SubmitResult =
  | {
      ok: true;
      caseContext: CaseContext;
      imageAnalysis: ImageAnalysis;
      reducedPhoto: { blob: Blob; url: string };
    }
  | { ok: false; code: SubmissionError };

const fail = (code: SubmissionError): SubmitResult => ({ code, ok: false });

/**
 * Pure-ish pipeline (no React): reduce → FormData (fields + photo File "photo.jpg" image/jpeg)
 * → POST /api/analyze with signal → validate.
 */
export async function submitCase(
  values: CaseForm,
  photo: File,
  signal: AbortSignal,
  deps: SubmitDeps
): Promise<SubmitResult> {
  if (signal.aborted) {
    return fail("ANALYSIS_TIMEOUT");
  }

  let reduced: { blob: Blob };
  try {
    reduced = await deps.reduce(photo);
  } catch {
    // ReductionError and any decode failure both mean the photo cannot be analysed.
    return fail("ANALYSIS_FAILED");
  }
  if (signal.aborted) {
    return fail("ANALYSIS_TIMEOUT");
  }

  const body = new FormData();
  body.append("caseType", values.caseType);
  body.append("purchaseChannel", values.purchaseChannel);
  body.append("category", values.category);
  body.append("modelName", values.modelName);
  body.append("purchaseDate", values.purchaseDate);
  body.append("reason", values.reason);
  body.append(
    "photo",
    new File([reduced.blob], "photo.jpg", { type: "image/jpeg" })
  );

  let response: Response;
  try {
    response = await deps.fetch("/api/analyze", {
      body,
      method: "POST",
      signal,
    });
  } catch {
    return fail(signal.aborted ? "ANALYSIS_TIMEOUT" : "NETWORK_ERROR");
  }

  let text: string;
  try {
    text = await response.text();
  } catch {
    return fail(signal.aborted ? "ANALYSIS_TIMEOUT" : "NETWORK_ERROR");
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return fail("ANALYSIS_FAILED");
  }

  if (!response.ok) {
    const envelope = errorEnvelopeSchema.safeParse(json);
    const code: AppErrorCode | null = envelope.success
      ? envelope.data.error.code
      : null;
    return fail(code ?? "ANALYSIS_FAILED");
  }

  const parsed = analyzeResponseSchema.safeParse(json);
  if (!parsed.success) {
    return fail("ANALYSIS_FAILED");
  }

  return {
    caseContext: parsed.data.caseContext,
    imageAnalysis: parsed.data.imageAnalysis,
    ok: true,
    reducedPhoto: {
      blob: reduced.blob,
      url: deps.createObjectURL(reduced.blob),
    },
  };
}
