import { afterEach, describe, expect, it, vi } from "vitest";
import { type AiCallLog, logAiCall } from "./log";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logAiCall", () => {
  it("logs only whitelisted fields", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const entry = {
      apiKey: "sk-or-x",
      caseType: "return",
      modelId: "vendor/model",
      modelName: "Galaxy",
      outcome: "ok",
      reason: "secret reason",
      route: "analyze",
      text: "hello",
      totalMs: 12,
      usage: { cost: 0.1, extra: "x", inputTokens: 1, outputTokens: 2 },
    } as unknown as AiCallLog;
    logAiCall(entry);
    expect(spy).toHaveBeenCalledTimes(1);
    const line = String(spy.mock.calls[0]?.[0]);
    const parsed = JSON.parse(line);
    expect(parsed.event).toBe("ai_call");
    expect(parsed.modelId).toBe("vendor/model");
    expect(parsed.usage).toEqual({
      cost: 0.1,
      inputTokens: 1,
      outputTokens: 2,
    });
    for (const forbidden of ["secret reason", "Galaxy", "sk-or-x", "hello"]) {
      expect(line).not.toContain(forbidden);
    }
  });
});
