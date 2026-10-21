import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import {
  installUploadObserver,
  readObservedUpload,
} from "./helpers/observe-upload";
import { examplePhotoPath, isJpeg, jpegSize } from "./helpers/photos";
import { FormPage } from "./pages/form.page";

const MAX_UPLOAD_BYTES = 1_048_576;
const MAX_LONG_EDGE = 1568;
/** laptop-1.png source dimensions (JPEG content): 3024 x 3135. */
const SOURCE_ASPECT = 3024 / 3135;

test.describe("jpegSize self-check @smoke", () => {
  test("reads dimensions of the original example photos", () => {
    expect(jpegSize(readFileSync(examplePhotoPath("phone-1.jpg")))).toEqual({
      height: 1200,
      width: 900,
    });
    expect(jpegSize(readFileSync(examplePhotoPath("laptop-1.png")))).toEqual({
      height: 3135,
      width: 3024,
    });
  });
});

test.describe("E-21 @smoke photo reduction", () => {
  test("outgoing analyze request carries a reduced JPEG with kept aspect ratio", async ({
    page,
  }) => {
    await installUploadObserver(page);
    const formPage = new FormPage(page);
    await formPage.goto();
    await formPage.fillValid({
      caseType: "return",
      category: "laptop",
      channel: "online",
      daysAgo: 3,
      photo: "laptop-1.png",
    });

    // Passive observation: the real request is sent unchanged to the real server.
    const requestPromise = page.waitForRequest(
      (candidate) =>
        new URL(candidate.url()).pathname === "/api/analyze" &&
        candidate.method() === "POST"
    );
    await formPage.submit();
    await requestPromise;

    const photo = await readObservedUpload(page);
    expect(photo.size).toBe(photo.bytes.length);
    expect(photo.size).toBeLessThanOrEqual(MAX_UPLOAD_BYTES);
    expect(isJpeg(photo.bytes)).toBe(true);

    const { width, height } = jpegSize(photo.bytes);
    console.log(`E-21 observed: ${photo.size} bytes, ${width}x${height}`);
    expect(Math.max(width, height)).toBeLessThanOrEqual(MAX_LONG_EDGE);
    expect(Math.abs(width - height * SOURCE_ASPECT)).toBeLessThanOrEqual(1);
  });
});
