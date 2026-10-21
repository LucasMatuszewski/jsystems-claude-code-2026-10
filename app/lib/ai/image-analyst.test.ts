import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import type { CaseContext } from "@/lib/case/schemas";
import { imageAnalysisSchema } from "@/lib/case/schemas";
import { AiError } from "./errors";
import { analyzeImage } from "./image-analyst";

const caseContext: CaseContext = {
  assessmentDate: "2026-10-21",
  caseType: "return",
  category: "smartphone",
  daysSincePurchase: 11,
  modelName: "Galaxy S24",
  purchaseChannel: "online",
  purchaseDate: "2026-10-10",
  reason: "Zmiana zdania",
} as CaseContext;

const imageBytes = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4]);

// TODO(P2-09): derive from capture — hand-written model output for unit tests
// only (bootstrap; no capture exists yet).
const validReturnOutput = {
  accessoriesVisible: false,
  confidence: "medium",
  equipmentVisible: "Smartfon w etui, widok z przodu.",
  imageUsable: "yes",
  matchesCategory: "yes",
  matchesModel: "uncertain",
  observations: [
    {
      component: "ekran",
      description: "Drobne rysy na szkle.",
      location: "górna część ekranu",
    },
  ],
  packagingVisible: false,
  protectiveFilms: "absent",
  resaleableAsNew: "uncertain",
  resaleableReasons: ["Widoczne drobne rysy."],
  safetyHazards: [],
  seals: "not_visible",
  signsOfUse: [{ location: "ekran", type: "scratches" }],
  unusableReason: null,
};

function textResult(text: string) {
  return {
    content: [{ text, type: "text" as const }],
    finishReason: { raw: undefined, unified: "stop" as const },
    usage: {
      inputTokens: {
        cacheRead: undefined,
        cacheWrite: undefined,
        noCache: 10,
        total: 10,
      },
      outputTokens: { reasoning: undefined, text: 20, total: 20 },
    },
    warnings: [],
  };
}

function modelReturning(text: string): MockLanguageModelV4 {
  return new MockLanguageModelV4({
    doGenerate: async () => textResult(text),
  });
}

describe("analyzeImage", () => {
  it("returns a return-variant analysis that passes imageAnalysisSchema", async () => {
    const model = modelReturning(JSON.stringify(validReturnOutput));

    const result = await analyzeImage({
      caseContext,
      imageBytes,
      mediaType: "image/jpeg",
      model,
    });

    expect(result.variant).toBe("return");
    expect(imageAnalysisSchema.safeParse(result).success).toBe(true);
  });

  it("sends one user message: declared-case text first, then the image with its media type", async () => {
    const model = modelReturning(JSON.stringify(validReturnOutput));

    await analyzeImage({
      caseContext,
      imageBytes,
      mediaType: "image/webp",
      model,
    });

    expect(model.doGenerateCalls).toHaveLength(1);
    const messages = (model.doGenerateCalls[0]?.prompt ?? []).filter(
      (message) => message.role === "user"
    );
    expect(messages).toHaveLength(1);
    const parts = messages[0]?.content ?? [];
    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatchObject({ type: "text" });
    expect((parts[0] as { text?: string }).text).toContain("<declared_case>");
    expect(parts[1]).toMatchObject({ mediaType: "image/webp", type: "file" });
  });

  it("omits temperature: the configured model does not support it (require_parameters)", async () => {
    const model = modelReturning(JSON.stringify(validReturnOutput));

    await analyzeImage({
      caseContext,
      imageBytes,
      mediaType: "image/jpeg",
      model,
    });

    expect(model.doGenerateCalls[0]?.temperature).toBeUndefined();
  });

  it("throws AiError ANALYSIS_FAILED when the model output misses a field", async () => {
    const { confidence: _omitted, ...incomplete } = validReturnOutput;
    const model = modelReturning(JSON.stringify(incomplete));

    const error = await analyzeImage({
      caseContext,
      imageBytes,
      mediaType: "image/jpeg",
      model,
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AiError);
    expect((error as AiError).code).toBe("ANALYSIS_FAILED");
  });

  it("throws AiError ANALYSIS_TIMEOUT when the call is aborted", async () => {
    // A provider call that honours the abort signal, as a real HTTP call does.
    const model = new MockLanguageModelV4({
      doGenerate: ({ abortSignal }) =>
        new Promise((resolve, reject) => {
          const timer = setTimeout(() => resolve(textResult("{}")), 1000);
          abortSignal?.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(abortSignal.reason);
          });
        }),
    });

    const error = await analyzeImage({
      abortSignal: AbortSignal.timeout(50),
      caseContext,
      imageBytes,
      mediaType: "image/jpeg",
      model,
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AiError);
    expect((error as AiError).code).toBe("ANALYSIS_TIMEOUT");
  });
});
