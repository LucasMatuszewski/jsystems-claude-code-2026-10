import { safeValidateUIMessages } from "ai";
import { detectTurn, streamDecisionTurn } from "@/lib/ai/decision-agent";
import { getAiEnv } from "@/lib/ai/env";
import { CHAT_MESSAGE_MAX } from "@/lib/case/constants";
import { daysSincePurchase, todayInWarsaw } from "@/lib/case/days";
import { errorResponse } from "@/lib/case/errors";
import {
  type CaseUIMessage,
  caseMessageMetadataSchema,
  setDecisionHistoryInputSchema,
  setDecisionOutputSchema,
} from "@/lib/case/messages";
import { chatRequestSchema, toFieldErrors } from "@/lib/case/schemas";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BODY_BYTES = 2_097_152;

/** Chat rules beyond the UI message schema: text-only user input, bounded length. */
function violatesUserRules(messages: CaseUIMessage[]): boolean {
  if (messages.at(-1)?.role !== "user") {
    return true;
  }
  for (const message of messages) {
    if (message.role !== "user") {
      continue;
    }
    for (const part of message.parts) {
      if (part.type !== "text") {
        return true;
      }
      const { length } = part.text.trim();
      if (length < 1 || length > CHAT_MESSAGE_MAX) {
        return true;
      }
    }
  }
  return false;
}

export async function POST(request: Request): Promise<Response> {
  // 1. Size, content type, JSON.
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return errorResponse("REQUEST_TOO_LARGE");
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("application/json")) {
    return errorResponse("UNSUPPORTED_CONTENT_TYPE");
  }
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return errorResponse("VALIDATION_ERROR");
  }

  // 2. Request shape.
  const parsed = chatRequestSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", toFieldErrors(parsed.error));
  }
  const { caseContext: clientContext, imageAnalysis } = parsed.data;

  // 3. UI messages and chat rules.
  const validated = await safeValidateUIMessages<CaseUIMessage>({
    messages: parsed.data.messages,
    // Assistant messages carry no metadata; user messages are checked by detectTurn.
    metadataSchema: caseMessageMetadataSchema.optional(),
    tools: {
      set_decision: {
        inputSchema: setDecisionHistoryInputSchema,
        outputSchema: setDecisionOutputSchema,
      },
    },
  });
  if (!validated.success) {
    return errorResponse("VALIDATION_ERROR", { messages: "invalid" });
  }
  const messages = validated.data;
  if (violatesUserRules(messages) || detectTurn(messages) === "invalid") {
    return errorResponse("VALIDATION_ERROR", { messages: "invalid" });
  }

  // 4. Server-side assessment date (TAC-003-03).
  const assessmentDate = todayInWarsaw();
  let days: number;
  try {
    days = daysSincePurchase(clientContext.purchaseDate, assessmentDate);
  } catch {
    return errorResponse("VALIDATION_ERROR", { purchaseDate: "future" });
  }
  const caseContext = {
    ...clientContext,
    assessmentDate,
    daysSincePurchase: days,
  };

  // 5. Configuration.
  try {
    getAiEnv();
  } catch {
    return errorResponse("CONFIGURATION_ERROR");
  }

  // 6. Stream the decision turn.
  return streamDecisionTurn({
    abortSignal: request.signal,
    caseContext,
    imageAnalysis,
    messages,
  });
}
