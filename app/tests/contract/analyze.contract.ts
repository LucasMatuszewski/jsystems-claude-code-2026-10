import {
  type APIRequestContext,
  type APIResponse,
  expect,
  test,
} from "@playwright/test";
import { errorEnvelopeSchema } from "../../lib/case/errors";
import { analyzeResponseSchema } from "../../lib/case/schemas";
import { saveEndpointCapture, sha256 } from "./helpers/capture";
import {
  expectedDaysSincePurchase,
  type FormFields,
  formFields,
} from "./helpers/case-data";
import { type PhotoName, photoPart } from "./helpers/photos";

const ENDPOINT = "/api/analyze";

type MultipartValue =
  | string
  | { name: string; mimeType: string; buffer: Buffer };

function postAnalyze(
  request: APIRequestContext,
  multipart: Record<string, MultipartValue>
): Promise<APIResponse> {
  return request.post(ENDPOINT, { multipart });
}

function responseHeaders(response: APIResponse): Record<string, string> {
  return response.headers();
}

async function readBody(
  response: APIResponse
): Promise<{ text: string; json: unknown }> {
  const text = await response.text();
  let json: unknown = text;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { json, text };
}

function expectErrorEnvelope(
  response: APIResponse,
  status: number,
  code: string,
  json: unknown
): void {
  expect(response.status()).toBe(status);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(response.headers()["content-type"]).toContain("application/json");
  const parsed = errorEnvelopeSchema.safeParse(json);
  expect(parsed.success, JSON.stringify(json)).toBe(true);
  if (parsed.success) {
    expect(parsed.data.error.code).toBe(code);
  }
}

// ---------------------------------------------------------------------------
// C-02: successful analysis per photo and case type (real OpenRouter call).
// ---------------------------------------------------------------------------

const SUCCESS_CASES: { photo: PhotoName; category: string }[] = [
  { category: "smartphone", photo: "phone-1.jpg" },
  { category: "smartphone", photo: "phone-2.jpeg" },
  { category: "smartphone", photo: "phone-3.jpeg" },
  { category: "laptop", photo: "laptop-2.webp" },
];
const CASE_TYPES = ["return", "complaint"] as const;

test.describe("C-02 analyze per photo @capture", () => {
  for (const { photo, category } of SUCCESS_CASES) {
    for (const caseType of CASE_TYPES) {
      const base = photo.replace(/\.[^.]+$/, "");
      test(`C-02 ${photo} ${caseType} @capture`, async ({ request }) => {
        const fields: FormFields = formFields({
          caseType,
          category,
          daysAgo: 9,
          purchaseChannel: "online",
        });
        const part = photoPart(photo);
        const response = await postAnalyze(request, { ...fields, photo: part });
        const { json, text } = await readBody(response);

        expect(response.status()).toBe(200);
        expect(response.headers()["content-type"]).toContain(
          "application/json"
        );
        expect(response.headers()["cache-control"]).toBe("no-store");

        const parsed = analyzeResponseSchema.safeParse(json);
        expect(parsed.success, text).toBe(true);
        if (!parsed.success) {
          return;
        }
        const { caseContext, imageAnalysis } = parsed.data;
        expect(imageAnalysis.variant).toBe(caseType);
        expect(caseContext.caseType).toBe(caseType);
        expect(caseContext.daysSincePurchase).toBe(
          expectedDaysSincePurchase(fields.purchaseDate)
        );

        console.log(
          `C-02 ${photo} ${caseType} imageAnalysis: ${JSON.stringify(imageAnalysis, null, 2)}`
        );

        saveEndpointCapture(`analyze-${base}-${caseType}`, {
          request: {
            fields,
            photo: {
              bytes: part.buffer.length,
              fileName: photo,
              sha256: sha256(part.buffer),
            },
          },
          response: {
            body: json,
            headers: responseHeaders(response),
            status: response.status(),
          },
        });
      });
    }
  }
});

// ---------------------------------------------------------------------------
// C-03: rejected requests return the shared error envelope (ADR-003 §4.5).
// ---------------------------------------------------------------------------

test.describe("C-03 analyze rejects", () => {
  test("C-03 (a) oversized photo returns 413 PHOTO_TOO_LARGE", async ({
    request,
  }) => {
    const fields = formFields({
      caseType: "return",
      category: "laptop",
      daysAgo: 9,
      purchaseChannel: "online",
    });
    const response = await postAnalyze(request, {
      ...fields,
      photo: photoPart("laptop-1.png"),
    });
    const { json } = await readBody(response);
    expectErrorEnvelope(response, 413, "PHOTO_TOO_LARGE", json);
  });

  test("C-03 (b) missing photo returns 400 PHOTO_REQUIRED", async ({
    request,
  }) => {
    const fields = formFields({
      caseType: "return",
      category: "smartphone",
      daysAgo: 9,
      purchaseChannel: "online",
    });
    const response = await postAnalyze(request, { ...fields });
    const { json } = await readBody(response);
    expectErrorEnvelope(response, 400, "PHOTO_REQUIRED", json);
  });

  test("C-03 (c) invalid fields return 400 VALIDATION_ERROR with field errors", async ({
    request,
  }) => {
    const fields = {
      ...formFields({
        caseType: "return",
        category: "smartphone",
        daysAgo: 9,
        purchaseChannel: "online",
      }),
      caseType: "x",
      modelName: "A",
    };
    const response = await postAnalyze(request, {
      ...fields,
      photo: photoPart("phone-2.jpeg"),
    });
    const { json } = await readBody(response);
    expectErrorEnvelope(response, 400, "VALIDATION_ERROR", json);
    const parsed = errorEnvelopeSchema.parse(json);
    expect(parsed.error.fields).toBeDefined();
    expect(parsed.error.fields?.modelName).toBeTruthy();
    expect(parsed.error.fields?.caseType).toBeTruthy();
  });

  test("C-03 (d) JSON body returns 415 UNSUPPORTED_CONTENT_TYPE", async ({
    request,
  }) => {
    const response = await request.post(ENDPOINT, { data: {} });
    const { json } = await readBody(response);
    expectErrorEnvelope(response, 415, "UNSUPPORTED_CONTENT_TYPE", json);
  });
});
