/**
 * Passive upload observer for E-21 (TAC-005-01: no route interception, no mocks).
 *
 * Decision: Chromium returns null from `request.postDataBuffer()` for multipart
 * bodies that contain a Blob, so the outgoing photo cannot be read from the
 * Playwright request. Playwright request routing stays forbidden. Instead an
 * init script wraps `window.fetch`: for POSTs to `/api/analyze` with a FormData
 * body it reads the `photo` entry (Blob.arrayBuffer() does not consume the Blob)
 * and stores `{ size, type, bytes }` on `window.__e2eObservedUpload`. The wrapper
 * ALWAYS calls the original fetch with the original, unchanged arguments (bound
 * to `window`), so the real request reaches the real server unaltered. This is
 * observation, not interception or mocking.
 */
import type { Page } from "@playwright/test";

export type ObservedUpload = { size: number; type: string; bytes: Buffer };

export async function installUploadObserver(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (...args: Parameters<typeof fetch>) => {
      const [input, init] = args;
      try {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        const body = init?.body;
        if (
          new URL(url, window.location.href).pathname === "/api/analyze" &&
          body instanceof FormData
        ) {
          const photo = body.get("photo");
          if (photo instanceof Blob) {
            photo.arrayBuffer().then((buffer) => {
              let binary = "";
              const view = new Uint8Array(buffer);
              for (let i = 0; i < view.length; i += 0x80_00) {
                binary += String.fromCharCode(...view.subarray(i, i + 0x80_00));
              }
              (
                window as unknown as Record<string, unknown>
              ).__e2eObservedUpload = {
                base64: btoa(binary),
                size: photo.size,
                type: photo.type,
              };
            });
          }
        }
      } catch {
        /* observation must never affect the request */
      }
      return originalFetch(...args);
    };
  });
}

export async function readObservedUpload(page: Page): Promise<ObservedUpload> {
  await page.waitForFunction(
    () =>
      (window as unknown as Record<string, unknown>).__e2eObservedUpload !==
      undefined
  );
  const raw = await page.evaluate(
    () =>
      (window as unknown as Record<string, unknown>).__e2eObservedUpload as {
        base64: string;
        size: number;
        type: string;
      }
  );
  return {
    bytes: Buffer.from(raw.base64, "base64"),
    size: raw.size,
    type: raw.type,
  };
}
