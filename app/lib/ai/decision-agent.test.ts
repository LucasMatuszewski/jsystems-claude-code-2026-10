import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it, vi } from "vitest";
import type { CaseUIMessage } from "@/lib/case/messages";
import type { CaseContext, ImageAnalysis } from "@/lib/case/schemas";
import { decisionModelFromCaptures } from "../../tests/helpers/capture-model";
import { detectTurn, streamDecisionTurn } from "./decision-agent";

vi.mock("./log", () => ({ logAiCall: vi.fn() }));

const submission: CaseUIMessage = {
  id: "m1",
  metadata: { kind: "case-submission" },
  parts: [{ text: "Przesłano zgłoszenie.", type: "text" }],
  role: "user",
};
const assistant: CaseUIMessage = {
  id: "m2",
  parts: [
    { type: "step-start" },
    {
      input: { changeReason: null, greeting: "Cześć!", label: "accepted" },
      output: { previousLabel: null, reason: null, recorded: true },
      state: "output-available",
      toolCallId: "call-1",
      type: "tool-set_decision",
    },
    { type: "step-start" },
    { state: "done", text: "## Uzasadnienie", type: "text" },
  ],
  role: "assistant",
};
const followUp: CaseUIMessage = {
  id: "m3",
  metadata: { kind: "follow-up" },
  parts: [{ text: "Opakowanie jest kompletne.", type: "text" }],
  role: "user",
};

describe("detectTurn", () => {
  it("first: a single case-submission user message", () => {
    expect(detectTurn([submission])).toBe("first");
  });
  it("follow-up: submission first, follow-up last", () => {
    expect(detectTurn([submission, assistant, followUp])).toBe("follow-up");
  });
  it("invalid: two case-submissions", () => {
    expect(detectTurn([submission, assistant, submission])).toBe("invalid");
  });
  it("invalid: last message is an assistant message", () => {
    expect(detectTurn([submission, assistant])).toBe("invalid");
  });
  it("invalid: follow-up without a leading case-submission", () => {
    expect(detectTurn([followUp, assistant, followUp])).toBe("invalid");
  });
  it("invalid: single follow-up message", () => {
    expect(detectTurn([followUp])).toBe("invalid");
  });
});

const caseContext = {
  assessmentDate: "2026-10-21",
  caseType: "return",
  category: "smartphone",
  daysSincePurchase: 11,
  modelName: "Galaxy S24",
  purchaseChannel: "online",
  purchaseDate: "2026-10-10",
  reason: "",
} as CaseContext;
const imageAnalysis = { variant: "return" } as unknown as ImageAnalysis;

// Stream parts replayed from the real decision captures (C-04 first turn:
// step 0 forced set_decision tool call, step 1 text; C-05 follow-up: text).
const FIRST_TURN_STEP_0 =
  "provider/2026-10-21T13-09-24.198Z-0020-decision-stream.json";
const FIRST_TURN_STEP_1 =
  "provider/2026-10-21T13-09-29.123Z-0022-decision-stream.json";
const FOLLOW_UP = "provider/2026-10-21T13-09-56.760Z-0030-decision-stream.json";

function twoStepModel() {
  return decisionModelFromCaptures([FIRST_TURN_STEP_0, FIRST_TURN_STEP_1]);
}

async function readChunks(response: Response) {
  const raw = await response.text();
  const chunks: Record<string, unknown>[] = [];
  for (const block of raw.split(/\r?\n\r?\n/)) {
    const data = block
      .split(/\r?\n/)
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trim())
      .join("");
    if (data && data !== "[DONE]") {
      chunks.push(JSON.parse(data));
    }
  }
  return chunks;
}

describe("streamDecisionTurn", () => {
  it("streams set_decision before the text and finishes", async () => {
    const model = twoStepModel();
    const response = await streamDecisionTurn({
      caseContext,
      imageAnalysis,
      messages: [submission],
      model,
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/^text\/event-stream/);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const chunks = await readChunks(response);
    const types = chunks.map((c) => c.type);
    const toolIdx = types.indexOf("tool-input-available");
    expect(toolIdx).toBeGreaterThanOrEqual(0);
    expect(toolIdx).toBeLessThan(types.indexOf("text-start"));
    const output = chunks.find((c) => c.type === "tool-output-available");
    expect(output?.output).toEqual({
      previousLabel: null,
      reason: null,
      recorded: true,
    });
    expect(types.at(-1)).toBe("finish");
  });

  it("forces set_decision on call 1, disables tools on call 2, omits temperature", async () => {
    const model = twoStepModel();
    const response = await streamDecisionTurn({
      caseContext,
      imageAnalysis,
      messages: [submission],
      model,
    });
    await response.text();
    expect(model.doStreamCalls).toHaveLength(2);
    expect(model.doStreamCalls[0]?.toolChoice).toEqual({
      toolName: "set_decision",
      type: "tool",
    });
    expect(model.doStreamCalls[1]?.toolChoice).toEqual({ type: "none" });
    for (const call of model.doStreamCalls) {
      expect(call.temperature).toBeUndefined();
    }
  });

  it("puts the server-recomputed daysSincePurchase into the instructions", async () => {
    const model = twoStepModel();
    const response = await streamDecisionTurn({
      caseContext: { ...caseContext, daysSincePurchase: 777 },
      imageAnalysis,
      messages: [submission],
      model,
    });
    await response.text();
    const system = (model.doStreamCalls[0]?.prompt ?? []).find(
      (m) => m.role === "system"
    );
    expect(JSON.stringify(system)).toMatch(/daysSincePurchase\\?":777/);
  });

  it("replaces the hidden submission text for the model", async () => {
    const model = twoStepModel();
    const messages = [submission];
    const response = await streamDecisionTurn({
      caseContext,
      imageAnalysis,
      messages,
      model,
    });
    await response.text();
    const user = (model.doStreamCalls[0]?.prompt ?? []).find(
      (m) => m.role === "user"
    );
    expect(JSON.stringify(user)).toContain(
      "Przesłano zgłoszenie. Przygotuj wstępną ocenę."
    );
    expect(messages[0]?.parts[0]).toEqual({
      text: "Przesłano zgłoszenie.",
      type: "text",
    });
  });

  it("follow-up converts the tool history and uses auto tool choice", async () => {
    const model = decisionModelFromCaptures([FOLLOW_UP]);
    const response = await streamDecisionTurn({
      caseContext,
      imageAnalysis,
      messages: [submission, assistant, followUp],
      model,
    });
    const chunks = await readChunks(response);
    expect(model.doStreamCalls[0]?.toolChoice).toEqual({ type: "auto" });
    expect(chunks.at(-1)?.type).toBe("finish");
  });

  it("emits only DECISION_FAILED in the error chunk when the model throws", async () => {
    const model = new MockLanguageModelV4({
      doStream: () => {
        throw new Error("secret provider text sk-123");
      },
    });
    const response = await streamDecisionTurn({
      caseContext,
      imageAnalysis,
      messages: [submission],
      model,
    });
    const raw = await response.text();
    expect(raw).not.toContain("secret provider text");
    const chunks = raw
      .split(/\r?\n\r?\n/)
      .map((b) => b.replace(/^data:\s*/, ""))
      .filter((b) => b.startsWith("{"))
      .map((b) => JSON.parse(b) as Record<string, unknown>);
    const error = chunks.find((c) => c.type === "error");
    expect(error?.errorText).toBe("DECISION_FAILED");
  });
});
