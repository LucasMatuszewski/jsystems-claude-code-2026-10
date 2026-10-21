import { describe, expect, it } from "vitest";
import { decisionLabelText, deriveCurrentLabel } from "./labels";
import type { CaseUIMessage } from "./messages";

const userMessage = (id: string, text: string): CaseUIMessage => ({
  id,
  metadata: { kind: "follow-up" },
  parts: [{ text, type: "text" }],
  role: "user",
});

const assistantMessage = (
  id: string,
  parts: CaseUIMessage["parts"]
): CaseUIMessage => ({
  id,
  metadata: { kind: "case-submission" },
  parts,
  role: "assistant",
});

const recordedPart = (
  toolCallId: string,
  label: "accepted" | "rejected" | "needs_info" | "escalated",
  recorded = true
): CaseUIMessage["parts"][number] => ({
  input: {
    changeReason: "Powód zmiany.",
    greeting: null,
    label,
  },
  output: {
    previousLabel: null,
    reason: recorded ? null : "unchanged",
    recorded,
  },
  state: "output-available",
  toolCallId,
  type: "tool-set_decision",
});

describe("deriveCurrentLabel", () => {
  it("returns null for an empty list", () => {
    expect(deriveCurrentLabel([])).toBeNull();
  });

  it("returns null when only the hidden user message exists", () => {
    expect(
      deriveCurrentLabel([userMessage("m1", "Przesłano zgłoszenie.")])
    ).toBeNull();
  });

  it("returns the label of a single recorded first decision", () => {
    const messages = [
      userMessage("m1", "Przesłano zgłoszenie."),
      assistantMessage("m2", [
        {
          input: { changeReason: null, greeting: "Cześć!", label: "accepted" },
          output: { previousLabel: null, reason: null, recorded: true },
          state: "output-available",
          toolCallId: "c1",
          type: "tool-set_decision",
        },
      ]),
    ];
    expect(deriveCurrentLabel(messages)).toBe("accepted");
  });

  it("prefers the newer recorded follow-up decision", () => {
    const messages = [
      assistantMessage("m1", [recordedPart("c1", "needs_info")]),
      userMessage("m2", "Mam paragon."),
      assistantMessage("m3", [recordedPart("c2", "escalated")]),
    ];
    expect(deriveCurrentLabel(messages)).toBe("escalated");
  });

  it("skips a follow-up that was not recorded", () => {
    const messages = [
      assistantMessage("m1", [recordedPart("c1", "rejected")]),
      userMessage("m2", "Zmieńmy zdanie."),
      assistantMessage("m3", [recordedPart("c2", "accepted", false)]),
    ];
    expect(deriveCurrentLabel(messages)).toBe("rejected");
  });

  it("ignores parts that are not in the output-available state", () => {
    const messages = [
      assistantMessage("m1", [recordedPart("c1", "rejected")]),
      assistantMessage("m2", [
        {
          input: { changeReason: "Powód.", greeting: null, label: "accepted" },
          state: "input-available",
          toolCallId: "c2",
          type: "tool-set_decision",
        },
      ]),
    ];
    expect(deriveCurrentLabel(messages)).toBe("rejected");
  });

  it("ignores input-streaming and output-error parts", () => {
    const messages = [
      assistantMessage("m1", [recordedPart("c1", "rejected")]),
      assistantMessage("m2", [
        {
          input: undefined,
          state: "input-streaming",
          toolCallId: "c2",
          type: "tool-set_decision",
        },
        {
          errorText: "boom",
          input: { changeReason: "Powód.", greeting: null, label: "accepted" },
          state: "output-error",
          toolCallId: "c3",
          type: "tool-set_decision",
        },
      ]),
    ];
    expect(deriveCurrentLabel(messages)).toBe("rejected");
  });

  it("uses the last qualifying part within one message", () => {
    const messages = [
      assistantMessage("m1", [
        recordedPart("c1", "needs_info"),
        recordedPart("c2", "escalated"),
      ]),
    ];
    expect(deriveCurrentLabel(messages)).toBe("escalated");
  });

  it("never scans user messages", () => {
    const messages: CaseUIMessage[] = [
      {
        id: "m1",
        metadata: { kind: "follow-up" },
        parts: [recordedPart("c1", "accepted")],
        role: "user",
      },
    ];
    expect(deriveCurrentLabel(messages)).toBeNull();
  });
});

describe("decisionLabelText", () => {
  it("returns the Polish text for a label", () => {
    expect(decisionLabelText("needs_info")).toBe(
      "Potrzebne dodatkowe informacje"
    );
  });
});
