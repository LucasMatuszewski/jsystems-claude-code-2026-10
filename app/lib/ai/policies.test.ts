import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConfigurationError, resetAiEnvCache } from "./env";
import {
  getComplaintSafetySection,
  getPolicy,
  resetPolicyCache,
} from "./policies";

let savedDir: string | undefined;

beforeEach(() => {
  savedDir = process.env.POLICIES_DIR;
  delete process.env.POLICIES_DIR;
  resetAiEnvCache();
  resetPolicyCache();
});

afterEach(() => {
  if (savedDir === undefined) {
    delete process.env.POLICIES_DIR;
  } else {
    process.env.POLICIES_DIR = savedDir;
  }
  resetAiEnvCache();
  resetPolicyCache();
  vi.restoreAllMocks();
});

describe("getPolicy", () => {
  it("loads the return policy without complaint text", () => {
    const text = getPolicy("return");
    expect(text).toContain("Regulamin zwrotów");
    expect(text).toContain("§1");
    expect(text).toContain("§2");
    expect(text).not.toContain("Regulamin reklamacji — dokument");
  });

  it("loads the complaint policy including section 7", () => {
    expect(getPolicy("complaint")).toContain("§7. Bezpieczeństwo");
  });

  it("caches the file content", () => {
    const spy = vi.spyOn(fs, "readFileSync");
    const first = getPolicy("return");
    const calls = spy.mock.calls.length;
    const second = getPolicy("return");
    expect(second).toBe(first);
    expect(spy.mock.calls.length).toBe(calls);
  });

  it("throws ConfigurationError for a missing directory", () => {
    process.env.POLICIES_DIR = "/definitely/not/here";
    resetAiEnvCache();
    try {
      getPolicy("return");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigurationError);
      expect((error as ConfigurationError).variable).toBe("POLICIES_DIR");
    }
  });
});

describe("getComplaintSafetySection", () => {
  it("returns only the section 7 text", () => {
    const text = getComplaintSafetySection();
    expect(text.startsWith("## §7. Bezpieczeństwo")).toBe(true);
    expect(text).toContain("spuchniętej baterii");
    expect(text).not.toContain("§6");
    expect(text).not.toContain("§5");
  });

  it("throws ConfigurationError for a missing directory", () => {
    process.env.POLICIES_DIR = "/definitely/not/here";
    resetAiEnvCache();
    expect(() => getComplaintSafetySection()).toThrow(ConfigurationError);
  });
});
