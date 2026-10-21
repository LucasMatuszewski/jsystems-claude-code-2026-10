import { type APIRequestContext, expect, test } from "@playwright/test";
import { DECISION_LABELS } from "../../lib/case/constants";
import { errorEnvelopeSchema } from "../../lib/case/errors";
import {
  type CaseUIMessage,
  setDecisionHistoryInputSchema,
  setDecisionOutputSchema,
} from "../../lib/case/messages";
import { saveEndpointCapture } from "./helpers/capture";
import { SYNTHETIC_COMPLAINT_REASON } from "./helpers/case-data";
import {
  type AnalyzeResult,
  analyzeCase,
  assistantMessageFromChunks,
  type ChatBody,
  followUpMessage,
  hiddenSubmissionMessage,
  postChat,
} from "./helpers/chat";
import { textOf, toolInputs, type UiChunk } from "./helpers/sse";

const CHAT_ID = "chat-contract-1";
const FOLLOW_UP_TEXT =
  "Opakowanie jest kompletne i nieotwarte, folie i plomby są nienaruszone.";

/** Real analysis of the reference return case (phone-1.jpg, 9 days ago). */
function analyzePhoneReturn(
  request: APIRequestContext
): Promise<AnalyzeResult> {
  return analyzeCase(request, {
    caseType: "return",
    category: "smartphone",
    daysAgo: 9,
    photo: "phone-1.jpg",
    purchaseChannel: "online",
  });
}

type FirstTurn = {
  analysis: AnalyzeResult;
  body: ChatBody;
  status: number;
  headers: Record<string, string>;
  raw: string;
  chunks: UiChunk[];
  label: string;
  text: string;
};

/** Analyze plus the real first chat turn; asserts the 200 event stream. */
async function runFirstTurn(request: APIRequestContext): Promise<FirstTurn> {
  const analysis = await analyzePhoneReturn(request);
  const body: ChatBody = {
    caseContext: analysis.caseContext,
    id: CHAT_ID,
    imageAnalysis: analysis.imageAnalysis,
    messages: [hiddenSubmissionMessage()],
  };
  const response = await postChat(request, body);
  expect(response.status, response.raw).toBe(200);
  expect(response.headers["content-type"]).toMatch(/^text\/event-stream/);
  const [toolCall] = toolInputs(response.chunks, "set_decision");
  const input = toolCall?.input as { label?: unknown } | undefined;
  return {
    analysis,
    body,
    chunks: response.chunks,
    headers: response.headers,
    label: String(input?.label),
    raw: response.raw,
    status: response.status,
    text: textOf(response.chunks),
  };
}

// ---------------------------------------------------------------------------
// C-04: first chat turn streams a set_decision tool call, then the reasoning.
// ---------------------------------------------------------------------------

