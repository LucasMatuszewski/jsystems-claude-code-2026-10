import "server-only";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { LanguageModelMiddleware } from "ai";

const DATA_IMAGE_PREFIX = "data:image/";
const DATA_URL_RE = /^data:([^;,]+)(;base64)?,([\s\S]*)$/;

const pending = new Set<Promise<void>>();
let sequence = 0;

function track(task: Promise<void>): void {
  const wrapped = task
    .catch((error: unknown) => {
      console.warn(
        "[ai-capture] recording failed:",
        error instanceof Error ? error.message : String(error)
      );
    })
    .finally(() => {
      pending.delete(wrapped);
    });
  pending.add(wrapped);
}

export async function flushRecorders(): Promise<void> {
  if (pending.size === 0) {
    return;
  }
  await Promise.all([...pending]);
  await flushRecorders();
}

async function collect<T>(stream: ReadableStream<T>): Promise<T[]> {
  const reader = stream.getReader();
  const items: T[] = [];
  const pump = async (): Promise<void> => {
    const { done, value } = await reader.read();
    if (done) {
      return;
    }
    items.push(value);
    await pump();
  };
  await pump();
  return items;
}

function omitted(mediaType: string, bytes: Uint8Array) {
  return {
    bytes: bytes.byteLength,
    imageOmitted: true,
    mediaType,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

function sanitizeDataUrl(value: string) {
  const match = DATA_URL_RE.exec(value);
  if (!match) {
    return value;
  }
  const [, mediaType = "", base64, payload = ""] = match;
  const bytes = base64
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload));
  return omitted(mediaType, bytes);
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.startsWith(DATA_IMAGE_PREFIX) ? sanitizeDataUrl(value) : value;
  }
  if (value instanceof Uint8Array) {
    return omitted("application/octet-stream", value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    // AI SDK file parts: keep mediaType, replace binary/base64 data.
    if (
      record.type === "file" &&
      typeof record.mediaType === "string" &&
      (record.data instanceof Uint8Array || typeof record.data === "string")
    ) {
      const { data } = record;
      const bytes =
        data instanceof Uint8Array
          ? data
          : Buffer.from(
              data.startsWith("data:")
                ? (DATA_URL_RE.exec(data)?.[3] ?? "")
                : data,
              "base64"
            );
      return {
        ...sanitizeObject(record),
        data: omitted(record.mediaType, bytes),
      };
    }
    return sanitizeObject(record);
  }
  return value;
}

function sanitizeObject(record: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(record)) {
    out[key] = sanitizeValue(val);
  }
  return out;
}

function stamp(): string {
  sequence += 1;
  const ts = new Date().toISOString().replaceAll(":", "-");
  return `${ts}-${String(sequence).padStart(4, "0")}`;
}

async function writeJson(dir: string, name: string, data: unknown) {
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), JSON.stringify(data, null, 2));
}

function parseBody(body: unknown): unknown {
  if (typeof body !== "string") {
    return body === undefined || body === null ? null : String(body);
  }
  try {
    return sanitizeValue(JSON.parse(body));
  } catch {
    return body;
  }
}

function headersToObject(headers: Headers, redact: boolean) {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    if (!(redact && key.toLowerCase() === "authorization")) {
      out[key] = value;
    }
  });
  return out;
}

export function createRecordingFetch(opts: {
  captureDir: string;
  baseFetch?: typeof fetch;
}): typeof fetch {
  const baseFetch = opts.baseFetch ?? globalThis.fetch;
  const dir = path.join(opts.captureDir, "openrouter");
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await baseFetch(input, init);
    try {
      const clone = response.clone();
      const name = `${stamp()}.json`;
      const recordedAt = new Date().toISOString();
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      const method =
        init?.method ?? (input instanceof Request ? input.method : "GET");
      const requestHeaders = headersToObject(
        new Headers(
          init?.headers ??
            (input instanceof Request ? input.headers : undefined)
        ),
        true
      );
      const requestBody = parseBody(init?.body);
      track(
        (async () => {
          const body = await clone.text();
          await writeJson(dir, name, {
            recordedAt,
            request: {
              body: requestBody,
              headers: requestHeaders,
              method,
              url,
            },
            response: {
              body,
              headers: headersToObject(clone.headers, false),
              status: clone.status,
              statusText: clone.statusText,
            },
          });
        })()
      );
    } catch (error) {
      console.warn(
        "[ai-capture] recording failed:",
        error instanceof Error ? error.message : String(error)
      );
    }
    return response;
  }) as typeof fetch;
}

export function createRecordingMiddleware(opts: {
  captureDir: string;
  label: string;
}): LanguageModelMiddleware {
  const dir = path.join(opts.captureDir, "provider");
  const sanitizeParams = (params: Record<string, unknown>) => ({
    prompt: sanitizeValue(params.prompt),
    responseFormat: sanitizeValue(params.responseFormat),
    toolChoice: sanitizeValue(params.toolChoice),
    tools: sanitizeValue(params.tools),
  });
  return {
    specificationVersion: "v4",
    wrapGenerate: async ({ doGenerate, params }) => {
      const result = await doGenerate();
      try {
        const name = `${stamp()}-${opts.label}-generate.json`;
        const data = {
          label: opts.label,
          params: sanitizeParams(params as unknown as Record<string, unknown>),
          recordedAt: new Date().toISOString(),
          result: sanitizeValue(result),
        };
        track(writeJson(dir, name, data));
      } catch (error) {
        console.warn("[ai-capture] recording failed:", String(error));
      }
      return result;
    },
    wrapStream: async ({ doStream, params }) => {
      const result = await doStream();
      try {
        const [branchA, branchB] = result.stream.tee();
        const name = `${stamp()}-${opts.label}-stream.json`;
        const recordedAt = new Date().toISOString();
        const safeParams = sanitizeParams(
          params as unknown as Record<string, unknown>
        );
        track(
          (async () => {
            const parts = await collect(branchB);
            await writeJson(dir, name, {
              label: opts.label,
              params: safeParams,
              parts: sanitizeValue(parts),
              recordedAt,
            });
          })()
        );
        return { ...result, stream: branchA };
      } catch (error) {
        console.warn("[ai-capture] recording failed:", String(error));
        return result;
      }
    },
  };
}
