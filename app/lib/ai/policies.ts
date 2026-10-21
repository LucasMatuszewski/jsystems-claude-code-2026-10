import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { CaseType } from "@/lib/case/constants";
import { ConfigurationError, getAiEnv } from "./env";

const FILE_NAMES: Record<CaseType, string> = {
  complaint: "complaint-policy.md",
  return: "return-policy.md",
};

const cache = new Map<CaseType, string>();

function readPolicyFile(caseType: CaseType): string {
  const file = path.join(getAiEnv().policiesDir, FILE_NAMES[caseType]);
  let text: string | null = null;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    text = null;
  }
  if (text === null) {
    throw new ConfigurationError("POLICIES_DIR");
  }
  return text;
}

/** Full policy text for the case type, read once per process. */
export function getPolicy(caseType: CaseType): string {
  const cached = cache.get(caseType);
  if (cached !== undefined) {
    return cached;
  }
  const text = readPolicyFile(caseType);
  if (!(text.includes("§1") && text.includes("§2"))) {
    throw new ConfigurationError("POLICIES_DIR");
  }
  cache.set(caseType, text);
  return text;
}

/** Only the "## §7. Bezpieczeństwo" section of the complaint policy. */
export function getComplaintSafetySection(): string {
  const lines = getPolicy("complaint").split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith("## §7"));
  if (start === -1) {
    throw new ConfigurationError("POLICIES_DIR");
  }
  const next = lines.findIndex(
    (line, index) => index > start && line.startsWith("## ")
  );
  const end = next === -1 ? lines.length : next;
  return lines.slice(start, end).join("\n").trim();
}

export function resetPolicyCache(): void {
  cache.clear();
}
