import "server-only";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { type LanguageModel, wrapLanguageModel } from "ai";
import { getAiEnv } from "./env";
import { createRecordingFetch, createRecordingMiddleware } from "./recorders";

type OpenRouter = ReturnType<typeof createOpenRouter>;

let providerCache: OpenRouter | null = null;

function getProvider(): OpenRouter {
  if (providerCache) {
    return providerCache;
  }
  const env = getAiEnv();
  providerCache = createOpenRouter({
    apiKey: env.openRouterApiKey,
    appName: "Asystent zwrotów i reklamacji",
    appUrl: `http://localhost:${env.port}`,
    ...(env.captureDir
      ? { fetch: createRecordingFetch({ captureDir: env.captureDir }) }
      : {}),
  });
  return providerCache;
}

function maybeRecord(model: LanguageModel, label: string): LanguageModel {
  const { captureDir } = getAiEnv();
  if (!captureDir) {
    return model;
  }
  return wrapLanguageModel({
    middleware: createRecordingMiddleware({ captureDir, label }),
    model: model as Parameters<typeof wrapLanguageModel>[0]["model"],
  });
}

export function getVisionModel(): LanguageModel {
  const env = getAiEnv();
  const model = getProvider().chat(env.visionModel, {
    plugins: [{ id: "response-healing" }],
    provider: { require_parameters: true },
    structuredOutputs: { strict: true },
    usage: { include: true },
  });
  return maybeRecord(model, "vision");
}

export function getDecisionModel(): LanguageModel {
  const env = getAiEnv();
  const model = getProvider().chat(env.llmModel, {
    provider: { require_parameters: true },
    usage: { include: true },
  });
  return maybeRecord(model, "decision");
}

export function resetProviderCache(): void {
  providerCache = null;
}
