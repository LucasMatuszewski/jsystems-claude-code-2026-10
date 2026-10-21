import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { APICallError, type ChatTransport, type UIMessageChunk } from "ai";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CaseUIMessage } from "@/lib/case/messages";
import { texts } from "@/lib/case/texts";
import { CaseSessionProvider, useCaseSession } from "@/lib/session/context";
import type { CaseSessionAction } from "@/lib/session/reducer";
import type { CaseSessionState } from "@/lib/session/state";
import { useCaseChat } from "@/lib/session/use-case-chat";
import { FOLLOW_UP_DEADLINE_MS } from "@/lib/session/watchdog";
import {
  chunksUntil,
  FIRST_TURN_CAPTURE,
  firstTurnChunks,
  followUpChunks,
  withErrorAfter,
} from "@/tests/fixtures/derived/chat-chunks";

type CaptureRequest = {
  request: { body: Parameters<ReturnType<typeof useCaseChat>["startChat"]>[0] };
};
const { caseContext, imageAnalysis } = (
  JSON.parse(
    readFileSync(resolve(process.cwd(), FIRST_TURN_CAPTURE), "utf8")
  ) as CaptureRequest
).request.body;

// --- mock transport ---------------------------------------------------------

type MockResponse =
  | {
      chunks: UIMessageChunk[];
      /** Chunk index before which the stream waits for `gate`. */
      gateIndex?: number;
      gate?: Promise<void>;
      /** After the last chunk the stream stays open until aborted. */
      hang?: boolean;
    }
  | { httpError: { statusCode: number; responseBody: string } };

function abortError(): DOMException {
  return new DOMException("aborted", "AbortError");
}

function streamOf(
  response: Extract<MockResponse, { chunks: UIMessageChunk[] }>,
  signal: AbortSignal | undefined
): ReadableStream<UIMessageChunk> {
  return new ReadableStream<UIMessageChunk>({
    async start(controller) {
      let aborted = false;
      signal?.addEventListener("abort", () => {
        aborted = true;
        controller.error(abortError());
      });
      for (const [index, chunk] of response.chunks.entries()) {
        if (index === response.gateIndex) {
          // biome-ignore lint/performance/noAwaitInLoops: the stream is sequential by design
          await response.gate;
        }
        if (aborted) {
          return;
        }
        controller.enqueue(chunk);
        await new Promise((r) => setTimeout(r, 1));
      }
      if (!(response.hang || aborted)) {
        controller.close();
      }
    },
  });
}

function mockTransport(responses: MockResponse[]) {
  const calls: unknown[] = [];
  const queue = [...responses];
  const transport: ChatTransport<CaseUIMessage> = {
    reconnectToStream: () => Promise.resolve(null),
    sendMessages: (options) => {
      calls.push(options);
      const next = queue.shift();
      if (next === undefined) {
        return Promise.reject(new Error("mockTransport: no response queued"));
      }
      if ("httpError" in next) {
        return Promise.reject(
          new APICallError({
            message: "Request failed",
            requestBodyValues: {},
            responseBody: next.httpError.responseBody,
            statusCode: next.httpError.statusCode,
            url: "/api/chat",
          })
        );
      }
      return Promise.resolve(streamOf(next, options.abortSignal));
    },
  };
  return { calls, transport };
}

function deferred() {
  let resolveFn: () => void = () => undefined;
  const promise = new Promise<void>((r) => {
    resolveFn = r;
  });
  return { promise, release: () => resolveFn() };
}

// --- harness ----------------------------------------------------------------

type Probe = {
  state: CaseSessionState;
  dispatch: (action: CaseSessionAction) => void;
  chat: ReturnType<typeof useCaseChat>;
};
let probe: Probe;

function Harness({ transport }: { transport: ChatTransport<CaseUIMessage> }) {
  const { state, dispatch } = useCaseSession();
  const chat = useCaseChat({ transport });
  probe = { chat, dispatch, state };
  return null;
}

