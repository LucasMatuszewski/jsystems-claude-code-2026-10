import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// Playwright loads specs as CommonJS, so resolve from the run directory (app/),
// the same assumption playwright.config.ts makes for ../.env.
const APP_DIR = process.cwd();
const REDACTED_HEADERS = new Set(["authorization", "set-cookie"]);

export type CapturedRequest = {
  /** Text form fields, exactly as sent. */
  fields?: Record<string, string>;
  /** Photo sent in the multipart body (name only, hash, never bytes). */
  photo?: { fileName: string; sha256: string; bytes: number };
  /** Non-multipart request description (method, path, content type). */
  method?: string;
  path?: string;
  contentType?: string;
  body?: unknown;
};

export type CapturedResponse = {
  status: number;
  headers: Record<string, string>;
  body: unknown | string;
};

/**
 * Writes `<AI_CAPTURE_DIR>/<scenario>.endpoint.json` and `.meta.json`.
 * No-op unless AI_CAPTURE_DIR is set (contract and E2E runs never set it).
 */
export function saveEndpointCapture(
  scenario: string,
  data: { request: CapturedRequest; response: CapturedResponse }
): void {
  const captureDir = process.env.AI_CAPTURE_DIR;
  if (captureDir === undefined || captureDir.length === 0) {
    return;
  }
  const outDir = path.resolve(APP_DIR, captureDir);
  mkdirSync(outDir, { recursive: true });

  const headers = Object.fromEntries(
    Object.entries(data.response.headers).filter(
      ([name]) => !REDACTED_HEADERS.has(name.toLowerCase())
    )
  );
  const endpoint = { response: { ...data.response, headers } };
  writeFileSync(
    path.join(outDir, `${scenario}.endpoint.json`),
    `${JSON.stringify({ request: data.request, ...endpoint }, null, 2)}\n`
  );

  const meta = {
    appCommit: gitHead(),
    capturedAt: new Date().toISOString(),
    request: {
      fields: data.request.fields,
      photo: data.request.photo,
    },
    scenario,
    target: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    versions: {
      "@openrouter/ai-sdk-provider": packageVersion(
        "@openrouter/ai-sdk-provider"
      ),
      ai: packageVersion("ai"),
      next: packageVersion("next"),
    },
  };
  writeFileSync(
    path.join(outDir, `${scenario}.meta.json`),
    `${JSON.stringify(meta, null, 2)}\n`
  );
}

/** SHA-256 of a photo buffer, for the capture record. */
export function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function gitHead(): string {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: APP_DIR,
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

function packageVersion(name: string): string {
  const manifest = path.join(APP_DIR, "node_modules", name, "package.json");
  const parsed = JSON.parse(readFileSync(manifest, "utf8")) as {
    version?: string;
  };
  return parsed.version ?? "unknown";
}
