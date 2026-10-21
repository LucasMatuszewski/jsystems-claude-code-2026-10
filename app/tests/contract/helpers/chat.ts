import { type APIRequestContext, expect } from "@playwright/test";
import type {
  CaseUIMessage,
  SetDecisionInput,
} from "../../../lib/case/messages";
import { analyzeResponseSchema } from "../../../lib/case/schemas";
import { texts } from "../../../lib/case/texts";
import {
  type CaseTypeValue,
  formFields,
  type PurchaseChannelValue,
} from "./case-data";
import { type PhotoName, photoPart } from "./photos";
import { parseSse, textOf, type UiChunk } from "./sse";

const ANALYZE_ENDPOINT = "/api/analyze";
const CHAT_ENDPOINT = "/api/chat";

export type AnalyzeResult = {
  caseContext: Record<string, unknown> & { caseType: string };
  imageAnalysis: Record<string, unknown> & { variant: string };
};

export type AnalyzeOptions = {
  photo: PhotoName;
  caseType: CaseTypeValue;
  purchaseChannel: PurchaseChannelValue;
  category: string;
  daysAgo: number;
  reason?: string;
};

/** Real `POST /api/analyze` call; returns the validated caseContext and imageAnalysis. */
export async function analyzeCase(
  request: APIRequestContext,
  options: AnalyzeOptions
): Promise<AnalyzeResult> {
  const fields = formFields(options);
  const part = photoPart(options.photo);
  const response = await request.post(ANALYZE_ENDPOINT, {
    multipart: { ...fields, photo: part },
  });
  const text = await response.text();
  expect(response.status(), text).toBe(200);
  const parsed = analyzeResponseSchema.safeParse(JSON.parse(text));
  expect(parsed.success, text).toBe(true);
  if (!parsed.success) {
    throw new Error(`analyze response failed validation: ${text}`);
  }
  return {
    caseContext: parsed.data.caseContext,
    imageAnalysis: parsed.data.imageAnalysis,
  };
}

export type ChatBody = {
  id: string;
  messages: unknown[];
  caseContext: unknown;
  imageAnalysis: unknown;
};

export type ChatResponse = {
  status: number;
  headers: Record<string, string>;
  raw: string;
  chunks: UiChunk[];
};

/**
 * Real `POST /api/chat` call. Chunks are parsed only for event-stream
 * responses; error bodies are returned raw for the caller to validate.
 */
export async function postChat(
  request: APIRequestContext,
  body: ChatBody
): Promise<ChatResponse> {
  const response = await request.post(CHAT_ENDPOINT, { data: body });
  const raw = await response.text();
  const headers = response.headers();
  const isStream = (headers["content-type"] ?? "").startsWith(
    "text/event-stream"
  );
  return {
    chunks: isStream ? parseSse(raw) : [],
    headers,
    raw,
    status: response.status(),
  };
}

/**
 * Builds the assistant UI message from a streamed first turn (ADR-003 §4.4):
 * step, the set_decision tool part with its output, step, then the text.
 */
export function assistantMessageFromChunks(
  chunks: UiChunk[],
  id: string
): CaseUIMessage {
  const call = chunks.find(
    (chunk) =>
      chunk.type === "tool-input-available" && chunk.toolName === "set_decision"
  );
  if (call === undefined) {
    throw new Error("No set_decision tool-input-available chunk in the stream");
  }
  const toolCallId = String(call.toolCallId);
  const outputChunk = chunks.find(
    (chunk) =>
      chunk.type === "tool-output-available" && chunk.toolCallId === toolCallId
  );
  if (outputChunk === undefined) {
    throw new Error(`No tool-output-available for toolCallId ${toolCallId}`);
  }
  const message = {
    id,
    parts: [
      { type: "step-start" },
      {
        input: call.input as SetDecisionInput,
        output: outputChunk.output,
        state: "output-available",
        toolCallId,
        type: "tool-set_decision",
      },
      { type: "step-start" },
      { state: "done", text: textOf(chunks), type: "text" },
    ],
    role: "assistant",
  };
  return message as unknown as CaseUIMessage;
}

/** First-turn hidden submission message (ADR-003 §4.4). */
export function hiddenSubmissionMessage(): CaseUIMessage {
  return {
    id: "m-submit",
    metadata: { kind: "case-submission" },
    parts: [{ text: texts.chat.hiddenSubmissionText, type: "text" }],
    role: "user",
  };
}

/** Follow-up user message from the chat input. */
export function followUpMessage(id: string, text: string): CaseUIMessage {
  return {
    id,
    metadata: { kind: "follow-up" },
    parts: [{ text, type: "text" }],
    role: "user",
  };
}
