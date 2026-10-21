import { cleanup, render, screen, within } from "@testing-library/react";
import type { ChatStatus } from "ai";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MessageList } from "@/components/chat/message-list";
import type { CaseUIMessage } from "@/lib/case/messages";
import { texts } from "@/lib/case/texts";
import {
  firstTurnMessages,
  followUpMessages,
} from "@/tests/fixtures/messages/from-capture";

beforeEach(() => {
  globalThis.ResizeObserver = class {
    observe = () => undefined;
    unobserve = () => undefined;
    disconnect = () => undefined;
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollTo = () => undefined;
  window.matchMedia = ((query: string) => ({
    addEventListener: () => undefined,
    addListener: () => undefined,
    dispatchEvent: () => false,
    matches: false,
    media: query,
    onchange: null,
    removeEventListener: () => undefined,
    removeListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
});

afterEach(cleanup);

function renderList(
  messages: CaseUIMessage[],
  status: ChatStatus,
  markers?: Record<string, ReactNode>
) {
  return render(
    <MessageList markers={markers} messages={messages} status={status} />
  );
}

describe("MessageList (first turn)", () => {
  it("does not render the hidden case-submission text", () => {
    const { container } = renderList(firstTurnMessages, "ready");
    expect(
      screen.queryByText(texts.chat.hiddenSubmissionText)
    ).not.toBeInTheDocument();
    expect(container.textContent).not.toContain(
      texts.chat.hiddenSubmissionText
    );
  });

  it("renders the assistant message and its decision card", () => {
    renderList(firstTurnMessages, "ready");
    expect(screen.getByTestId("assistant-message")).toBeInTheDocument();
    expect(screen.queryByTestId("user-message")).toBeNull();
    expect(screen.getAllByTestId("decision-card")).toHaveLength(1);
  });

  it("exposes the conversation as a log region", () => {
    renderList(firstTurnMessages, "ready");
    expect(screen.getByRole("log")).toBeInTheDocument();
  });

  it("renders the disclaimer once when the first assistant message is complete", () => {
    renderList(firstTurnMessages, "ready");
    expect(screen.getAllByTestId("disclaimer")).toHaveLength(1);
  });

  it("does not render the disclaimer while the status is streaming", () => {
    renderList(firstTurnMessages, "streaming");
    expect(screen.queryByTestId("disclaimer")).toBeNull();
  });

  it("shows the typing indicator when submitted and the last message is a user message", () => {
    renderList(firstTurnMessages.slice(0, 1), "submitted");
    expect(screen.getByTestId("typing-indicator")).toHaveTextContent(
      texts.chat.typing
    );
  });

  it("hides the typing indicator when ready", () => {
    renderList(firstTurnMessages, "ready");
    expect(screen.queryByTestId("typing-indicator")).toBeNull();
  });

  it("hides the typing indicator when submitted but the last message is from the assistant", () => {
    renderList(firstTurnMessages, "submitted");
    expect(screen.queryByTestId("typing-indicator")).toBeNull();
  });
});

describe("MessageList (follow-up)", () => {
  it("renders the user follow-up as a plain user bubble", () => {
    renderList(followUpMessages, "ready");
    expect(screen.getAllByTestId("user-message")).toHaveLength(1);
    expect(screen.getByTestId("user-message")).toHaveTextContent(
      "Opakowanie jest kompletne i nieotwarte, folie i plomby są nienaruszone."
    );
  });

  it("renders no second decision card, because the captured follow-up records no change", () => {
    // Capture C-05 contains no set_decision part in its reply, so only the
    // first-turn card exists after the follow-up.
    renderList(followUpMessages, "ready");
    expect(screen.getAllByTestId("decision-card")).toHaveLength(1);
    expect(screen.getAllByTestId("assistant-message")).toHaveLength(2);
  });

  it("does not render a second disclaimer for the later assistant message", () => {
    renderList(followUpMessages, "ready");
    expect(screen.getAllByTestId("disclaimer")).toHaveLength(1);
  });

  it("shows the typing indicator after the follow-up is submitted", () => {
    renderList(followUpMessages.slice(0, -1), "submitted");
    expect(screen.getAllByTestId("typing-indicator")).toHaveLength(1);
  });
});

describe("MessageList markers", () => {
  it("renders a marker under the targeted message only", () => {
    renderList(followUpMessages, "ready", {
      "m-follow-1": <span>znacznik-uzytkownika</span>,
    });
    const userBubble = screen.getByTestId("user-message");
    expect(
      within(userBubble.parentElement as HTMLElement).getByText(
        "znacznik-uzytkownika"
      )
    ).toBeInTheDocument();
    expect(screen.getAllByText("znacznik-uzytkownika")).toHaveLength(1);
  });
});
