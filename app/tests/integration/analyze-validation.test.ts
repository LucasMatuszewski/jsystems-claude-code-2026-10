import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/analyze/route";
import { analyzeImage } from "@/lib/ai/image-analyst";
import { errorEnvelopeSchema } from "@/lib/case/errors";

// Pre-model validation only: the image analyst must never be reached.
vi.mock("@/lib/ai/image-analyst", () => ({
  analyzeImage: vi.fn(),
}));

const URL = "http://localhost/api/analyze";
const JPEG_LIKE = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]);
const HEIC_LIKE = new Uint8Array([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63, 0, 0,
  0, 0, 0, 0, 0, 0,
]);

function validFields(overrides: Record<string, string> = {}): FormData {
  const form = new FormData();
  const fields: Record<string, string> = {
    caseType: "return",
    category: "smartphone",
    modelName: "Testowy Model X1",
    purchaseChannel: "online",
    purchaseDate: "2026-10-12",
    reason: "",
    ...overrides,
  };
  for (const [name, value] of Object.entries(fields)) {
    form.append(name, value);
  }
  return form;
}

function multipartRequest(form: FormData): Request {
  return new Request(URL, { body: form, method: "POST" });
}

function photoBlob(bytes: Uint8Array<ArrayBuffer>, type = "image/jpeg"): Blob {
  return new Blob([bytes], { type });
}

async function expectEnvelope(
  response: Response,
  status: number,
  code: string
): Promise<unknown> {
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("no-store");
  const json: unknown = await response.json();
  const parsed = errorEnvelopeSchema.safeParse(json);
  expect(parsed.success).toBe(true);
  if (parsed.success) {
    expect(parsed.data.error.code).toBe(code);
  }
  return json;
}

describe("POST /api/analyze pre-model validation", () => {
  beforeEach(() => {
    vi.mocked(analyzeImage).mockClear();
  });

  it("rejects a JSON body with 415 UNSUPPORTED_CONTENT_TYPE", async () => {
    const response = await POST(
      new Request(URL, {
        body: "{}",
        headers: { "content-type": "application/json" },
        method: "POST",
      })
    );

    await expectEnvelope(response, 415, "UNSUPPORTED_CONTENT_TYPE");
    expect(analyzeImage).not.toHaveBeenCalled();
  });

  it("rejects a missing modelName with 400 and fields.modelName", async () => {
    const form = validFields({ modelName: "" });
    form.append("photo", photoBlob(JPEG_LIKE));

    const response = await POST(multipartRequest(form));

    const json = await expectEnvelope(response, 400, "VALIDATION_ERROR");
    const parsed = errorEnvelopeSchema.parse(json);
    expect(parsed.error.fields?.modelName).toBeTruthy();
    expect(analyzeImage).not.toHaveBeenCalled();
  });

  it("rejects a missing photo with 400 PHOTO_REQUIRED", async () => {
    const response = await POST(multipartRequest(validFields()));

    await expectEnvelope(response, 400, "PHOTO_REQUIRED");
    expect(analyzeImage).not.toHaveBeenCalled();
  });

  it("rejects a 1 048 577-byte photo with 413 PHOTO_TOO_LARGE", async () => {
    const form = validFields();
    form.append("photo", photoBlob(new Uint8Array(1_048_577)));

    const response = await POST(multipartRequest(form));

    await expectEnvelope(response, 413, "PHOTO_TOO_LARGE");
    expect(analyzeImage).not.toHaveBeenCalled();
  });

  it("rejects a HEIC-like signature declared as image/jpeg with 415 UNSUPPORTED_IMAGE_TYPE", async () => {
    const form = validFields();
    form.append("photo", photoBlob(HEIC_LIKE, "image/jpeg"));

    const response = await POST(multipartRequest(form));

    await expectEnvelope(response, 415, "UNSUPPORTED_IMAGE_TYPE");
    expect(analyzeImage).not.toHaveBeenCalled();
  });
});
