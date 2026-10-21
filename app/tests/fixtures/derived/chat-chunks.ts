/**
 * Derived from real captures, not hand-written.
 *
 * Source captures (POST /api/chat, scenario "phone-1, return", captured 2026-10-21):
 *  - tests/fixtures/captures/2026-10-21/chat-first-turn-phone-1-return.endpoint.json
 *  - tests/fixtures/captures/2026-10-21/chat-follow-up-phone-1-return.endpoint.json
 * Only `response.body.chunks` (the parsed UI message chunks, in order) is used.
 *
 * `chunksUntil` and `withErrorAfter` cut a real chunk list and append an `error`
 * chunk: controlled variations of real shapes, each use is documented in the tests.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { UIMessageChunk } from "ai";

const CAPTURE_DIR = "tests/fixtures/captures/2026-10-21";
export const FIRST_TURN_CAPTURE = `${CAPTURE_DIR}/chat-first-turn-phone-1-return.endpoint.json`;
export const FOLLOW_UP_CAPTURE = `${CAPTURE_DIR}/chat-follow-up-phone-1-return.endpoint.json`;

type ChatCapture = {
  request: unknown;
  response: { status: number; body: { chunks: UIMessageChunk[] } };
};

function readChunks(path: string): UIMessageChunk[] {
  // Tests run from app/ (npm test), so the path is relative to the working directory.
  const capture = JSON.parse(
    readFileSync(resolve(process.cwd(), path), "utf8")
  ) as ChatCapture;
  if (capture.response.status !== 200) {
    throw new Error(`Capture ${path} is not a 200 response`);
  }
  return capture.response.body.chunks;
}

export const firstTurnChunks: UIMessageChunk[] = readChunks(FIRST_TURN_CAPTURE);
export const followUpChunks: UIMessageChunk[] = readChunks(FOLLOW_UP_CAPTURE);

/** Chunks up to (excluding) the first chunk matching the predicate. */
export function chunksUntil(
  chunks: readonly UIMessageChunk[],
  predicate: (chunk: UIMessageChunk) => boolean
): UIMessageChunk[] {
  const index = chunks.findIndex(predicate);
  return index === -1 ? [...chunks] : chunks.slice(0, index);
}

/** The first `index` chunks followed by an `error` chunk (a mid-stream failure). */
export function withErrorAfter(
  chunks: readonly UIMessageChunk[],
  index: number,
  errorText: string
): UIMessageChunk[] {
  return [...chunks.slice(0, index), { errorText, type: "error" }];
}
