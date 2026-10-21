import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { APICallError, type LanguageModel } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/analyze/route";
import { analyzeResponseSchema, type CaseContext } from "@/lib/case/schemas";
import {
  loadCapture,
  visionModelFromCapture,
  visionOutputFromCapture,
} from "../helpers/capture-model";

// Characterization tests: the model is the only mock; every expected value
// comes from the captures under tests/fixtures/captures/2026-10-21.
const state = vi.hoisted(() => ({ model: undefined as unknown }));

vi.mock("@/lib/ai/provider", () => ({
  getDecisionModel: () => state.model as LanguageModel,
  getVisionModel: () => state.model as LanguageModel,
}));

type AnalyzeCapture = {
  request: {
    fields: Record<string, string>;
    photo: { bytes: number; fileName: string; sha256: string };
  };
  response: {
    status: number;
    body: { caseContext: CaseContext; imageAnalysis: Record<string, unknown> };
  };
};

const CAPTURE = "analyze-phone-1-return.endpoint.json";
const VISION_RETURN_PHONE_1 =
  "provider/2026-10-21T13-08-13.220Z-0002-vision-generate.json";
const PHOTO_PATH = path.resolve(
  import.meta.dirname,
  "../../../assets/example-images/phone-1.jpg"
);
const ENDPOINT = "http://localhost:3000/api/analyze";

const capture = loadCapture<AnalyzeCapture>(CAPTURE);

function photoFile(): File {
  return new File([readFileSync(PHOTO_PATH)], "phone-1.jpg", {
    type: "image/jpeg",
  });
}

function analyzeRequest(signal?: AbortSignal): Request {
  const body = new FormData();
  for (const [name, value] of Object.entries(capture.request.fields)) {
    body.append(name, value);
  }
  body.append("photo", photoFile());
  return new Request(ENDPOINT, { body, method: "POST", signal });
}

function freezeWarsawTime(iso: string): void {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(iso));
}

beforeEach(() => {
  freezeWarsawTime("2026-10-21T10:00:00Z");
});

afterEach(() => {
  vi.useRealTimers();
  state.model = undefined;
});

describe("POST /api/analyze with a captured photo", () => {
  it("returns 200 with the captured case context and image analysis", async () => {
    state.model = visionModelFromCapture(VISION_RETURN_PHONE_1);

    const response = await POST(analyzeRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(analyzeResponseSchema.safeParse(body).success).toBe(true);
    expect(body.caseContext).toEqual(capture.response.body.caseContext);
    expect(body.imageAnalysis).toEqual(capture.response.body.imageAnalysis);
  });

  it("returns the captured model output plus the variant of the case type", async () => {
    state.model = visionModelFromCapture(VISION_RETURN_PHONE_1);

    const response = await POST(analyzeRequest());
    const body = await response.json();

    expect(body.imageAnalysis).toEqual({
      ...visionOutputFromCapture<Record<string, unknown>>(
        VISION_RETURN_PHONE_1
      ),
      variant: "return",
    });
  });

  it("sends the photo whose bytes match the captured sha256", () => {
    const sha256 = createHash("sha256")
      .update(readFileSync(PHOTO_PATH))
      .digest("hex");

    expect(sha256).toBe(capture.request.photo.sha256);
  });

  it("computes daysSincePurchase and assessmentDate on the server from the Warsaw calendar date", async () => {
    // 22:30 UTC is already 00:30 on the next day in Europe/Warsaw.
    freezeWarsawTime("2026-10-21T22:30:00Z");
    state.model = visionModelFromCapture(VISION_RETURN_PHONE_1);

    const response = await POST(analyzeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.caseContext.assessmentDate).toBe("2026-10-22");
    expect(body.caseContext.daysSincePurchase).toBe(10);
  });

  it("maps an APICallError from the model to 502 ANALYSIS_FAILED without leaking provider text", async () => {
    const failing = new APICallError({
      isRetryable: false,
      message: "upstream provider secret sk-123",
      requestBodyValues: {},
      statusCode: 400,
      url: "https://openrouter.ai/api/v1/chat/completions",
    });
    state.model = new MockLanguageModelV4({
      doGenerate: () => Promise.reject(failing),
    });

    const response = await POST(analyzeRequest());
    const text = await response.text();

    expect(response.status).toBe(502);
    expect(JSON.parse(text)).toMatchObject({
      error: { code: "ANALYSIS_FAILED" },
    });
    expect(text).not.toContain("sk-123");
  });

  it("maps an aborted model call to 504 ANALYSIS_TIMEOUT", async () => {
    // The 50 s budget is not shortened by a test hook, so the timeout path is
    // exercised by aborting the request signal while the model call is pending.
    const controller = new AbortController();
    state.model = new MockLanguageModelV4({
      doGenerate: ({ abortSignal }) =>
        new Promise((_resolve, reject) => {
          abortSignal?.addEventListener("abort", () =>
            reject(abortSignal.reason)
          );
        }),
    });

    const pending = POST(analyzeRequest(controller.signal));
    setTimeout(() => controller.abort(), 10);
    const response = await pending;

    expect(response.status).toBe(504);
    expect(await response.json()).toMatchObject({
      error: { code: "ANALYSIS_TIMEOUT" },
    });
  });
});
