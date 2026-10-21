/**
 * Derived from a real capture, not hand-written.
 *
 * Source capture: tests/fixtures/captures/2026-10-21/analyze-phone-1-return.endpoint.json
 * Captured on 2026-10-21 against POST /api/analyze, scenario "phone-1, return"
 * (smartphone, online purchase, empty reason). Only `response.body` is used here.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { analyzeResponseSchema } from "../../../lib/case/schemas";

export const CAPTURE_SOURCE =
  "tests/fixtures/captures/2026-10-21/analyze-phone-1-return.endpoint.json";

type EndpointCapture = {
  request: unknown;
  response: { status: number; headers: Record<string, string>; body: unknown };
};

const capture = JSON.parse(
  // Tests run from app/ (npm test), so the capture path is relative to the working directory.
  readFileSync(resolve(process.cwd(), CAPTURE_SOURCE), "utf8")
) as EndpointCapture;

if (capture.response.status !== 200) {
  throw new Error(
    `Capture ${CAPTURE_SOURCE} is not a 200 response (status ${capture.response.status})`
  );
}

/** The captured 200 body, validated against the production response schema. */
export const analyzeResponseFromCapture = analyzeResponseSchema.parse(
  capture.response.body
);