test.describe("C-04 chat first turn @capture", () => {
  test("C-04 first turn streams set_decision then the explanation", async ({
    request,
  }) => {
    const analysis = await analyzePhoneReturn(request);
    const body: ChatBody = {
      caseContext: analysis.caseContext,
      id: CHAT_ID,
      imageAnalysis: analysis.imageAnalysis,
      messages: [hiddenSubmissionMessage()],
    };
    const response = await postChat(request, body);

    expect(response.status, response.raw).toBe(200);
    expect(response.headers["content-type"]).toMatch(/^text\/event-stream/);
    expect(response.headers["cache-control"]).toBe("no-store");

    const { chunks } = response;
    expect(chunks[0]?.type).toBe("start");

    const toolStartIndex = chunks.findIndex(
      (chunk) =>
        chunk.type === "tool-input-start" && chunk.toolName === "set_decision"
    );
    expect(
      toolStartIndex,
      "set_decision tool-input-start"
    ).toBeGreaterThanOrEqual(0);
    const firstTextIndex = chunks.findIndex(
      (chunk) => chunk.type === "text-start"
    );
    expect(
      firstTextIndex === -1 || toolStartIndex < firstTextIndex,
      "set_decision must start before any text"
    ).toBe(true);

    const calls = toolInputs(chunks, "set_decision");
    expect(calls, "set_decision tool-input-available count").toHaveLength(1);
    const [call] = calls;
    if (call === undefined) {
      return;
    }

    const parsedInput = setDecisionHistoryInputSchema.safeParse(call.input);
    expect(parsedInput.success, JSON.stringify(call.input)).toBe(true);
    const input = call.input as { greeting: unknown; label: unknown };
    expect(typeof input.greeting).toBe("string");
    const greeting = String(input.greeting);
    expect(greeting.length).toBeGreaterThan(0);
    expect(greeting).toBe(greeting.trim());
    expect(DECISION_LABELS).toContain(input.label);

    const callIndex = chunks.indexOf(call);
    const outputs = chunks.filter(
      (chunk) =>
        chunk.type === "tool-output-available" &&
        chunk.toolCallId === call.toolCallId
    );
    expect(outputs, "tool-output-available for set_decision").toHaveLength(1);
    const [output] = outputs;
    expect(chunks.indexOf(output as UiChunk)).toBeGreaterThan(callIndex);
    expect(output?.output).toEqual({
      previousLabel: null,
      reason: null,
      recorded: true,
    });
    expect(setDecisionOutputSchema.safeParse(output?.output).success).toBe(
      true
    );

    const outputIndex = chunks.indexOf(output as UiChunk);
    expect(
      chunks
        .slice(outputIndex + 1)
        .some((chunk) => chunk.type === "text-start"),
      "text-start after the tool output"
    ).toBe(true);

    const text = textOf(chunks);
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain("Uzasadnienie");
    expect(text).toContain("Co dalej");

    expect(chunks.some((chunk) => chunk.type === "error")).toBe(false);
    expect(chunks.at(-1)?.type).toBe("finish");

    console.log(`C-04 set_decision label: ${String(input.label)}`);
    console.log(`C-04 response text:\n${text}`);

    saveEndpointCapture("chat-first-turn-phone-1-return", {
      request: {
        body,
        contentType: "application/json",
        method: "POST",
        path: "/api/chat",
      },
      response: {
        body: { chunks, raw: response.raw },
        headers: response.headers,
        status: response.status,
      },
    });
  });
});

// ---------------------------------------------------------------------------
// C-05: follow-up turn with the first-turn history.
// ---------------------------------------------------------------------------

test.describe("C-05 chat follow-up @capture", () => {
  test("C-05 follow-up turn after the first answer", async ({ request }) => {
    const first = await runFirstTurn(request);
    const assistant = assistantMessageFromChunks(first.chunks, "m-assistant-1");
    const followUp = followUpMessage("m-follow-1", FOLLOW_UP_TEXT);
    const body: ChatBody = {
      caseContext: first.analysis.caseContext,
      id: CHAT_ID,
      imageAnalysis: first.analysis.imageAnalysis,
      messages: [hiddenSubmissionMessage(), assistant, followUp],
    };
    const response = await postChat(request, body);

    expect(response.status, response.raw).toBe(200);
    expect(response.headers["content-type"]).toMatch(/^text\/event-stream/);

    const calls = toolInputs(response.chunks, "set_decision");
    expect(calls.length, "set_decision calls on follow-up").toBeLessThanOrEqual(
      1
    );
    const [call] = calls;
    if (call !== undefined) {
      const output = response.chunks.find(
        (chunk) =>
          chunk.type === "tool-output-available" &&
          chunk.toolCallId === call.toolCallId
      );
      const outputValue = output?.output as
        | { recorded?: unknown; previousLabel?: unknown }
        | undefined;
      if (outputValue?.recorded === true) {
        expect(outputValue.previousLabel).toBe(first.label);
        expect((call.input as { label: unknown }).label).not.toBe(first.label);
      }
    }

    expect(textOf(response.chunks).length).toBeGreaterThan(0);
    expect(response.chunks.at(-1)?.type).toBe("finish");

    console.log(`C-05 follow-up text:\n${textOf(response.chunks)}`);

    saveEndpointCapture("chat-follow-up-phone-1-return", {
      request: {
        body,
        contentType: "application/json",
        method: "POST",
        path: "/api/chat",
      },
      response: {
        body: { chunks: response.chunks, raw: response.raw },
        headers: response.headers,
        status: response.status,
      },
    });
  });
});