let chatCounter = 0;
function createChatId(): string {
  chatCounter += 1;
  return `chat-${chatCounter}`;
}

function renderChat(transport: ChatTransport<CaseUIMessage>) {
  render(
    <CaseSessionProvider createChatId={createChatId}>
      <Harness transport={transport} />
    </CaseSessionProvider>
  );
}

/** Drives the session to processing/deciding (as useSubmission would) and starts the chat. */
function startFlow() {
  act(() => {
    probe.dispatch({ type: "SUBMIT_STARTED" });
    probe.dispatch({
      caseContext,
      imageAnalysis,
      reducedPhoto: { blob: new Blob(["x"]), url: "blob:reduced" },
      type: "ANALYSIS_SUCCEEDED",
    });
  });
  act(() => {
    probe.chat.startChat({ caseContext, imageAnalysis });
  });
}

const indexOfType = (type: string) =>
  firstTurnChunks.findIndex((c) => c.type === type);
const OUTPUT_INDEX = indexOfType("tool-output-available");
const INPUT_AVAILABLE = firstTurnChunks.find(
  (c) => c.type === "tool-input-available"
) as Extract<UIMessageChunk, { type: "tool-input-available" }>;
const CAPTURED_LABEL = (INPUT_AVAILABLE.input as { label: string }).label;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function completeFirstTurn(
  extra: MockResponse[] = []
): Promise<ReturnType<typeof mockTransport>> {
  const mock = mockTransport([{ chunks: firstTurnChunks }, ...extra]);
  renderChat(mock.transport);
  startFlow();
  await waitFor(() => expect(probe.state.screen).toBe("chat"));
  await waitFor(() => expect(probe.chat.status).toBe("ready"));
  return mock;
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useCaseChat", () => {
  it("1. switches to the chat exactly when the first tool part arrives and derives the label", async () => {
    const gate = deferred();
    const toolStart = indexOfType("tool-input-start");
    const mock = mockTransport([
      { chunks: firstTurnChunks, gate: gate.promise, gateIndex: toolStart },
    ]);
    renderChat(mock.transport);
    startFlow();

    // start + start-step only: still processing (step-start never counts).
    await act(async () => {
      await sleep(200);
    });
    expect(probe.state.screen).toBe("processing");
    expect(probe.chat.messages[0]?.metadata?.kind).toBe("case-submission");
    expect(probe.chat.messages[0]?.parts).toEqual([
      { text: texts.chat.hiddenSubmissionText, type: "text" },
    ]);

    gate.release();
    await waitFor(() => expect(probe.state.screen).toBe("chat"));
    await waitFor(() => expect(probe.chat.status).toBe("ready"));
    expect(probe.chat.currentLabel).toBe(CAPTURED_LABEL);
    expect(mock.calls).toHaveLength(1);
  });

  it("2. goes back to the form when the stream only sends start + start-step and then errors", async () => {
    const gate = deferred();
    // Controlled variation of the real first-turn capture: first 2 chunks + error chunk.
    const mock = mockTransport([
      {
        chunks: withErrorAfter(firstTurnChunks, 2, "DECISION_FAILED"),
        gate: gate.promise,
        gateIndex: 2,
      },
    ]);
    renderChat(mock.transport);
    startFlow();
    await act(async () => {
      await sleep(150);
    });
    expect(probe.state.screen).toBe("processing");

    gate.release();
    await waitFor(() => expect(probe.state.screen).toBe("form"));
    expect(probe.state.submissionError).toBe("DECISION_FAILED");
    expect(probe.chat.messages).toEqual([]);
    expect(probe.chat.marker).toBeNull();
  });

  it("3. goes back to the form when the error comes before a recorded decision", async () => {
    // Controlled variation: real chunks up to (excluding) tool-output-available + error chunk.
    const cut = chunksUntil(
      firstTurnChunks,
      (c) => c.type === "tool-output-available"
    );
    const mock = mockTransport([
      { chunks: withErrorAfter(cut, cut.length, "DECISION_TIMEOUT") },
    ]);
    renderChat(mock.transport);
    startFlow();
    await waitFor(() => expect(probe.state.screen).toBe("form"));
    expect(probe.state.submissionError).toBe("DECISION_TIMEOUT");
    expect(probe.chat.messages).toEqual([]);
  });

  it("4. keeps a recorded first message on error, marks it interrupted and retries via regenerate", async () => {
    // Controlled variation: real chunks through tool-output-available + error chunk.
    const mock = mockTransport([
      {
        chunks: withErrorAfter(
          firstTurnChunks,
          OUTPUT_INDEX + 1,
          "DECISION_FAILED"
        ),
      },
      { chunks: firstTurnChunks },
    ]);
    renderChat(mock.transport);
    startFlow();
    await waitFor(() => expect(probe.chat.marker?.kind).toBe("interrupted"));
    expect(probe.state.screen).toBe("chat");
    const firstAssistant = probe.chat.messages.find(
      (m) => m.role === "assistant"
    );
    expect(probe.chat.marker?.messageId).toBe(firstAssistant?.id);
    const countBefore = probe.chat.messages.length;
    expect(probe.chat.currentLabel).toBe(CAPTURED_LABEL);

    act(() => {
      probe.chat.retry();
    });
    expect(probe.chat.marker).toBeNull();
    await waitFor(() => expect(mock.calls).toHaveLength(2));
    await waitFor(() => expect(probe.chat.status).toBe("ready"));
    expect(probe.chat.messages).toHaveLength(countBefore);
    expect(probe.chat.marker).toBeNull();
    expect(probe.state.screen).toBe("chat");
  });

  it("stopping the first message after a recorded decision keeps it with a stopped marker", async () => {
    // Controlled variation: real chunks through tool-output-available, then the stream stays open.
    const mock = mockTransport([
      { chunks: firstTurnChunks.slice(0, OUTPUT_INDEX + 1), hang: true },
    ]);
    renderChat(mock.transport);
    startFlow();
    await waitFor(() => expect(probe.chat.currentLabel).toBe(CAPTURED_LABEL));
    expect(probe.state.screen).toBe("chat");

    act(() => {
      probe.chat.stop();
    });
    await waitFor(() => expect(probe.chat.marker?.kind).toBe("stopped"));
    expect(probe.chat.status).toBe("ready");
    expect(probe.state.screen).toBe("chat");
  });

  it("5. marks a silent follow-up as failed after 60 s and retries without duplicating the user message", async () => {
    // Follow-up stream that never sends content: only start + start-step, then hangs.
    const mock = await completeFirstTurn([
      { chunks: followUpChunks.slice(0, 2), hang: true },
      { chunks: followUpChunks },
    ]);
    vi.useFakeTimers({ shouldAdvanceTime: true });

    act(() => {
      probe.chat.sendFollowUp("Czy mogę zwrócić telefon?");
    });
    await waitFor(() => expect(mock.calls).toHaveLength(2));
    const lastUser = [...probe.chat.messages]
      .reverse()
      .find((m) => m.role === "user");
    expect(lastUser?.metadata?.kind).toBe("follow-up");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(FOLLOW_UP_DEADLINE_MS + 100);
    });
    expect(probe.chat.marker).toEqual({
      kind: "failed",
      messageId: lastUser?.id,
    });
    expect(probe.chat.inputDisabled).toBe(false);

    act(() => {
      probe.chat.retry();
    });
    expect(probe.chat.marker).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(mock.calls).toHaveLength(3);
    expect(probe.chat.status).toBe("ready");
    const users = probe.chat.messages.filter((m) => m.role === "user");
    expect(users).toHaveLength(2);
    const last = probe.chat.messages.at(-1);
    expect(last?.role).toBe("assistant");
    expect(probe.chat.marker).toBeNull();
  });

  it("does not time out a follow-up that starts streaming content", async () => {
    const mock = await completeFirstTurn([{ chunks: followUpChunks }]);
    vi.useFakeTimers({ shouldAdvanceTime: true });
    act(() => {
      probe.chat.sendFollowUp("Dziękuję");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(mock.calls).toHaveLength(2);
    expect(probe.chat.status).toBe("ready");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(FOLLOW_UP_DEADLINE_MS + 100);
    });
    expect(probe.chat.marker).toBeNull();
  });

  it("stop during a follow-up keeps the partial reply and sets no marker", async () => {
    // Controlled variation: first 12 real follow-up chunks, then the stream stays open.
    const mock = await completeFirstTurn([
      { chunks: followUpChunks.slice(0, 12), hang: true },
    ]);
    act(() => {
      probe.chat.sendFollowUp("Dziękuję");
    });
    await waitFor(() => expect(mock.calls).toHaveLength(2));
    await waitFor(() =>
      expect(probe.chat.messages.at(-1)?.role).toBe("assistant")
    );
    act(() => {
      probe.chat.stop();
    });
    await waitFor(() => expect(probe.chat.status).toBe("ready"));
    expect(probe.chat.marker).toBeNull();
    expect(probe.chat.messages.at(-1)?.role).toBe("assistant");
  });

  it("6. HTTP 413 REQUEST_TOO_LARGE on a follow-up disables the input and ignores further sends", async () => {
    const mock = await completeFirstTurn([
      {
        httpError: {
          responseBody: JSON.stringify({
            error: { code: "REQUEST_TOO_LARGE", message: "Za duże" },
          }),
          statusCode: 413,
        },
      },
    ]);
    act(() => {
      probe.chat.sendFollowUp("Bardzo długa wiadomość");
    });
    await waitFor(() => expect(probe.chat.marker?.kind).toBe("too-large"));
    expect(probe.chat.inputDisabled).toBe(true);
    const lastUser = [...probe.chat.messages]
      .reverse()
      .find((m) => m.role === "user");
    expect(probe.chat.marker?.messageId).toBe(lastUser?.id);

    act(() => {
      probe.chat.sendFollowUp("Jeszcze raz");
    });
    await act(async () => {
      await sleep(50);
    });
    expect(mock.calls).toHaveLength(2);
  });

  it("a failed follow-up (network error) gets a failed marker", async () => {
    const mock = await completeFirstTurn([
      { chunks: withErrorAfter(followUpChunks, 5, "DECISION_FAILED") },
    ]);
    act(() => {
      probe.chat.sendFollowUp("Dziękuję");
    });
    await waitFor(() => expect(probe.chat.marker?.kind).toBe("failed"));
    expect(mock.calls).toHaveLength(2);
    expect(probe.chat.inputDisabled).toBe(false);
  });

  it("7. confirmNewCase resets to a fresh form with a new chat id and no messages", async () => {
    await completeFirstTurn();
    const oldId = probe.state.chatId;
    act(() => {
      probe.chat.confirmNewCase();
    });
    await waitFor(() => expect(probe.state.screen).toBe("form"));
    expect(probe.state.chatId).not.toBe(oldId);
    expect(probe.chat.messages).toEqual([]);
    expect(probe.chat.marker).toBeNull();
  });

  it("abortFirstTurn cancels the stream and clears the messages", async () => {
    const mock = mockTransport([
      { chunks: firstTurnChunks.slice(0, 2), hang: true },
    ]);
    renderChat(mock.transport);
    startFlow();
    await waitFor(() => expect(probe.chat.messages.length).toBeGreaterThan(0));
    act(() => {
      probe.chat.abortFirstTurn();
    });
    await waitFor(() => expect(probe.chat.status).toBe("ready"));
    expect(probe.chat.messages).toEqual([]);
  });
});
