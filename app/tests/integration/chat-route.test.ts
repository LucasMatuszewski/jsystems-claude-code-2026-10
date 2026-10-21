import { type LanguageModel, simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/chat/route";
import { parseSse, textOf, type UiChunk } from "../contract/helpers/sse";
import {
  decisionModelFromCaptures,
  loadCapture,
} from "../helpers/capture-model";

// Characterization tests: the decision model is the only mock; the request
// body and the replayed model output come from the 2026-10-21 captures.
const state = vi.hoisted(() => ({ model: undefined as unknown }));

vi.mock("@/lib/ai/provider", () => ({
  getDecisionModel: () => state.model as LanguageModel,
  getVisionModel: () => state.model as LanguageModel,
}));

type ProviderPart = { type: string; delta?: string; [key: string]: unknown };
type ProviderRecording = { parts: ProviderPart[] };
type ChatCapture = {
  request: { body: Record<string, unknown> };
};

const CHAT = "chat-first-turn-phone-1-return.endpoint.json";
// C-04 first turn: step 0 = forced set_decision tool call, step 1 = text.
const STEP_0 = "provider/2026-10-21T13-09-24.198Z-0020-decision-stream.json";
const STEP_1 = "provider/2026-10-21T13-09-29.123Z-0022-decision-stream.json";
const ENDPOINT = "http://localhost:3000/api/chat";

const chatBody = loadCapture<ChatCapture>(CHAT).request.body;
const step0 = loadCapture<ProviderRecording>(STEP_0);
const step1 = loadCapture<ProviderRecording>(STEP_1);

function chatRequest(body: Record<string, unknown> = chatBody): Request {
  return new Request(ENDPOINT, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

function toolInputOf(recording: ProviderRecording) {
  const call = recording.parts.find((part) => part.type === "tool-call");
  if (typeof call?.input !== "string") {
    throw new Error("capture has no tool-call input");
  }
  return JSON.parse(call.input) as Record<string, unknown>;
}

function capturedText(recording: ProviderRecording): string {
  return recording.parts
    .filter((part) => part.type === "text-delta")
    .map((part) => String(part.delta ?? ""))
    .join("");
}

function freezeWarsawTime(iso: string): void {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(iso));
}

beforeEach(() => {
  freezeWarsawTime("2026-10-21T10:00:00Z");
});

afterEach(() => {
  vi.useRealTimers();
  state.model = undefined;
});

describe("POST /api/chat with the captured first turn", () => {
  it("streams set_decision before the text, then finishes", async () => {
    state.model = decisionModelFromCaptures([STEP_0, STEP_1]);

    const response = await POST(chatRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/^text\/event-stream/);
    const chunks: UiChunk[] = parseSse(await response.text());
    const types = chunks.map((chunk) => chunk.type);
    const toolIndex = types.indexOf("tool-input-available");
    expect(toolIndex).toBeGreaterThanOrEqual(0);
    expect(toolIndex).toBeLessThan(types.indexOf("text-start"));
    expect(chunks[toolIndex]).toMatchObject({
      input: toolInputOf(step0),
      toolName: "set_decision",
    });
    expect(types.at(-1)).toBe("finish");
  });

  it("records the first decision and replays the captured text", async () => {
    state.model = decisionModelFromCaptures([STEP_0, STEP_1]);

    const response = await POST(chatRequest());
    const chunks = parseSse(await response.text());

    const output = chunks.find(
      (chunk) => chunk.type === "tool-output-available"
    );
    expect(output?.output).toEqual({
      previousLabel: null,
      reason: null,
      recorded: true,
    });
    expect(textOf(chunks)).toBe(capturedText(step1));
  });

  it("uses the server-recomputed daysSincePurchase, not the client value (TAC-003-03)", async () => {
    state.model = decisionModelFromCaptures([STEP_0, STEP_1]);
    const body = structuredClone(chatBody) as {
      caseContext: { daysSincePurchase: number };
    };
    body.caseContext.daysSincePurchase = 999;

    const response = await POST(chatRequest(body));
    await response.text();

    const model = state.model as MockLanguageModelV4;
    const system = (model.doStreamCalls[0]?.prompt ?? []).find(
      (message) => message.role === "system"
    );
    const systemText = JSON.stringify(system);
    expect(systemText).toMatch(/daysSincePurchase\\?":9[,}\\]/);
    expect(systemText).not.toMatch(/daysSincePurchase\\?":999/);
  });

  it("turns a stream error part into a DECISION_FAILED error chunk without provider text", async () => {
    const [streamStart] = step0.parts;
    state.model = new MockLanguageModelV4({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            streamStart,
            { error: new Error("upstream secret sk-123"), type: "error" },
          ] as never[],
        }),
      }),
    });

    const response = await POST(chatRequest());
    const raw = await response.text();

    expect(response.status).toBe(200);
    expect(raw).not.toContain("sk-123");
    const error = parseSse(raw).find((chunk) => chunk.type === "error");
    expect(error?.errorText).toBe("DECISION_FAILED");
  });
});
