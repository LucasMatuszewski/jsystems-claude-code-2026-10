/**
 * Turns provider-level capture files (written by lib/ai/recorders.ts) into
 * MockLanguageModelV4 instances, so tests replay REAL model output.
 *
 * - generate recordings: { recordedAt, label, params, result }
 * - stream recordings:   { recordedAt, label, params, parts }
 *
 * Captures are read-only fixtures; this module never writes to CAPTURE_DIR.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";

/** Absolute path of the 2026-10-21 capture folder (app/tests/fixtures/captures/2026-10-21). */
export const CAPTURE_DIR: string = path.resolve(
  import.meta.dirname,
  "../fixtures/captures/2026-10-21"
);

type GenerateRecording = { result: unknown };
type StreamRecording = { parts: unknown[] };

function assertHasMeta(absolutePath: string): void {
  const base = absolutePath.replace(/(\.endpoint)?\.json$/, "");
  const siblingMeta = `${base}.meta.json`;
  if (existsSync(siblingMeta)) {
    return;
  }
  const folderHasMeta = readdirSync(CAPTURE_DIR).some((name) =>
    name.endsWith(".meta.json")
  );
  if (!folderHasMeta) {
    throw new Error(
      `Capture ${absolutePath} has no sibling meta file and ${CAPTURE_DIR} has no folder meta (TAC-005-02)`
    );
  }
}

/**
 * Loads a capture relative to CAPTURE_DIR. Throws unless a sibling `*.meta.json`
 * exists or the capture folder carries its own meta file (TAC-005-02).
 */
export function loadCapture<T>(relativePath: string): T {
  const absolutePath = path.resolve(CAPTURE_DIR, relativePath);
  if (!absolutePath.startsWith(`${CAPTURE_DIR}${path.sep}`)) {
    throw new Error(`Capture path escapes CAPTURE_DIR: ${relativePath}`);
  }
  assertHasMeta(absolutePath);
  return JSON.parse(readFileSync(absolutePath, "utf8")) as T;
}

/** Captured generate result as a fresh copy, so calls never share state. */
function generateResultOf(file: string): unknown {
  const recording = loadCapture<GenerateRecording>(file);
  return structuredClone(recording.result);
}

/** A vision model whose doGenerate returns the captured result of one recording. */
export function visionModelFromCapture(file: string): MockLanguageModelV4 {
  const result = generateResultOf(file);
  return new MockLanguageModelV4({
    doGenerate: async () => structuredClone(result) as never,
  });
}

/** Captured generate result as parsed JSON (the model's text part). */
export function visionOutputFromCapture<T = unknown>(file: string): T {
  const result = generateResultOf(file) as {
    content: { type: string; text?: string }[];
  };
  const text = result.content.find((part) => part.type === "text")?.text;
  if (text === undefined) {
    throw new Error(`Capture ${file} has no text content part`);
  }
  return JSON.parse(text) as T;
}

/**
 * A decision model that returns one captured stream per doStream call, in the
 * order of `files` (e.g. step 0 tool call, then step 1 text).
 */
export function decisionModelFromCaptures(
  files: string[]
): MockLanguageModelV4 {
  const responses = files.map((file) => {
    const recording = loadCapture<StreamRecording>(file);
    return structuredClone(recording.parts);
  });
  let next = 0;
  return new MockLanguageModelV4({
    doStream: () => {
      const parts = responses[next];
      if (parts === undefined) {
        return Promise.reject(
          new Error(
            `decisionModelFromCaptures: no captured stream left for call ${next + 1} (have ${responses.length})`
          )
        );
      }
      next += 1;
      return Promise.resolve({
        stream: simulateReadableStream({ chunks: parts as never[] }),
      } as never);
    },
  });
}
