import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { errorResponse } from "@/lib/case/errors";
import type { CaseContext, ImageAnalysis } from "@/lib/case/schemas";
import { CaseSessionProvider, useCaseSession } from "@/lib/session/context";
import type { CaseSessionAction } from "@/lib/session/reducer";
import type { CaseSessionState } from "@/lib/session/state";
import type { SubmitDeps } from "@/lib/session/submit-case";
import { useSubmission } from "@/lib/session/use-submission";
import { analyzeResponseFromCapture } from "@/tests/fixtures/derived/analyze-response";

type Probe = {
  state: CaseSessionState;
  dispatch: (action: CaseSessionAction) => void;
  submit: () => Promise<void>;
};

let probe: Probe;

type HarnessProps = {
  startChat: (args: {
    caseContext: CaseContext;
    imageAnalysis: ImageAnalysis;
  }) => void;
  onDeadline?: () => void;
  deps?: Partial<SubmitDeps>;
};

function Harness({ startChat, onDeadline, deps }: HarnessProps) {
  const { state, dispatch } = useCaseSession();
  const { submit } = useSubmission({ deps, onDeadline, startChat });
  probe = { dispatch, state, submit };
  return null;
}

const createTestChatId = () => "test-chat";

const PHOTO = new File(["photo-bytes"], "phone-1.jpg", { type: "image/jpeg" });

/** Renders the harness with a valid, pre-filled form (values as the form would hold them). */
function renderHarness(props: HarnessProps): void {
  render(
    <CaseSessionProvider createChatId={createTestChatId}>
      <Harness {...props} />
    </CaseSessionProvider>
  );
  act(() => {
    probe.dispatch({
      field: "caseType",
      type: "FORM_CHANGED",
      value: "return",
    });
    probe.dispatch({
      field: "purchaseChannel",
      type: "FORM_CHANGED",
      value: "online",
    });
    probe.dispatch({
      field: "category",
      type: "FORM_CHANGED",
      value: "smartphone",
    });
    probe.dispatch({
      field: "modelName",
      type: "FORM_CHANGED",
      value: "Testowy Model X1",
    });
    probe.dispatch({
      field: "purchaseDate",
      type: "FORM_CHANGED",
      value: "2026-10-12",
    });
    probe.dispatch({ field: "reason", type: "FORM_CHANGED", value: "" });
    probe.dispatch({
      photo: { file: PHOTO, url: "blob:original" },
      type: "PHOTO_SELECTED",
    });
  });
}

function passThroughDeps(
  overrides: Partial<SubmitDeps> = {}
): Partial<SubmitDeps> {
  return {
    createObjectURL: () => "blob:reduced-photo",
    reduce: async (file: Blob) => ({ blob: file }),
    ...overrides,
  };
}

