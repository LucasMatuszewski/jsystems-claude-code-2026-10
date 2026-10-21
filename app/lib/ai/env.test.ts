import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ConfigurationError, getAiEnv, resetAiEnvCache } from "./env";

const KEYS = [
  "OPENROUTER_API_KEY",
  "LLM_MODEL",
  "VISION_MODEL",
  "POLICIES_DIR",
  "PORT",
  "AI_CAPTURE_DIR",
];
let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = {};
  for (const k of KEYS) {
    saved[k] = process.env[k];
  }
  process.env.OPENROUTER_API_KEY = "sk-or-secret-value";
  process.env.LLM_MODEL = "vendor/decision";
  process.env.VISION_MODEL = "";
  process.env.POLICIES_DIR = "";
  process.env.PORT = "";
  process.env.AI_CAPTURE_DIR = "";
  resetAiEnvCache();
});

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = saved[k];
    }
  }
  resetAiEnvCache();
});

function catchError(): ConfigurationError {
  try {
    getAiEnv();
  } catch (error) {
    return error as ConfigurationError;
  }
  throw new Error("expected getAiEnv to throw");
}

describe("getAiEnv", () => {
  it("throws ConfigurationError for missing LLM_MODEL without leaking values", () => {
    delete process.env.LLM_MODEL;
    const error = catchError();
    expect(error).toBeInstanceOf(ConfigurationError);
    expect(error.variable).toBe("LLM_MODEL");
    expect(error.message).not.toContain("sk-or-secret-value");
  });

  it("throws ConfigurationError for missing OPENROUTER_API_KEY", () => {
    process.env.OPENROUTER_API_KEY = "   ";
    expect(catchError().variable).toBe("OPENROUTER_API_KEY");
  });

  it("falls back to llmModel when VISION_MODEL is empty", () => {
    expect(getAiEnv().visionModel).toBe("vendor/decision");
  });

  it("uses VISION_MODEL when set", () => {
    process.env.VISION_MODEL = "a/b";
    expect(getAiEnv().visionModel).toBe("a/b");
  });

  it("defaults policiesDir, port and captureDir", () => {
    const env = getAiEnv();
    expect(env.policiesDir).toBe(
      path.resolve(process.cwd(), "../docs/policies")
    );
    expect(env.port).toBe(3000);
    expect(env.captureDir).toBeNull();
  });

  it("resolves AI_CAPTURE_DIR to an absolute path", () => {
    process.env.AI_CAPTURE_DIR = "tmp/capture";
    expect(getAiEnv().captureDir).toBe(
      path.resolve(process.cwd(), "tmp/capture")
    );
  });

  it("rejects an invalid PORT", () => {
    process.env.PORT = "abc";
    expect(catchError().variable).toBe("PORT");
  });

  it("caches the parsed result", () => {
    expect(getAiEnv()).toBe(getAiEnv());
  });
});
