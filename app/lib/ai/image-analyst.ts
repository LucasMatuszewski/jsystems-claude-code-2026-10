import "server-only";
import { generateText, type LanguageModel, Output } from "ai";
import type { ZodType } from "zod";
import type { CaseContext, ImageAnalysis } from "@/lib/case/schemas";
import {
  analysisModelSchemaFor,
  complaintImageAnalysisSchema,
  returnImageAnalysisSchema,
} from "@/lib/case/schemas";
import { AiError, toAiErrorCode } from "./errors";
import { logAiCall } from "./log";
import {
  buildImageAnalystContext,
  buildImageAnalystInstructions,
} from "./prompts/image-analyst";
import { getVisionModel } from "./provider";

export type ImageMediaType = "image/jpeg" | "image/png" | "image/webp";

export type AnalyzeImageArgs = {
  caseContext: CaseContext;
  imageBytes: Uint8Array;
  mediaType: ImageMediaType;
  abortSignal?: AbortSignal;
  /** Test injection; defaults to the configured vision model. */
  model?: LanguageModel;
};

const MAX_OUTPUT_TOKENS = 1500;
const MAX_RETRIES = 1;
const TOTAL_TIMEOUT_MS = 50_000;

type Usage = {
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  cost?: number;
};

function modelIdOf(model: LanguageModel): string {
  if (typeof model === "string") {
    return model;
  }
  return model.modelId;
}

function costFrom(providerMetadata: unknown): number | undefined {
  const openrouter = (providerMetadata as { openrouter?: unknown } | undefined)
    ?.openrouter as { usage?: { cost?: unknown } } | undefined;
  const cost = openrouter?.usage?.cost;
  return typeof cost === "number" ? cost : undefined;
}

/**
 * Sends one photo with the declared case data to the vision model and returns
 * the validated image analysis. Raw model text is never returned; failures are
 * thrown as AiError with the public code.
 */
export async function analyzeImage(
  args: AnalyzeImageArgs
): Promise<ImageAnalysis> {
  const { caseContext, imageBytes, mediaType, abortSignal } = args;
  const { caseType, category, modelName } = caseContext;
  const startedAt = performance.now();
  let modelId = "unknown";

  try {
    const model = args.model ?? getVisionModel();
    modelId = modelIdOf(model);

    const result = await generateText({
      abortSignal,
      instructions: buildImageAnalystInstructions(caseType),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      maxRetries: MAX_RETRIES,
      messages: [
        {
          content: [
            {
              text: buildImageAnalystContext({ caseType, category, modelName }),
              type: "text",
            },
            { data: imageBytes, mediaType, type: "file" },
          ],
          role: "user",
        },
      ],
      model,
      // The union of the two model schemas is re-validated below per variant.
      output: Output.object({
        schema: analysisModelSchemaFor(caseType) as ZodType<
          Record<string, unknown>
        >,
      }),
      timeout: { totalMs: TOTAL_TIMEOUT_MS },
    });

    const usage: Usage = {
      cost: costFrom(result.providerMetadata),
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      reasoningTokens: result.usage.outputTokenDetails?.reasoningTokens,
    };
    const parsedOutput = { ...result.output, variant: caseType };
    const analysis: ImageAnalysis =
      caseType === "complaint"
        ? complaintImageAnalysisSchema.parse(parsedOutput)
        : returnImageAnalysisSchema.parse(parsedOutput);

    logAiCall({
      caseType,
      finishReason: result.finishReason,
      modelId,
      outcome: "ok",
      route: "analyze",
      totalMs: Math.round(performance.now() - startedAt),
      usage,
    });
    return analysis;
  } catch (error) {
    const code = toAiErrorCode(error, "analysis");
    logAiCall({
      caseType,
      modelId,
      outcome: code,
      route: "analyze",
      totalMs: Math.round(performance.now() - startedAt),
    });
    throw new AiError(code, { cause: error });
  }
}
