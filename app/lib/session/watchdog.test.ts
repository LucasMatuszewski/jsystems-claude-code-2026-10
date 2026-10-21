import { describe, expect, it } from "vitest";
import type { CaseUIMessage } from "@/lib/case/messages";
import {
  FOLLOW_UP_DEADLINE_MS,
  hasFirstContent,
  hasRecordedDecision,
} from "@/lib/session/watchdog";

function assistant(parts: unknown[]): CaseUIMessage {
  return { id: "a1", parts, role: "assistant" } as CaseUIMessage;
}

const decisionInput = {
  changeReason: null,
  greeting: "Cześć",
  label: "escalated",
};

describe("FOLLOW_UP_DEADLINE_MS", () => {
  it("is 60 seconds", () => {
    expect(FOLLOW_UP_DEADLINE_MS).toBe(60_000);
  });
});

describe("hasFirstContent", () => {
  it("is false without a message", () => {
    expect(hasFirstContent(undefined)).toBe(false);
  });

  it("is false for a message with only a step-start part", () => {
    expect(hasFirstContent(assistant([{ type: "step-start" }]))).toBe(false);
  });

  it("is false for reasoning, source and empty text parts", () => {
    expect(
      hasFirstContent(
        assistant([
          { type: "step-start" },
          { text: "hmm", type: "reasoning" },
          { sourceId: "s", type: "source-url", url: "https://x.test" },
          { text: "", type: "text" },
        ])
      )
    ).toBe(false);
  });

  it("is true for a set_decision tool part still streaming its input", () => {
    expect(
      hasFirstContent(
        assistant([
          { type: "step-start" },
          {
            input: { changeReason: null },
            state: "input-streaming",
            toolCallId: "c1",
            type: "tool-set_decision",
          },
        ])
      )
    ).toBe(true);
  });

  it("is true for a text part with non-empty text", () => {
    expect(
      hasFirstContent(assistant([{ text: "Dzień dobry", type: "text" }]))
    ).toBe(true);
  });
});

describe("hasRecordedDecision", () => {
  it("is false without a message or a tool part", () => {
    expect(hasRecordedDecision(undefined)).toBe(false);
    expect(hasRecordedDecision(assistant([{ text: "x", type: "text" }]))).toBe(
      false
    );
  });

  it("is false for a tool part that has no output yet", () => {
    expect(
      hasRecordedDecision(
        assistant([
          {
            input: decisionInput,
            state: "input-available",
            toolCallId: "c1",
            type: "tool-set_decision",
          },
        ])
      )
    ).toBe(false);
  });

  it("is false when the output was not recorded", () => {
    expect(
      hasRecordedDecision(
        assistant([
          {
            input: decisionInput,
            output: {
              previousLabel: null,
              reason: "unchanged",
              recorded: false,
            },
            state: "output-available",
            toolCallId: "c1",
            type: "tool-set_decision",
          },
        ])
      )
    ).toBe(false);
  });

  it("is true for an output-available part with recorded === true", () => {
    expect(
      hasRecordedDecision(
        assistant([
          {
            input: decisionInput,
            output: { previousLabel: null, reason: null, recorded: true },
            state: "output-available",
            toolCallId: "c1",
            type: "tool-set_decision",
          },
        ])
      )
    ).toBe(true);
  });
});
