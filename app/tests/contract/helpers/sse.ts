/** One parsed AI SDK UI message stream chunk (SSE `data:` payload). */
export type UiChunk = { type: string; [key: string]: unknown };

/**
 * Parses a Server-Sent Events body of the AI SDK UI message stream.
 * Events are separated by blank lines; comment and empty lines are ignored;
 * the `data: [DONE]` sentinel ends the stream and is not returned as a chunk.
 */
export function parseSse(raw: string): UiChunk[] {
  const chunks: UiChunk[] = [];
  for (const block of raw.split(/\r?\n\r?\n/)) {
    const dataLines = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice("data:".length).replace(/^ /, ""));
    if (dataLines.length === 0) {
      continue;
    }
    const payload = dataLines.join("\n");
    if (payload === "[DONE]") {
      break;
    }
    const chunk: unknown = JSON.parse(payload);
    if (
      typeof chunk !== "object" ||
      chunk === null ||
      typeof (chunk as { type?: unknown }).type !== "string"
    ) {
      throw new Error(`SSE chunk without a string type: ${payload}`);
    }
    chunks.push(chunk as UiChunk);
  }
  return chunks;
}

/** Concatenated `text-delta` payloads, in stream order. */
export function textOf(chunks: UiChunk[]): string {
  return chunks
    .filter((chunk) => chunk.type === "text-delta")
    .map((chunk) => String(chunk.delta ?? ""))
    .join("");
}

/** All `tool-input-available` chunks for the given tool name. */
export function toolInputs(chunks: UiChunk[], toolName: string): UiChunk[] {
  return chunks.filter(
    (chunk) =>
      chunk.type === "tool-input-available" && chunk.toolName === toolName
  );
}
