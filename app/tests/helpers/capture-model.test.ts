import { generateText, Output } from "ai";
import { describe, expect, it } from "vitest";
import { returnAnalysisModelSchema } from "@/lib/case/schemas";
import {
  CAPTURE_DIR,
  decisionModelFromCaptures,
  loadCapture,
  visionModelFromCapture,
} from "./capture-model";

const VISION_RETURN_PHONE_1 =
  "provider/2026-10-21T13-08-13.220Z-0002-vision-generate.json";
const DECISION_TOOL_CALL =
  "provider/2026-10-21T13-09-24.198Z-0020-decision-stream.json";
const DECISION_TEXT =
  "provider/2026-10-21T13-09-29.123Z-0022-decision-stream.json";

const callOptions = { prompt: [] } as unknown as Parameters<
  ReturnType<typeof decisionModelFromCaptures>["doStream"]
>[0];

async function readAll(
  stream: ReadableStream<{ type: string }>
): Promise<{ type: string }[]> {
  const reader = stream.getReader();
  const parts: { type: string }[] = [];
  const pump = async (): Promise<void> => {
    const { done, value } = await reader.read();
    if (done) {
      return;
    }
    parts.push(value);
    await pump();
  };
  await pump();
  return parts;
}

describe("loadCapture", () => {
  it("loads an endpoint capture that has a sibling meta file", () => {
    const capture = loadCapture<{ response: { status: number } }>(
      "analyze-phone-1-return.endpoint.json"
    );

    expect(capture.response.status).toBe(200);
  });

  it("loads a provider recording under the capture folder that has a meta file", () => {
    const capture = loadCapture<{ label: string }>(VISION_RETURN_PHONE_1);

    expect(capture.label).toBe("vision");
  });

  it("resolves paths below CAPTURE_DIR, which is absolute", () => {
    expect(CAPTURE_DIR.startsWith("/")).toBe(true);
    expect(
      loadCapture<{ response: { status: number } }>(
        "analyze-phone-1-return.endpoint.json"
      ).response.status
    ).toBe(200);
  });

  it("throws for a capture that does not exist", () => {
    expect(() => loadCapture("does-not-exist.endpoint.json")).toThrow();
  });
});

describe("visionModelFromCapture", () => {
  it("returns the captured generate result through generateText with Output.object", async () => {
    const model = visionModelFromCapture(VISION_RETURN_PHONE_1);

    const result = await generateText({
      model,
      output: Output.object({ schema: returnAnalysisModelSchema }),
      prompt: "analyze",
    });

    expect(model.doGenerateCalls).toHaveLength(1);
    expect(result.output).toMatchObject({
      confidence: "high",
      imageUsable: "yes",
      matchesCategory: "yes",
    });
  });

  it("returns an identical result on every call (no shared mutable state)", async () => {
    const model = visionModelFromCapture(VISION_RETURN_PHONE_1);

    const first = await model.doGenerate(callOptions as never);
    const second = await model.doGenerate(callOptions as never);

    expect(second).toEqual(first);
    expect(second).not.toBe(first);
  });
});

describe("decisionModelFromCaptures", () => {
  it("returns one stream response per file, in the given order", async () => {
    const model = decisionModelFromCaptures([
      DECISION_TOOL_CALL,
      DECISION_TEXT,
    ]);

    const first = await readAll(
      (await model.doStream(callOptions as never)).stream
    );
    const second = await readAll(
      (await model.doStream(callOptions as never)).stream
    );

    expect(first.map((part) => part.type)).toContain("tool-call");
    expect(second.map((part) => part.type)).toContain("text-start");
    expect(second.map((part) => part.type)).not.toContain("tool-call");
    expect(model.doStreamCalls).toHaveLength(2);
  });

  it("fails when the model is called more often than captures were given", async () => {
    const model = decisionModelFromCaptures([DECISION_TEXT]);
    await model.doStream(callOptions as never);

    await expect(model.doStream(callOptions as never)).rejects.toThrow(
      /no captured stream left/
    );
  });
});
