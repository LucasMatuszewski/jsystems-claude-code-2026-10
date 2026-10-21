import "server-only";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  type LanguageModel,
  streamText,
  toUIMessageStream,
} from "ai";
import { deriveCurrentLabel } from "@/lib/case/labels";
import type { CaseUIMessage } from "@/lib/case/messages";
import type { CaseContext, ImageAnalysis } from "@/lib/case/schemas";
import { toAiErrorCode } from "./errors";
import { logAiCall } from "./log";
import {
  buildCaseData,
  buildDecisionInstructions,
  type DecisionTurn,
} from "./prompts/decision-agent";
import { getDecisionModel } from "./provider";
import { createSetDecisionTool } from "./tools";

const MODEL_SUBMISSION_TEXT = "Przesłano zgłoszenie. Przygotuj wstępną ocenę.";

function kindOf(message: CaseUIMessage | undefined): string | undefined {
  return message?.role === "user" ? message.metadata?.kind : undefined;
}

/** Classifies the conversation as the first turn, a follow-up, or invalid. */
export function detectTurn(
  messages: CaseUIMessage[]
): DecisionTurn | "invalid" {
  if (messages.length === 0 || kindOf(messages[0]) !== "case-submission") {
    return "invalid";
  }
  if (messages.length === 1) {
    return "first";
  }
  const rest = messages.slice(1);
  if (rest.some((m) => kindOf(m) === "case-submission")) {
    return "invalid";
  }
  return kindOf(messages.at(-1)) === "follow-up" ? "follow-up" : "invalid";
}

function modelIdOf(model: LanguageModel): string {
  return typeof model === "string" ? model : model.modelId;
}

function costFrom(providerMetadata: unknown): number | undefined {
  const cost = (
    providerMetadata as
      | { openrouter?: { usage?: { cost?: unknown } } }
      | undefined
  )?.openrouter?.usage?.cost;
  return typeof cost === "number" ? cost : undefined;
}

function withModelSubmissionText(messages: CaseUIMessage[]): CaseUIMessage[] {
  return messages.map((message) =>
    message.metadata?.kind === "case-submission"
      ? {
          ...message,
          parts: [{ text: MODEL_SUBMISSION_TEXT, type: "text" as const }],
        }
      : message
  );
}

export type StreamDecisionTurnArgs = {
  caseContext: CaseContext;
  imageAnalysis: ImageAnalysis;
  messages: CaseUIMessage[];
  abortSignal?: AbortSignal;
  /** Test injection; defaults to the configured decision model. */
  model?: LanguageModel;
};

/**
 * Streams one decision-agent turn as an AI SDK UI message stream.
 * Errors reach the client only as the public code (DECISION_TIMEOUT or
 * DECISION_FAILED); a client abort is reported as DECISION_TIMEOUT too,
 * since the SDK has no way to end the stream silently from onError.
 */
export async function streamDecisionTurn(
  args: StreamDecisionTurnArgs
): Promise<Response> {
  const { caseContext, imageAnalysis, messages, abortSignal } = args;
  const { caseType } = caseContext;
  const startedAt = performance.now();
  let firstChunkMs: number | undefined;
  let modelId = "unknown";
  let outcome = "ok";
  let logged = false;

  const log = (usage?: {
    inputTokens?: number;
    outputTokens?: number;
    cost?: number;
  }) => {
    if (logged) {
      return;
    }
    logged = true;
    logAiCall({
      caseType,
      modelId,
      msToFirstChunk: firstChunkMs,
      outcome,
      route: "chat",
      totalMs: Math.round(performance.now() - startedAt),
      usage,
    });
  };

  try {
    const turn = detectTurn(messages);
    if (turn === "invalid") {
      throw new Error("invalid conversation");
    }
    const currentLabel = deriveCurrentLabel(messages);
    const model = args.model ?? getDecisionModel();
    modelId = modelIdOf(model);
    const tools = { set_decision: createSetDecisionTool(turn, currentLabel) };

    const modelMessages = await convertToModelMessages(
      withModelSubmissionText(messages),
      { tools }
    );

    const result = streamText({
      abortSignal,
      instructions: buildDecisionInstructions({
        caseData: buildCaseData(caseContext, imageAnalysis),
        caseType,
        currentLabel,
        turn,
      }),
      maxOutputTokens: turn === "first" ? 4000 : 2500,
      maxRetries: 1,
      messages: modelMessages,
      model,
      onChunk: () => {
        firstChunkMs ??= Math.round(performance.now() - startedAt);
      },
      onEnd: (event) => {
        log({
          cost: costFrom(event.providerMetadata),
          inputTokens: event.totalUsage?.inputTokens,
          outputTokens: event.totalUsage?.outputTokens,
        });
      },
      onError: ({ error }) => {
        outcome = toAiErrorCode(error, "decision");
      },
      prepareStep: ({ stepNumber }) => {
        if (stepNumber > 0) {
          return { toolChoice: "none" as const };
        }
        return turn === "first"
          ? {
              activeTools: ["set_decision" as const],
              toolChoice: {
                toolName: "set_decision" as const,
                type: "tool" as const,
              },
            }
          : { toolChoice: "auto" as const };
      },
      stopWhen: isStepCount(2),
      timeout: { chunkMs: 30_000, firstChunkMs: 60_000, totalMs: 110_000 },
      tools,
    });

    return createUIMessageStreamResponse({
      headers: { "Cache-Control": "no-store" },
      stream: toUIMessageStream({
        onError: (error) => {
          outcome = toAiErrorCode(error, "decision");
          log();
          return outcome;
        },
        originalMessages: messages,
        sendReasoning: false,
        stream: result.stream,
        tools,
      }),
    });
  } catch (error) {
    outcome = toAiErrorCode(error, "decision");
    log();
    throw error;
  }
}
