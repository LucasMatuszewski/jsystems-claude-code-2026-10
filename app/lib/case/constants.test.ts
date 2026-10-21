import { describe, expect, it } from "vitest";
import {
  CASE_TYPE_LABELS,
  CASE_TYPES,
  CATEGORIES,
  CATEGORY_LABELS,
  CHAT_MESSAGE_MAX,
  DECISION_LABEL_TEXTS,
  DECISION_LABELS,
  MODEL_NAME_MAX,
  MODEL_NAME_MIN,
  PURCHASE_CHANNEL_LABELS,
  PURCHASE_CHANNELS,
  REASON_COMPLAINT_MIN,
  REASON_MAX,
} from "./constants";
import { texts } from "./texts";

describe("CATEGORIES", () => {
  it("has 9 values in AC-04 order", () => {
    expect(CATEGORIES).toHaveLength(9);
    expect([...CATEGORIES]).toEqual([
      "smartphone",
      "laptop",
      "tablet",
      "desktop",
      "monitor",
      "tv",
      "audio",
      "console",
      "other",
    ]);
  });

  it("has labels that equal the AC-04 Polish list in the same order", () => {
    expect(CATEGORIES.map((category) => CATEGORY_LABELS[category])).toEqual([
      "Smartfon",
      "Laptop",
      "Tablet",
      "Komputer stacjonarny",
      "Monitor",
      "Telewizor",
      "Słuchawki / audio",
      "Konsola do gier",
      "Inne",
    ]);
  });
});

describe("enum labels", () => {
  it("every case type has a label", () => {
    for (const value of CASE_TYPES) {
      expect(CASE_TYPE_LABELS[value]).toEqual(expect.any(String));
    }
    expect(CASE_TYPE_LABELS).toEqual(texts.form.caseType.options);
  });

  it("every purchase channel has a label", () => {
    for (const value of PURCHASE_CHANNELS) {
      expect(PURCHASE_CHANNEL_LABELS[value]).toEqual(expect.any(String));
    }
    expect(PURCHASE_CHANNEL_LABELS).toEqual(texts.form.purchaseChannel.options);
  });

  it("every decision label has a text", () => {
    for (const value of DECISION_LABELS) {
      expect(DECISION_LABEL_TEXTS[value]).toEqual(expect.any(String));
    }
    expect(DECISION_LABEL_TEXTS).toEqual(texts.decision.labels);
  });
});

describe("enum values", () => {
  it("exposes the expected case types, channels and decision labels", () => {
    expect([...CASE_TYPES]).toEqual(["return", "complaint"]);
    expect([...PURCHASE_CHANNELS]).toEqual(["online", "in_store"]);
    expect([...DECISION_LABELS]).toEqual([
      "accepted",
      "rejected",
      "needs_info",
      "escalated",
    ]);
  });
});

describe("numeric limits", () => {
  it("exposes the agreed limits", () => {
    expect(MODEL_NAME_MIN).toBe(2);
    expect(MODEL_NAME_MAX).toBe(100);
    expect(REASON_COMPLAINT_MIN).toBe(20);
    expect(CHAT_MESSAGE_MAX).toBe(2000);
    expect(REASON_MAX).toBe(2000);
  });
});
