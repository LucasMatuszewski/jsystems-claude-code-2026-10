import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { APICallError, type ChatTransport, type UIMessageChunk } from "ai";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ChatView } from "@/components/chat/chat-view";
import { CASE_TYPE_LABELS } from "@/lib/case/constants";
import type { CaseUIMessage } from "@/lib/case/messages";
import { texts } from "@/lib/case/texts";
import { CaseSessionProvider, useCaseSession } from "@/lib/session/context";
import type { CaseSessionAction } from "@/lib/session/reducer";
import type { CaseSessionState } from "@/lib/session/state";
import { useCaseChat } from "@/lib/session/use-case-chat";
import { analyzeResponseFromCapture } from "@/tests/fixtures/derived/analyze-response";
import {
  firstTurnChunks,
  followUpChunks,
} from "@/tests/fixtures/derived/chat-chunks";

// Radix and the conversation scroller need these browser APIs, which jsdom lacks.
beforeEach(() => {
  if (typeof URL.revokeObjectURL !== "function") {
    URL.revokeObjectURL = () => undefined;
  }
  Element.prototype.scrollIntoView = () => undefined;
  globalThis.ResizeObserver = class {
    observe = () => undefined;
    unobserve = () => undefined;
    disconnect = () => undefined;
  };
});

afterEach(cleanup);

// --- captured values ----------------------------------------------------------

const { caseContext, imageAnalysis } = analyzeResponseFromCapture;

const SET_DECISION_INPUT = firstTurnChunks.find(
  (chunk) => chunk.type === "tool-input-available"
) as Extract<UIMessageChunk, { type: "tool-input-available" }>;
const CAPTURED_INPUT = SET_DECISION_INPUT.input as {
  greeting: string;
  label: string;
};
const CAPTURED_LABEL = CAPTURED_INPUT.label;
const CAPTURED_GREETING = CAPTURED_INPUT.greeting.trim();

const FOLLOW_UP_TEXT = "Czy mogę odesłać tylko ekran?";

// --- mock transport (capture-derived chunks, same approach as use-case-chat.test.tsx)

type MockResponse =
  | { chunks: UIMessageChunk[] }
  | { httpError: { statusCode: number; responseBody: string } };

type SendOptions = Parameters<ChatTransport<CaseUIMessage>["sendMessages"]>[0];

function streamOf(
  chunks: UIMessageChunk[],
  signal: AbortSignal | undefined
): ReadableStream<UIMessageChunk> {
  return new ReadableStream<UIMessageChunk>({
    async start(controller) {
      let aborted = false;
      signal?.addEventListener("abort", () => {
        aborted = true;
        controller.error(new DOMException("aborted", "AbortError"));
      });
      for (const chunk of chunks) {
        if (aborted) {
          return;
        }
        controller.enqueue(chunk);
        // biome-ignore lint/performance/noAwaitInLoops: the stream is sequential by design
        await new Promise((r) => setTimeout(r, 1));
      }
      if (!aborted) {
        controller.close();
      }
    },
  });
}

function mockTransport(responses: MockResponse[]) {
  const calls: SendOptions[] = [];
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
      return Promise.resolve(streamOf(next.chunks, options.abortSignal));
    },
  };
  return { calls, transport };
}

// --- harness ------------------------------------------------------------------

type Probe = {
  state: CaseSessionState;
  dispatch: (action: CaseSessionAction) => void;
  chat: ReturnType<typeof useCaseChat>;
};
let probe: Probe;

