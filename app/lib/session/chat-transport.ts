import { APICallError, DefaultChatTransport } from "ai";
import {
  type AppErrorCode,
  errorEnvelopeSchema,
  isAppErrorCode,
} from "@/lib/case/errors";
import type { CaseUIMessage } from "@/lib/case/messages";
import type { CaseContext, ImageAnalysis } from "@/lib/case/schemas";

export type ChatErrorCode = AppErrorCode | "NETWORK_ERROR";

type ChatRequestContext = {
  caseContext: CaseContext;
  imageAnalysis: ImageAnalysis;
};

/**
 * Transport for POST /api/chat. Every request carries the case context and the
 * image analysis next to the chat id and messages (ADR-004 §3.3). The getter is
 * read per request, so one transport serves a whole chat id.
 */
export function createCaseChatTransport(
  getContext: () => ChatRequestContext | null
): DefaultChatTransport<CaseUIMessage> {
  return new DefaultChatTransport<CaseUIMessage>({
    api: "/api/chat",
    prepareSendMessagesRequest: ({ id, messages }) => ({
      body: { id, messages, ...getContext() },
    }),
  });
}

/**
 * HTTP failure with an error envelope → its code; in-stream error chunk (Error
 * whose message is the server's errorText) → that code; anything else is a
 * network failure.
 */
export function chatErrorCode(error: unknown): ChatErrorCode {
  if (APICallError.isInstance(error) && error.responseBody !== undefined) {
    try {
      const parsed = errorEnvelopeSchema.safeParse(
        JSON.parse(error.responseBody)
      );
      if (parsed.success) {
        return parsed.data.error.code;
      }
    } catch {
      return "NETWORK_ERROR";
    }
    return "NETWORK_ERROR";
  }
  if (error instanceof Error && isAppErrorCode(error.message)) {
    return error.message;
  }
  return "NETWORK_ERROR";
}
