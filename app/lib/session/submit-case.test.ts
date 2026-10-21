import { describe, expect, it, vi } from "vitest";
import { errorResponse } from "@/lib/case/errors";
import type { CaseForm } from "@/lib/case/schemas";
import { ReductionError } from "@/lib/image/reduce";
import { analyzeResponseFromCapture } from "@/tests/fixtures/derived/analyze-response";
import { type SubmitDeps, submitCase } from "./submit-case";

const VALUES: CaseForm = {
  caseType: "return",
  category: "smartphone",
  modelName: "Testowy Model X1",
  purchaseChannel: "online",
  purchaseDate: "2026-10-12",
  reason: "",
};

const PHOTO = new File(["photo-bytes"], "phone-1.jpg", { type: "image/jpeg" });

function makeDeps(overrides: Partial<SubmitDeps> = {}): {
  deps: SubmitDeps;
  fetchMock: ReturnType<typeof vi.fn>;
  reduce: ReturnType<typeof vi.fn>;
} {
  const fetchMock = vi.fn<typeof fetch>(async () =>
    errorResponse("ANALYSIS_FAILED")
  );
  const reduce = vi.fn(async (file: Blob) => ({ blob: file }));
  const deps: SubmitDeps = {
    createObjectURL: () => "blob:reduced-photo",
    fetch: fetchMock as unknown as typeof fetch,
    reduce,
    ...overrides,
  };
  return { deps, fetchMock, reduce };
}

function freshSignal(): AbortSignal {
  return new AbortController().signal;
}

describe("submitCase", () => {
  it("returns the validated capture response on 200 and sends a complete multipart request", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        new Response(JSON.stringify(analyzeResponseFromCapture), {
          status: 200,
        })
    );
    const { deps } = makeDeps({
      fetch: fetchMock as unknown as typeof fetch,
    });

    const result = await submitCase(VALUES, PHOTO, freshSignal(), deps);

    expect(result).toEqual({
      caseContext: analyzeResponseFromCapture.caseContext,
      imageAnalysis: analyzeResponseFromCapture.imageAnalysis,
      ok: true,
      reducedPhoto: {
        blob: expect.any(Blob),
        url: "blob:reduced-photo",
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/analyze");
    expect(init?.method).toBe("POST");
    const body = init?.body;
    expect(body).toBeInstanceOf(FormData);
    const form = body as FormData;
    expect(form.get("caseType")).toBe("return");
    expect(form.get("purchaseChannel")).toBe("online");
    expect(form.get("category")).toBe("smartphone");
    expect(form.get("modelName")).toBe("Testowy Model X1");
    expect(form.get("purchaseDate")).toBe("2026-10-12");
    expect(form.get("reason")).toBe("");
    const photo = form.get("photo");
    expect(photo).toBeInstanceOf(File);
    expect((photo as File).name).toBe("photo.jpg");
    expect((photo as File).type).toBe("image/jpeg");
  });

  it("maps a 502 envelope to its error code", async () => {
    const { deps } = makeDeps({
      fetch: (() =>
        Promise.resolve(
          errorResponse("ANALYSIS_FAILED")
        )) as unknown as typeof fetch,
    });
    await expect(
      submitCase(VALUES, PHOTO, freshSignal(), deps)
    ).resolves.toEqual({ code: "ANALYSIS_FAILED", ok: false });
  });

  it("maps a 504 envelope to ANALYSIS_TIMEOUT", async () => {
    const { deps } = makeDeps({
      fetch: (() =>
        Promise.resolve(
          errorResponse("ANALYSIS_TIMEOUT")
        )) as unknown as typeof fetch,
    });
    await expect(
      submitCase(VALUES, PHOTO, freshSignal(), deps)
    ).resolves.toEqual({ code: "ANALYSIS_TIMEOUT", ok: false });
  });

  it("maps a 400 VALIDATION_ERROR envelope to its code", async () => {
    const { deps } = makeDeps({
      fetch: (() =>
        Promise.resolve(
          errorResponse("VALIDATION_ERROR")
        )) as unknown as typeof fetch,
    });
    await expect(
      submitCase(VALUES, PHOTO, freshSignal(), deps)
    ).resolves.toEqual({ code: "VALIDATION_ERROR", ok: false });
  });

  it("maps a non-JSON 500 to ANALYSIS_FAILED", async () => {
    const { deps } = makeDeps({
      fetch: (() =>
        Promise.resolve(
          new Response("<html>Internal Server Error</html>", { status: 500 })
        )) as unknown as typeof fetch,
    });
    await expect(
      submitCase(VALUES, PHOTO, freshSignal(), deps)
    ).resolves.toEqual({ code: "ANALYSIS_FAILED", ok: false });
  });

  it("maps a rejected fetch (network failure) to NETWORK_ERROR", async () => {
    const { deps } = makeDeps({
      fetch: (() =>
        Promise.reject(
          new TypeError("Failed to fetch")
        )) as unknown as typeof fetch,
    });
    await expect(
      submitCase(VALUES, PHOTO, freshSignal(), deps)
    ).resolves.toEqual({ code: "NETWORK_ERROR", ok: false });
  });

  it("maps a ReductionError to ANALYSIS_FAILED without calling fetch", async () => {
    const reduce = vi.fn(() =>
      Promise.reject(new ReductionError("does not fit"))
    );
    const { deps, fetchMock } = makeDeps({ reduce });
    await expect(
      submitCase(VALUES, PHOTO, freshSignal(), deps)
    ).resolves.toEqual({ code: "ANALYSIS_FAILED", ok: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps an already aborted signal to ANALYSIS_TIMEOUT", async () => {
    const controller = new AbortController();
    controller.abort();
    const { deps, fetchMock } = makeDeps();
    await expect(
      submitCase(VALUES, PHOTO, controller.signal, deps)
    ).resolves.toEqual({ code: "ANALYSIS_TIMEOUT", ok: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps a fetch aborted by the signal to ANALYSIS_TIMEOUT", async () => {
    const controller = new AbortController();
    const { deps } = makeDeps({
      fetch: ((_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError"))
          );
        })) as unknown as typeof fetch,
    });
    const pending = submitCase(VALUES, PHOTO, controller.signal, deps);
    controller.abort();
    await expect(pending).resolves.toEqual({
      code: "ANALYSIS_TIMEOUT",
      ok: false,
    });
  });
});
