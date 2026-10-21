import { describe, expect, it } from "vitest";
import type { CaseUIMessage } from "./messages";
import {
  caseMessageMetadataSchema,
  isSetDecisionPart,
  setDecisionFirstInputSchema,
  setDecisionFollowUpInputSchema,
  setDecisionHistoryInputSchema,
  setDecisionOutputSchema,
} from "./messages";

describe("caseMessageMetadataSchema", () => {
  it("accepts both message kinds", () => {
    expect(
      caseMessageMetadataSchema.safeParse({ kind: "case-submission" }).success
    ).toBe(true);
    expect(
      caseMessageMetadataSchema.safeParse({ kind: "follow-up" }).success
    ).toBe(true);
  });

  it("rejects unknown kinds and missing kind", () => {
    expect(caseMessageMetadataSchema.safeParse({ kind: "other" }).success).toBe(
      false
    );
    expect(caseMessageMetadataSchema.safeParse({}).success).toBe(false);
  });
});

describe("setDecisionFirstInputSchema", () => {
  it("accepts a valid first-turn input", () => {
    expect(
      setDecisionFirstInputSchema.safeParse({
        changeReason: null,
        greeting: "Cześć!",
        label: "accepted",
      }).success
    ).toBe(true);
  });

  it("rejects an empty or blank greeting", () => {
    expect(
      setDecisionFirstInputSchema.safeParse({
        changeReason: null,
        greeting: "",
        label: "accepted",
      }).success
    ).toBe(false);
    expect(
      setDecisionFirstInputSchema.safeParse({
        changeReason: null,
        greeting: "   ",
        label: "accepted",
      }).success
    ).toBe(false);
  });

  it("rejects a 201-character greeting", () => {
    expect(
      setDecisionFirstInputSchema.safeParse({
        changeReason: null,
        greeting: "a".repeat(201),
        label: "accepted",
      }).success
    ).toBe(false);
  });

  it("rejects a non-null changeReason", () => {
    expect(
      setDecisionFirstInputSchema.safeParse({
        changeReason: "x",
        greeting: "Cześć!",
        label: "accepted",
      }).success
    ).toBe(false);
  });

  it("rejects an unknown label", () => {
    expect(
      setDecisionFirstInputSchema.safeParse({
        changeReason: null,
        greeting: "Cześć!",
        label: "maybe",
      }).success
    ).toBe(false);
  });
});

describe("setDecisionFollowUpInputSchema", () => {
  it("accepts a valid follow-up input", () => {
    expect(
      setDecisionFollowUpInputSchema.safeParse({
        changeReason: "Klient potwierdził ślady zalania.",
        greeting: null,
        label: "rejected",
      }).success
    ).toBe(true);
  });

  it("rejects a null changeReason", () => {
    expect(
      setDecisionFollowUpInputSchema.safeParse({
        changeReason: null,
        greeting: null,
        label: "rejected",
      }).success
    ).toBe(false);
  });

  it("rejects a 301-character changeReason", () => {
    expect(
      setDecisionFollowUpInputSchema.safeParse({
        changeReason: "a".repeat(301),
        greeting: null,
        label: "rejected",
      }).success
    ).toBe(false);
  });

  it("rejects a non-null greeting", () => {
    expect(
      setDecisionFollowUpInputSchema.safeParse({
        changeReason: "Powód zmiany.",
        greeting: "Hej",
        label: "rejected",
      }).success
    ).toBe(false);
  });
});

describe("setDecisionHistoryInputSchema", () => {
  it("accepts both the first-turn and the follow-up shapes", () => {
    expect(
      setDecisionHistoryInputSchema.safeParse({
        changeReason: null,
        greeting: "Cześć!",
        label: "accepted",
      }).success
    ).toBe(true);
    expect(
      setDecisionHistoryInputSchema.safeParse({
        changeReason: "Klient potwierdził ślady zalania.",
        greeting: null,
        label: "rejected",
      }).success
    ).toBe(true);
  });
});

describe("setDecisionOutputSchema", () => {
  it("accepts a recorded output and an unchanged output", () => {
    expect(
      setDecisionOutputSchema.safeParse({
        previousLabel: null,
        reason: null,
        recorded: true,
      }).success
    ).toBe(true);
    expect(
      setDecisionOutputSchema.safeParse({
        previousLabel: "escalated",
        reason: "unchanged",
        recorded: false,
      }).success
    ).toBe(true);
  });

  it("rejects an unknown reason", () => {
    expect(
      setDecisionOutputSchema.safeParse({
        previousLabel: "escalated",
        reason: "other",
        recorded: false,
      }).success
    ).toBe(false);
  });
});

describe("isSetDecisionPart", () => {
  const decisionPart: CaseUIMessage["parts"][number] = {
    input: { changeReason: null, greeting: "Cześć!", label: "accepted" },
    output: { previousLabel: null, reason: null, recorded: true },
    state: "output-available",
    toolCallId: "c1",
    type: "tool-set_decision",
  };

  it("returns true for a set_decision tool part", () => {
    expect(isSetDecisionPart(decisionPart)).toBe(true);
  });

  it("returns false for text and step-start parts", () => {
    expect(isSetDecisionPart({ text: "Hej", type: "text" })).toBe(false);
    expect(isSetDecisionPart({ type: "step-start" })).toBe(false);
  });
});
