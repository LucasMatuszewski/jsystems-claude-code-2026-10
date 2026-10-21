import { ConfigurationError, getAiEnv } from "@/lib/ai/env";
import { AiError } from "@/lib/ai/errors";
import { analyzeImage } from "@/lib/ai/image-analyst";
import { daysSincePurchase, todayInWarsaw } from "@/lib/case/days";
import { errorResponse, type HttpErrorCode } from "@/lib/case/errors";
import {
  type CaseContext,
  caseFormSchema,
  toFieldErrors,
} from "@/lib/case/schemas";
import { SERVER_PHOTO_MAX_BYTES, sniffImage } from "@/lib/image/sniff";

export const runtime = "nodejs";
export const maxDuration = 60;

const FORM_TEXT_FIELDS = [
  "caseType",
  "purchaseChannel",
  "category",
  "modelName",
  "purchaseDate",
  "reason",
] as const;

const AI_ERROR_CODES: readonly HttpErrorCode[] = [
  "ANALYSIS_FAILED",
  "ANALYSIS_TIMEOUT",
  "CONFIGURATION_ERROR",
];

function textField(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  return typeof value === "string" ? value : undefined;
}

function isHttpAiErrorCode(code: string): code is HttpErrorCode {
  return (AI_ERROR_CODES as readonly string[]).includes(code);
}

export async function POST(request: Request): Promise<Response> {
  // 1. Content type.
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    return errorResponse("UNSUPPORTED_CONTENT_TYPE");
  }

  // 2. Form fields.
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("VALIDATION_ERROR");
  }
  const fields = Object.fromEntries(
    FORM_TEXT_FIELDS.map((name) => [name, textField(formData, name)])
  );
  const parsedForm = caseFormSchema.safeParse(fields);
  if (!parsedForm.success) {
    return errorResponse("VALIDATION_ERROR", toFieldErrors(parsedForm.error));
  }
  const form = parsedForm.data;

  // 3. Photo: presence, size and sniffed signature (declared type is ignored).
  const photo = formData.get("photo");
  if (!(photo instanceof Blob) || photo.size === 0) {
    return errorResponse("PHOTO_REQUIRED");
  }
  if (photo.size > SERVER_PHOTO_MAX_BYTES) {
    return errorResponse("PHOTO_TOO_LARGE");
  }
  const imageBytes = new Uint8Array(await photo.arrayBuffer());
  const sniffed = sniffImage(imageBytes);
  if (sniffed.type === "unknown" || sniffed.mediaType === null) {
    return errorResponse("UNSUPPORTED_IMAGE_TYPE");
  }

  // 4. Case context with the server-side assessment date.
  const assessmentDate = todayInWarsaw();
  const caseContext: CaseContext = {
    ...form,
    assessmentDate,
    daysSincePurchase: daysSincePurchase(form.purchaseDate, assessmentDate),
  };

  // 5. Configuration and image analysis.
  try {
    getAiEnv();
    const imageAnalysis = await analyzeImage({
      abortSignal: request.signal,
      caseContext,
      imageBytes,
      mediaType: sniffed.mediaType,
    });
    // 6. Success.
    return Response.json(
      { caseContext, imageAnalysis },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error(
        `Configuration error: missing or invalid ${error.variable}`
      );
      return errorResponse("CONFIGURATION_ERROR");
    }
    if (error instanceof AiError && isHttpAiErrorCode(error.code)) {
      return errorResponse(error.code);
    }
    return errorResponse("ANALYSIS_FAILED");
  }
}
