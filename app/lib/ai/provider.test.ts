import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetAiEnvCache } from "./env";
import {
  getDecisionModel,
  getVisionModel,
  resetProviderCache,
} from "./provider";

function reset() {
  resetAiEnvCache();
  resetProviderCache();
}

beforeEach(reset);
afterEach(reset);

describe("provider", () => {
  it("decision model uses LLM_MODEL", () => {
    const model = getDecisionModel();
    expect(typeof model).not.toBe("string");
    expect((model as { modelId: string }).modelId).toBe(process.env.LLM_MODEL);
  });

  it("vision model falls back to LLM_MODEL", () => {
    expect((getVisionModel() as { modelId: string }).modelId).toBe(
      process.env.LLM_MODEL
    );
  });

  it("constructs models without recorders when AI_CAPTURE_DIR is unset", () => {
    expect(process.env.AI_CAPTURE_DIR ?? "").toBe("");
    expect(() => getVisionModel()).not.toThrow();
  });
});
