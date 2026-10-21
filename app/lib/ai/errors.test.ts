import { APICallError, NoObjectGeneratedError } from "ai";
import { describe, expect, it } from "vitest";
import { ConfigurationError } from "./env";
import { AiError, isTimeoutOrAbort, toAiErrorCode } from "./errors";

const apiCallError = () =>
  new APICallError({
    message: "Provider rejected the request",
    requestBodyValues: {},
    statusCode: 400,
    url: "https://openrouter.ai/api/v1/chat/completions",
  });

describe("toAiErrorCode", () => {
  it("maps ConfigurationError to CONFIGURATION_ERROR in both phases", () => {
    const error = new ConfigurationError("OPENROUTER_API_KEY");
    expect(toAiErrorCode(error, "analysis")).toBe("CONFIGURATION_ERROR");
    expect(toAiErrorCode(error, "decision")).toBe("CONFIGURATION_ERROR");
  });

  it("maps AbortError and TimeoutError DOMExceptions to *_TIMEOUT", () => {
    for (const name of ["AbortError", "TimeoutError"]) {
      const error = new DOMException("x", name);
      expect(toAiErrorCode(error, "analysis")).toBe("ANALYSIS_TIMEOUT");
      expect(toAiErrorCode(error, "decision")).toBe("DECISION_TIMEOUT");
    }
  });

  it("maps an error whose cause is an AbortError to *_TIMEOUT", () => {
    const error = new Error("wrapped", {
      cause: new DOMException("x", "AbortError"),
    });
    expect(toAiErrorCode(error, "analysis")).toBe("ANALYSIS_TIMEOUT");
    expect(toAiErrorCode(error, "decision")).toBe("DECISION_TIMEOUT");
  });

  it("maps APICallError to *_FAILED", () => {
    expect(toAiErrorCode(apiCallError(), "analysis")).toBe("ANALYSIS_FAILED");
    expect(toAiErrorCode(apiCallError(), "decision")).toBe("DECISION_FAILED");
  });

  it("maps NoObjectGeneratedError to *_FAILED", () => {
    const error = new NoObjectGeneratedError({
      finishReason: "stop",
      message: "no object",
      response: { id: "resp-1", modelId: "test-model", timestamp: new Date() },
      usage: {
        inputTokenDetails: {
          cacheReadTokens: undefined,
          cacheWriteTokens: undefined,
          noCacheTokens: 1,
        },
        inputTokens: 1,
        outputTokenDetails: { reasoningTokens: undefined, textTokens: 1 },
        outputTokens: 1,
        totalTokens: 2,
      },
    });
    expect(toAiErrorCode(error, "analysis")).toBe("ANALYSIS_FAILED");
    expect(toAiErrorCode(error, "decision")).toBe("DECISION_FAILED");
  });

  it("maps a plain Error and unknown values to *_FAILED", () => {
    expect(toAiErrorCode(new Error("boom"), "analysis")).toBe(
      "ANALYSIS_FAILED"
    );
    expect(toAiErrorCode("boom", "decision")).toBe("DECISION_FAILED");
    expect(toAiErrorCode(undefined, "analysis")).toBe("ANALYSIS_FAILED");
  });
});

describe("isTimeoutOrAbort", () => {
  it("detects timeout and abort by name, including nested cause", () => {
    expect(isTimeoutOrAbort(new DOMException("x", "TimeoutError"))).toBe(true);
    expect(isTimeoutOrAbort(new Error("x", { cause: new Error("y") }))).toBe(
      false
    );
    const named = new Error("x");
    named.name = "AbortError";
    expect(isTimeoutOrAbort(named)).toBe(true);
  });
});

describe("AiError", () => {
  it("carries the code and is an Error", () => {
    const error = new AiError("ANALYSIS_TIMEOUT");
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("ANALYSIS_TIMEOUT");
  });
});
