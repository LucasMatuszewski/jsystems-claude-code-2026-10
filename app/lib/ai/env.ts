import "server-only";
import path from "node:path";

export class ConfigurationError extends Error {
  readonly variable: string;

  constructor(variable: string) {
    super(`Missing or invalid environment variable: ${variable}`);
    this.name = "ConfigurationError";
    this.variable = variable;
  }
}

export type AiEnv = {
  openRouterApiKey: string;
  llmModel: string;
  visionModel: string;
  policiesDir: string;
  port: number;
  captureDir: string | null;
};

const DEFAULT_POLICIES_DIR = "../docs/policies";
const DEFAULT_PORT = 3000;

let cached: AiEnv | null = null;

function optional(name: string): string {
  return (process.env[name] ?? "").trim();
}

function required(name: string): string {
  const value = optional(name);
  if (!value) {
    throw new ConfigurationError(name);
  }
  return value;
}

function parsePort(): number {
  const raw = optional("PORT");
  if (!raw) {
    return DEFAULT_PORT;
  }
  const port = Number(raw);
  if (!(Number.isInteger(port) && port > 0 && port <= 65_535)) {
    throw new ConfigurationError("PORT");
  }
  return port;
}

export function getAiEnv(): AiEnv {
  if (cached) {
    return cached;
  }
  const openRouterApiKey = required("OPENROUTER_API_KEY");
  const llmModel = required("LLM_MODEL");
  const capture = optional("AI_CAPTURE_DIR");
  cached = {
    captureDir: capture ? path.resolve(process.cwd(), capture) : null,
    llmModel,
    openRouterApiKey,
    policiesDir: path.resolve(
      process.cwd(),
      optional("POLICIES_DIR") || DEFAULT_POLICIES_DIR
    ),
    port: parsePort(),
    visionModel: optional("VISION_MODEL") || llmModel,
  };
  return cached;
}

export function resetAiEnvCache(): void {
  cached = null;
}
