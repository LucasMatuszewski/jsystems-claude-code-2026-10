import { expect, test } from "@playwright/test";
import { findPart, isJpeg, jpegSize, parseMultipart } from "./helpers/photos";
import { FormPage } from "./pages/form.page";

const MAX_UPLOAD_BYTES = 1_048_576;
const MAX_LONG_EDGE = 1568;
/** laptop-1.png source dimensions (JPEG content): 3024 x 3135. */
const SOURCE_ASPECT = 3024 / 3135;

test.describe("E-21 @smoke photo reduction", () => {
  test("outgoing analyze request carries a reduced JPEG with kept aspect ratio", async ({
    page,
  }) => {
    const formPage = new FormPage(page);
    await formPage.goto();
    await formPage.fillValid({
      caseType: "return",
      category: "laptop",
      channel: "online",
      daysAgo: 3,
      photo: "laptop-1.png",
    });

    // Passive observation: no interception, the request goes to the real server.
    const requestPromise = page.waitForRequest(
      (candidate) =>
        new URL(candidate.url()).pathname === "/api/analyze" &&
        candidate.method() === "POST"
    );
    await formPage.submit();
    const request = await requestPromise;

    const body = request.postDataBuffer();
    expect(body).not.toBeNull();
    const contentType = request.headers()["content-type"] ?? "";
    const photo = findPart(
      parseMultipart(body ?? Buffer.alloc(0), contentType),
      "photo"
    );

    expect(photo.body.length).toBeLessThanOrEqual(MAX_UPLOAD_BYTES);
    expect(isJpeg(photo.body)).toBe(true);

    const { width, height } = jpegSize(photo.body);
    expect(Math.max(width, height)).toBeLessThanOrEqual(MAX_LONG_EDGE);
    expect(Math.abs(width - height * SOURCE_ASPECT)).toBeLessThanOrEqual(1);
  });
});
