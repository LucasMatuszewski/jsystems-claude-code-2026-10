import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { APICallError, type UIMessage } from "ai";
import { describe, expect, it, vi } from "vitest";
import type { CaseUIMessage } from "@/lib/case/messages";
import type { CaseContext, ImageAnalysis } from "@/lib/case/schemas";
import {
  chatErrorCode,
  createCaseChatTransport,
} from "@/lib/session/chat-transport";
import {
  FIRST_TURN_CAPTURE,
  firstTurnChunks,
} from "@/tests/fixtures/derived/chat-chunks";

const capture = JSON.parse(
  readFileSync(resolve(process.cwd(), FIRST_TURN_CAPTURE), "utf8")
) as {
  request: { body: { caseContext: CaseContext; imageAnalysis: ImageAnalysis } };
};
const { caseContext, imageAnalysis } = capture.request.body;

const messages: CaseUIMessage[] = [
  {
    id: "u1",
    metadata: { kind: "case-submission" },
    parts: [{ text: "Przesłano zgłoszenie.", type: "text" }],
    role: "user",
  },
];

function sseBody(): string {
  return `${[...firstTurnChunks.map((c) => JSON.stringify(c)), "[DONE]"]
    .map((line) => `data: ${line}\n\n`)
    .join("")}`;
}

describe("createCaseChatTransport", () => {
  it("posts id, messages, caseContext and imageAnalysis to /api/chat", async () => {
    const fetchSpy = vi.fn(
      async (_url: unknown, _init?: RequestInit) =>
        new Response(sseBody(), {
          headers: { "content-type": "text/event-stream" },
          status: 200,
        })
    );
    vi.stubGlobal("fetch", fetchSpy);
    try {
      const transport = createCaseChatTransport(() => ({
        caseContext,
        imageAnalysis,
      }));
      const stream = await transport.sendMessages({
        abortSignal: undefined,
        chatId: "chat-1",
        messageId: undefined,
        messages,
        trigger: "submit-message",
      });
      await stream.cancel();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, init] = fetchSpy.mock.calls[0] ?? [];
      expect(String(url)).toBe("/api/chat");
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      expect(body.id).toBe("chat-1");
      expect(body.messages).toEqual(messages);
      expect(body.caseContext).toEqual(caseContext);
      expect(body.imageAnalysis).toEqual(imageAnalysis);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("omits the context fields when the getter returns null", async () => {
    const fetchSpy = vi.fn(
      async (_url: unknown, _init?: RequestInit) =>
        new Response(sseBody(), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchSpy);
    try {
      const transport = createCaseChatTransport(() => null);
      const stream = await transport.sendMessages({
        abortSignal: undefined,
        chatId: "chat-1",
        messageId: undefined,
        messages: messages as UIMessage[] as CaseUIMessage[],
        trigger: "submit-message",
      });
      await stream.cancel();
      const body = JSON.parse(
        String(fetchSpy.mock.calls[0]?.[1]?.body)
      ) as Record<string, unknown>;
      expect(body.caseContext).toBeUndefined();
      expect(body.imageAnalysis).toBeUndefined();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("chatErrorCode", () => {
  it("maps an APICallError with a valid error envelope to its code", () => {
    const error = new APICallError({
      message: "Request failed",
      requestBodyValues: {},
      responseBody: JSON.stringify({
        error: { code: "REQUEST_TOO_LARGE", message: "Za duże" },
      }),
      statusCode: 413,
      url: "/api/chat",
    });
    expect(chatErrorCode(error)).toBe("REQUEST_TOO_LARGE");
  });

  it("falls back to NETWORK_ERROR for an APICallError with an unparsable body", () => {
    const error = new APICallError({
      message: "Request failed",
      requestBodyValues: {},
      responseBody: "<html>502</html>",
      statusCode: 502,
      url: "/api/chat",
    });
    expect(chatErrorCode(error)).toBe("NETWORK_ERROR");
  });

  it("maps an Error whose message is an app error code", () => {
    expect(chatErrorCode(new Error("DECISION_TIMEOUT"))).toBe(
      "DECISION_TIMEOUT"
    );
    expect(chatErrorCode(new Error("DECISION_FAILED"))).toBe("DECISION_FAILED");
  });

  it("maps anything else to NETWORK_ERROR", () => {
    expect(chatErrorCode(new TypeError("Failed to fetch"))).toBe(
      "NETWORK_ERROR"
    );
    expect(chatErrorCode(undefined)).toBe("NETWORK_ERROR");
    expect(chatErrorCode("boom")).toBe("NETWORK_ERROR");
  });
});