/** Renders the chat screen only once the session is on the chat, as CaseFlow does. */
function Harness({ transport }: { transport: ChatTransport<CaseUIMessage> }) {
  const { state, dispatch } = useCaseSession();
  const chat = useCaseChat({ transport });
  probe = { chat, dispatch, state };
  return state.screen === "chat" ? <ChatView chat={chat} /> : null;
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

const createTestChatId = () => "chat-view-test";

async function renderChatWith(responses: MockResponse[]) {
  const mock = mockTransport(responses);
  render(
    <CaseSessionProvider createChatId={createTestChatId}>
      <Harness transport={mock.transport} />
    </CaseSessionProvider>
  );
  startFlow();
  await waitFor(() => expect(probe.state.screen).toBe("chat"));
  // The capture streams through useChat (throttled), so allow more than the default 1 s.
  await waitFor(() => expect(probe.chat.status).toBe("ready"), {
    timeout: 5000,
  });
  return mock;
}

async function sendFollowUpWithEnter(text: string) {
  const user = userEvent.setup();
  await user.type(screen.getByRole("textbox"), text);
  await user.keyboard("{Enter}");
}

const errorBody = (code: string) =>
  JSON.stringify({ error: { code, message: "Test" } });

describe("ChatView", () => {
  it("renders the case summary and the decision card with the captured label", async () => {
    await renderChatWith([{ chunks: firstTurnChunks }]);

    expect(
      screen.getByRole("heading", { level: 2, name: texts.summary.heading })
    ).toBeInTheDocument();
    expect(
      screen.getByText(CASE_TYPE_LABELS[caseContext.caseType], { exact: true })
    ).toBeInTheDocument();
    const days = screen.getByText(texts.summary.daysSincePurchase, {
      exact: true,
    }).nextElementSibling;
    expect(days?.textContent).toBe(String(caseContext.daysSincePurchase));

    const card = screen.getByTestId("decision-card");
    expect(card).toHaveAttribute("data-label", CAPTURED_LABEL);
    expect(screen.getByTestId("chat-screen")).toBeInTheDocument();
  });

  it("shows the greeting before the decision card, the disclaimer once and no submission text", async () => {
    await renderChatWith([{ chunks: firstTurnChunks }]);

    const greeting = screen.getByText(CAPTURED_GREETING);
    const card = screen.getByTestId("decision-card");
    expect(
      greeting.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(screen.getAllByTestId("disclaimer")).toHaveLength(1);
    expect(screen.getByRole("textbox")).toBeEnabled();
    expect(document.body.textContent).not.toContain(
      texts.chat.hiddenSubmissionText
    );
  });

  it("marks the summary decision with the same data-label as the card", async () => {
    await renderChatWith([{ chunks: firstTurnChunks }]);

    expect(screen.getByTestId("summary-decision")).toHaveAttribute(
      "data-label",
      CAPTURED_LABEL
    );
    expect(screen.getByTestId("decision-card")).toHaveAttribute(
      "data-label",
      CAPTURED_LABEL
    );
  });

  it("sends a follow-up message with Enter and shows the reply", async () => {
    const mock = await renderChatWith([
      { chunks: firstTurnChunks },
      { chunks: followUpChunks },
    ]);

    await sendFollowUpWithEnter(FOLLOW_UP_TEXT);

    await waitFor(() => expect(mock.calls).toHaveLength(2));
    const sent = mock.calls[1]?.messages.at(-1);
    expect(sent?.role).toBe("user");
    expect(sent?.metadata?.kind).toBe("follow-up");
    expect(screen.getByTestId("user-message")).toHaveTextContent(
      FOLLOW_UP_TEXT
    );
    await waitFor(() =>
      expect(screen.getAllByTestId("assistant-message")).toHaveLength(2)
    );
    await waitFor(() => expect(probe.chat.status).toBe("ready"));
  });

  it("renders the failed marker with retry under the targeted message", async () => {
    await renderChatWith([
      { chunks: firstTurnChunks },
      {
        httpError: {
          responseBody: errorBody("DECISION_FAILED"),
          statusCode: 500,
        },
      },
    ]);

    await sendFollowUpWithEnter(FOLLOW_UP_TEXT);

    const wrapper = await screen.findByTestId("user-message-wrapper");
    expect(
      within(wrapper).getByText(texts.chat.failedMarker)
    ).toBeInTheDocument();
    expect(
      within(wrapper).getByRole("button", { name: texts.chat.retry })
    ).toBeInTheDocument();
  });

  it("renders the too-large marker without retry and disables the input", async () => {
    await renderChatWith([
      { chunks: firstTurnChunks },
      {
        httpError: {
          responseBody: errorBody("REQUEST_TOO_LARGE"),
          statusCode: 413,
        },
      },
    ]);

    await sendFollowUpWithEnter(FOLLOW_UP_TEXT);

    const wrapper = await screen.findByTestId("user-message-wrapper");
    expect(
      within(wrapper).getByText(texts.errors.REQUEST_TOO_LARGE)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: texts.chat.retry })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
