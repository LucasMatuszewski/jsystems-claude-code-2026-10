import "@testing-library/jest-dom/vitest";

// Tests must never use real credentials or hit the real LLM provider.
process.env.OPENROUTER_API_KEY = "test-dummy-key";
process.env.LLM_MODEL = "test/dummy-model";
process.env.VISION_MODEL = "";
delete process.env.AI_CAPTURE_DIR;

const FORBIDDEN_HOST_SUFFIX = "openrouter.ai";
const originalFetch = globalThis.fetch;

function requestUrl(input: string | URL | Request): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
  const hostname = hostnameOf(requestUrl(input));
  if (hostname.endsWith(FORBIDDEN_HOST_SUFFIX)) {
    throw new Error(
      "Network access to openrouter.ai is forbidden in unit/integration tests"
    );
  }
  return originalFetch(input, init);
}) as typeof fetch;