// ---------------------------------------------------------------------------
// C-06: rejected or accepted chat requests and their error envelopes.
// ---------------------------------------------------------------------------

function expectErrorEnvelope(
  response: { status: number; headers: Record<string, string>; raw: string },
  status: number,
  code: string
): void {
  expect(response.status, response.raw).toBe(status);
  expect(response.headers["cache-control"]).toBe("no-store");
  expect(response.headers["content-type"]).toContain("application/json");
  const json: unknown = JSON.parse(response.raw);
  const parsed = errorEnvelopeSchema.safeParse(json);
  expect(parsed.success, response.raw).toBe(true);
  if (parsed.success) {
    expect(parsed.data.error.code).toBe(code);
  }
}

test.describe("C-06 chat rejects", () => {
  test("C-06 (a) 70 messages are accepted with no count cap", async ({
    request,
  }) => {
    const first = await runFirstTurn(request);
    const assistantReply = (id: string): CaseUIMessage => ({
      id,
      parts: [{ text: "Odpowiedź testowa.", type: "text" }],
      role: "assistant",
    });
    // Strict alternation from the hidden submission (user, index 0) through
    // index 68 (user); index 69 is the final user follow-up. The brief asks
    // for 70 messages ending with a user message, which strict alternation
    // from a user start cannot give, so one adjacent user pair is required.
    const messages: CaseUIMessage[] = [hiddenSubmissionMessage()];
    for (let index = 1; index < 69; index += 1) {
      messages.push(
        index % 2 === 1
          ? assistantReply(`m-long-${index}`)
          : followUpMessage(`m-long-${index}`, `Wiadomość testowa ${index}.`)
      );
    }
    messages.push(
      followUpMessage("m-long-final", "Czy mogę jeszcze coś dodać?")
    );
    expect(messages).toHaveLength(70);
    expect(messages.at(-1)?.role).toBe("user");

    const response = await postChat(request, {
      caseContext: first.analysis.caseContext,
      id: CHAT_ID,
      imageAnalysis: first.analysis.imageAnalysis,
      messages,
    });

    expect(response.status, response.raw).toBe(200);
    expect(response.headers["content-type"]).toMatch(/^text\/event-stream/);
    expect(response.chunks.at(-1)?.type).toBe("finish");
  });

  test("C-06 (b) a file part in a follow-up returns 400 VALIDATION_ERROR", async ({
    request,
  }) => {
    const first = await runFirstTurn(request);
    const assistant = assistantMessageFromChunks(first.chunks, "m-assistant-1");
    const withFile = {
      id: "m-follow-file",
      metadata: { kind: "follow-up" },
      parts: [
        { text: "Zdjęcie w załączniku.", type: "text" },
        {
          mediaType: "image/jpeg",
          type: "file",
          url: "data:image/jpeg;base64,AAAA",
        },
      ],
      role: "user",
    } as unknown as CaseUIMessage;

    const response = await postChat(request, {
      caseContext: first.analysis.caseContext,
      id: CHAT_ID,
      imageAnalysis: first.analysis.imageAnalysis,
      messages: [hiddenSubmissionMessage(), assistant, withFile],
    });

    expectErrorEnvelope(response, 400, "VALIDATION_ERROR");
  });

  test("C-06 (c) caseContext.caseType mismatching imageAnalysis returns 400 VALIDATION_ERROR", async ({
    request,
  }) => {
    const analysis = await analyzePhoneReturn(request);
    const response = await postChat(request, {
      caseContext: {
        ...analysis.caseContext,
        caseType: "complaint",
        reason: SYNTHETIC_COMPLAINT_REASON,
      },
      id: CHAT_ID,
      imageAnalysis: analysis.imageAnalysis,
      messages: [hiddenSubmissionMessage()],
    });

    expectErrorEnvelope(response, 400, "VALIDATION_ERROR");
  });
});
