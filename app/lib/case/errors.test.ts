import { describe, expect, it } from "vitest";
import {
  errorEnvelopeSchema,
  errorResponse,
  HTTP_STATUS,
  type HttpErrorCode,
  isAppErrorCode,
} from "./errors";
import { texts } from "./texts";

const httpCodes = Object.keys(HTTP_STATUS) as HttpErrorCode[];

describe("errorResponse", () => {
  it("returns status 413 with no-store and a valid envelope", async () => {
    const response = errorResponse("PHOTO_TOO_LARGE");
    expect(response.status).toBe(413);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toContain("application/json");

    const body = await response.json();
    expect(errorEnvelopeSchema.safeParse(body).success).toBe(true);
    expect(body).toEqual({
      error: {
        code: "PHOTO_TOO_LARGE",
        message: "Zdjęcie po zmniejszeniu przekracza 1 MB.",
      },
    });
  });

  it("includes fields when given", async () => {
    const response = errorResponse("VALIDATION_ERROR", { modelName: "x" });
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(errorEnvelopeSchema.safeParse(body).success).toBe(true);
    expect(body.error.fields).toEqual({ modelName: "x" });
  });

  it("omits the fields key when no fields are given", async () => {
    const body = await errorResponse("VALIDATION_ERROR").json();
    expect("fields" in body.error).toBe(false);
  });

  it.each(httpCodes)("has a status and a message for %s", async (code) => {
    const response = errorResponse(code);
    expect(response.status).toBe(HTTP_STATUS[code]);
    expect(texts.errors[code]).toEqual(expect.any(String));
    const body = await response.json();
    expect(body.error.message).toBe(texts.errors[code]);
  });
});

describe("isAppErrorCode", () => {
  it("accepts in-stream codes", () => {
    expect(isAppErrorCode("DECISION_FAILED")).toBe(true);
  });

  it("rejects unknown codes", () => {
    expect(isAppErrorCode("FOO")).toBe(false);
    expect(isAppErrorCode(undefined)).toBe(false);
  });
});
