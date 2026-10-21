import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { LanguageModelV4StreamPart } from "@ai-sdk/provider";
import {
  generateText,
  simulateReadableStream,
  streamText,
  wrapLanguageModel,
} from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRecordingFetch,
  createRecordingMiddleware,
  flushRecorders,
} from "./recorders";

let dir: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "rec-"));
});

afterEach(async () => {
  vi.restoreAllMocks();
  await fs.rm(dir, { force: true, recursive: true });
});

async function readJsonFiles(sub: string) {
  const d = path.join(dir, sub);
  const names = (await fs.readdir(d)).sort();
  return await Promise.all(
    names.map(async (name) => {
      const raw = await fs.readFile(path.join(d, name), "utf8");
      return { json: JSON.parse(raw), name, raw };
    })
  );
}

const usage = {
  inputTokens: { cacheRead: 0, cacheWrite: 0, noCache: 1, total: 1 },
  outputTokens: { reasoning: 0, text: 1, total: 1 },
};
const finishReason = { raw: "stop", unified: "stop" } as const;

describe("createRecordingFetch", () => {
  it("records a JSON exchange passively and redacts secrets and images", async () => {
    const make = () =>
      new Response(JSON.stringify({ ok: 1 }), {
        headers: { "content-type": "application/json", "x-test": "1" },
        status: 200,
      });
    const baseFetch = vi.fn(async () => make());
    const recording = createRecordingFetch({ baseFetch, captureDir: dir });
    const body = JSON.stringify({
      messages: [
        {
          content: [
            {
              image_url: { url: "data:image/jpeg;base64,/9j/4AAQ" },
              type: "image_url",
            },
          ],
        },
      ],
    });
    const res = await recording(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        body,
        headers: {
          Authorization: "Bearer sk-or-secret",
          "Content-Type": "application/json",
        },
        method: "POST",
      }
    );
    expect(await res.text()).toBe(await make().text());
    await flushRecorders();
    const files = await readJsonFiles("openrouter");
    expect(files).toHaveLength(1);
    const { raw, json } = files[0] as (typeof files)[number];
    expect(json.response.status).toBe(200);
    expect(json.response.headers["x-test"]).toBe("1");
    expect(json.response.body).toBe('{"ok":1}');
    expect(raw).not.toContain("sk-or-secret");
    expect(
      Object.keys(json.request.headers).map((k) => k.toLowerCase())
    ).not.toContain("authorization");
    const img = json.request.body.messages[0].content[0].image_url.url;
    expect(img.imageOmitted).toBe(true);
    expect(img.mediaType).toBe("image/jpeg");
    expect(img.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("records SSE bodies verbatim", async () => {
    const chunks = [
      'data: {"a":1}\n\n',
      'data: {"b":2}\n\n',
      "data: [DONE]\n\n",
    ];
    const enc = new TextEncoder();
    const baseFetch = vi.fn(
      async () =>
        new Response(
          new ReadableStream({
            start(c) {
              for (const ch of chunks) {
                c.enqueue(enc.encode(ch));
              }
              c.close();
            },
          }),
          { headers: { "content-type": "text/event-stream" }, status: 200 }
        )
    );
    const recording = createRecordingFetch({ baseFetch, captureDir: dir });
    const res = await recording("https://openrouter.ai/x", {
      body: "plain",
      method: "POST",
    });
    expect(await res.text()).toBe(chunks.join(""));
    await flushRecorders();
    const [file] = (await readJsonFiles("openrouter")) as [
      Awaited<ReturnType<typeof readJsonFiles>>[number],
    ];
    expect(file.json.response.body).toBe(chunks.join(""));
    expect(file.json.request.body).toBe("plain");
  });

  it("never affects the response when recording fails", async () => {
    const blocker = path.join(dir, "file");
    await fs.writeFile(blocker, "x");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const baseFetch = vi.fn(async () => new Response("hello", { status: 200 }));
    const recording = createRecordingFetch({
      baseFetch,
      captureDir: path.join(blocker, "sub"),
    });
    const res = await recording("https://openrouter.ai/x", {
      body: "{}",
      method: "POST",
    });
    expect(await res.text()).toBe("hello");
    await flushRecorders();
    expect(warn).toHaveBeenCalled();
  });
});

describe("createRecordingMiddleware", () => {
  it("records generate calls without altering output", async () => {
    const doGenerate = async () => ({
      content: [{ text: "Hello", type: "text" as const }],
      finishReason,
      usage,
      warnings: [],
    });
    const plain = new MockLanguageModelV4({ doGenerate });
    const wrapped = wrapLanguageModel({
      middleware: createRecordingMiddleware({
        captureDir: dir,
        label: "decision",
      }),
      model: new MockLanguageModelV4({ doGenerate }),
    });
    const a = await generateText({ model: plain, prompt: "hi" });
    const b = await generateText({ model: wrapped, prompt: "hi" });
    expect(b.text).toBe(a.text);
    await flushRecorders();
    const files = await readJsonFiles("provider");
    expect(files).toHaveLength(1);
    expect(files[0]?.name).toContain("-decision-generate.json");
    expect(files[0]?.json.result.content[0].text).toBe("Hello");
  });

  it("records stream parts in order without altering output", async () => {
    const parts = [
      { type: "stream-start", warnings: [] },
      { id: "1", type: "text-start" },
      { delta: "Hel", id: "1", type: "text-delta" },
      { delta: "lo", id: "1", type: "text-delta" },
      { id: "1", type: "text-end" },
      { finishReason, type: "finish", usage },
    ];
    const doStream = async () => ({
      stream: simulateReadableStream({
        chunks: parts as LanguageModelV4StreamPart[],
      }),
    });
    const plain = new MockLanguageModelV4({ doStream });
    const wrapped = wrapLanguageModel({
      middleware: createRecordingMiddleware({
        captureDir: dir,
        label: "vision",
      }),
      model: new MockLanguageModelV4({ doStream }),
    });
    const a = streamText({ model: plain, prompt: "hi" });
    const b = streamText({ model: wrapped, prompt: "hi" });
    expect(await b.text).toBe(await a.text);
    await flushRecorders();
    const files = await readJsonFiles("provider");
    expect(files).toHaveLength(1);
    expect(files[0]?.name).toContain("-vision-stream.json");
    expect(files[0]?.json.parts.map((p: { type: string }) => p.type)).toEqual(
      parts.map((p) => p.type)
    );
  });
});