/** Fetch that stays pending until the test resolves it, and honours the abort signal. */
function deferredFetch() {
  let resolveFetch: ((response: Response) => void) | undefined;
  const fetchMock = vi.fn(
    (_url: string, init?: RequestInit) =>
      new Promise<Response>((resolve, reject) => {
        resolveFetch = resolve;
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError"))
        );
      })
  );
  return {
    fetchMock,
    resolve: (response: Response) => resolveFetch?.(response),
  };
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useSubmission", () => {
  it("moves through analyzing and deciding, then starts the chat once with the capture data", async () => {
    const startChat = vi.fn();
    const pending = deferredFetch();
    renderHarness({
      deps: passThroughDeps({
        fetch: pending.fetchMock as unknown as typeof fetch,
      }),
      startChat,
    });

    let submission: Promise<void> | undefined;
    act(() => {
      submission = probe.submit();
    });
    expect(probe.state.screen).toBe("processing");
    expect(probe.state.processingStep).toBe("analyzing");

    await vi.waitFor(() => expect(pending.fetchMock).toHaveBeenCalledTimes(1));
    act(() => {
      pending.resolve(
        new Response(JSON.stringify(analyzeResponseFromCapture), {
          status: 200,
        })
      );
    });
    await act(async () => {
      await submission;
    });

    expect(probe.state.processingStep).toBe("deciding");
    expect(probe.state.screen).toBe("processing");
    expect(probe.state.caseContext).toEqual(
      analyzeResponseFromCapture.caseContext
    );
    expect(startChat).toHaveBeenCalledTimes(1);
    expect(startChat).toHaveBeenCalledWith({
      caseContext: analyzeResponseFromCapture.caseContext,
      imageAnalysis: analyzeResponseFromCapture.imageAnalysis,
    });
  });

  it("returns to the form with an error, keeping the form values and the photo, when the analysis fails", async () => {
    const startChat = vi.fn();
    renderHarness({
      deps: passThroughDeps({
        fetch: (async () =>
          errorResponse("ANALYSIS_FAILED")) as unknown as typeof fetch,
      }),
      startChat,
    });

    await act(async () => {
      await probe.submit();
    });

    expect(probe.state.screen).toBe("form");
    expect(probe.state.processingStep).toBeNull();
    expect(probe.state.submissionError).toBe("ANALYSIS_FAILED");
    expect(probe.state.formValues.modelName).toBe("Testowy Model X1");
    expect(probe.state.originalPhoto?.file).toBe(PHOTO);
    expect(startChat).not.toHaveBeenCalled();
  });

  it("aborts at the 60 s deadline while processing, calls onDeadline and reports ANALYSIS_TIMEOUT", async () => {
    vi.useFakeTimers();
    const startChat = vi.fn();
    const onDeadline = vi.fn();
    const pending = deferredFetch();
    renderHarness({
      deps: passThroughDeps({
        fetch: pending.fetchMock as unknown as typeof fetch,
      }),
      onDeadline,
      startChat,
    });

    await act(async () => {
      probe.submit();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(probe.state.screen).toBe("processing");
    expect(onDeadline).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    const signal = pending.fetchMock.mock.calls[0]?.[1]?.signal;
    expect(signal?.aborted).toBe(true);
    expect(onDeadline).toHaveBeenCalledTimes(1);
    expect(probe.state.screen).toBe("form");
    expect(probe.state.submissionError).toBe("ANALYSIS_TIMEOUT");
    expect(startChat).not.toHaveBeenCalled();
  });

  it("keeps the deadline running after ANALYSIS_SUCCEEDED until the first chunk arrives", async () => {
    vi.useFakeTimers();
    const startChat = vi.fn();
    const onDeadline = vi.fn();
    const pending = deferredFetch();
    renderHarness({
      deps: passThroughDeps({
        fetch: pending.fetchMock as unknown as typeof fetch,
      }),
      onDeadline,
      startChat,
    });

    await act(async () => {
      probe.submit();
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      pending.resolve(
        new Response(JSON.stringify(analyzeResponseFromCapture), {
          status: 200,
        })
      );
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(probe.state.processingStep).toBe("deciding");

    act(() => {
      probe.dispatch({ type: "FIRST_CHUNK_RECEIVED" });
    });
    expect(probe.state.screen).toBe("chat");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(70_000);
    });
    expect(probe.state.screen).toBe("chat");
    expect(probe.state.submissionError).toBeNull();
    expect(onDeadline).not.toHaveBeenCalled();
  });

  it("still expires after ANALYSIS_SUCCEEDED when no chunk arrives within 60 s", async () => {
    vi.useFakeTimers();
    const startChat = vi.fn();
    const onDeadline = vi.fn();
    const pending = deferredFetch();
    renderHarness({
      deps: passThroughDeps({
        fetch: pending.fetchMock as unknown as typeof fetch,
      }),
      onDeadline,
      startChat,
    });

    await act(async () => {
      probe.submit();
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      pending.resolve(
        new Response(JSON.stringify(analyzeResponseFromCapture), {
          status: 200,
        })
      );
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(onDeadline).toHaveBeenCalledTimes(1);
    expect(probe.state.screen).toBe("form");
    expect(probe.state.submissionError).toBe("ANALYSIS_TIMEOUT");
  });

  it("calls the default global fetch unbound (a method call on deps would throw Illegal invocation in browsers)", async () => {
    const startChat = vi.fn();
    const strictFetch = vi.fn(function (this: unknown) {
      if (this !== undefined && this !== globalThis) {
        throw new TypeError(
          "Failed to execute 'fetch' on 'Window': Illegal invocation"
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify(analyzeResponseFromCapture), {
          status: 200,
        })
      );
    });
    vi.stubGlobal("fetch", strictFetch);
    renderHarness({ deps: passThroughDeps(), startChat });

    await act(async () => {
      await probe.submit();
    });

    expect(strictFetch).toHaveBeenCalledTimes(1);
    expect(probe.state.submissionError).toBeNull();
    expect(startChat).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
