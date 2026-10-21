import "server-only";
import type { CaseType } from "@/lib/case/constants";

export type AiCallLog = {
  route: "analyze" | "chat";
  caseType: CaseType;
  modelId: string;
  outcome: string;
  msToFirstChunk?: number;
  totalMs?: number;
  finishReason?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    reasoningTokens?: number;
    cost?: number;
  };
};

export function logAiCall(entry: AiCallLog): void {
  const record: Record<string, unknown> = {
    caseType: entry.caseType,
    event: "ai_call",
    modelId: entry.modelId,
    outcome: entry.outcome,
    route: entry.route,
  };
  if (entry.msToFirstChunk !== undefined) {
    record.msToFirstChunk = entry.msToFirstChunk;
  }
  if (entry.totalMs !== undefined) {
    record.totalMs = entry.totalMs;
  }
  if (entry.finishReason !== undefined) {
    record.finishReason = entry.finishReason;
  }
  if (entry.usage) {
    const usage: Record<string, number> = {};
    if (entry.usage.inputTokens !== undefined) {
      usage.inputTokens = entry.usage.inputTokens;
    }
    if (entry.usage.outputTokens !== undefined) {
      usage.outputTokens = entry.usage.outputTokens;
    }
    if (entry.usage.reasoningTokens !== undefined) {
      usage.reasoningTokens = entry.usage.reasoningTokens;
    }
    if (entry.usage.cost !== undefined) {
      usage.cost = entry.usage.cost;
    }
    record.usage = usage;
  }
  console.info(JSON.stringify(record));
}
