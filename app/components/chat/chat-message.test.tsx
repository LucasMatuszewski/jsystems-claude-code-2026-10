import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ChatMessage } from "@/components/chat/chat-message";
import type { CaseUIMessage } from "@/lib/case/messages";
import { texts } from "@/lib/case/texts";
import {
  asStreaming,
  firstTurnMessages,
  followUpMessages,
} from "@/tests/fixtures/messages/from-capture";

beforeEach(() => {
  globalThis.ResizeObserver = class {
    observe = () => undefined;
    unobserve = () => undefined;
    disconnect = () => undefined;
  } as unknown as typeof ResizeObserver;
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

const capturedFirstAssistant = firstTurnMessages[1] as CaseUIMessage;
const capturedFollowUpUser = followUpMessages.at(-2) as CaseUIMessage;
const CAPTURED_GREETING =
  "Dziękuję za zgłoszenie — sprawdziłem widoczne informacje o telefonie.";

describe("ChatMessage (assistant, captured first turn)", () => {
  it("renders the greeting before the decision card and the card before the Uzasadnienie heading", () => {
    render(
      <ChatMessage
        isFirstAssistant
        isStreaming={false}
        message={capturedFirstAssistant}
      />
    );

    const greeting = screen.getByText(CAPTURED_GREETING);
    const card = screen.getByTestId("decision-card");
    const heading = screen.getByRole("heading", { name: "Uzasadnienie" });

    expect(
      greeting.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      card.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("renders the assistant label and the assistant-message test id", () => {
    render(
      <ChatMessage
        isFirstAssistant
        isStreaming={false}
        message={capturedFirstAssistant}
      />
    );
    const root = screen.getByTestId("assistant-message");
    expect(
      within(root).getByText(texts.chat.assistantLabel)
    ).toBeInTheDocument();
  });

  it("renders the disclaimer exactly once with the exact text", () => {
    render(
      <ChatMessage
        isFirstAssistant
        isStreaming={false}
        message={capturedFirstAssistant}
      />
    );
    const disclaimers = screen.getAllByTestId("disclaimer");
    expect(disclaimers).toHaveLength(1);
    expect(disclaimers[0]).toHaveTextContent(texts.decision.disclaimer);
    expect(disclaimers[0]?.textContent).toBe(texts.decision.disclaimer);
  });

  it("does not render the disclaimer while streaming", () => {
    render(
      <ChatMessage
        isFirstAssistant
        isStreaming
        message={capturedFirstAssistant}
      />
    );
    expect(screen.queryByTestId("disclaimer")).toBeNull();
  });

  it("does not render the disclaimer for a later assistant message", () => {
    render(
      <ChatMessage
        isFirstAssistant={false}
        isStreaming={false}
        message={capturedFirstAssistant}
      />
    );
    expect(screen.queryByTestId("disclaimer")).toBeNull();
  });

  it("renders the streaming skeleton for an input-streaming decision part", () => {
    render(
      <ChatMessage
        isFirstAssistant
        isStreaming
        message={asStreaming(capturedFirstAssistant)}
      />
    );
    expect(screen.getByText(texts.decision.pending)).toBeInTheDocument();
    expect(screen.queryByTestId("decision-card")).toBeNull();
    expect(screen.queryByTestId("disclaimer")).toBeNull();
  });

  it("renders Markdown headings and ordered lists in assistant text", () => {
    const { container } = render(
      <ChatMessage
        isFirstAssistant={false}
        isStreaming={false}
        message={capturedFirstAssistant}
      />
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Uzasadnienie" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Co dalej" })
    ).toBeInTheDocument();
    expect(container.querySelector("ol")).not.toBeNull();
  });

  it("does not render Markdown images or links from assistant text", () => {
    const withLinks: CaseUIMessage = {
      ...capturedFirstAssistant,
      parts: capturedFirstAssistant.parts.map((part) =>
        part.type === "text"
          ? {
              ...part,
              text: "Zobacz [regulamin](https://example.com/regulamin) i ![zdjecie](https://example.com/a.png).",
            }
          : part
      ),
    };
    const { container } = render(
      <ChatMessage
        isFirstAssistant={false}
        isStreaming={false}
        message={withLinks}
      />
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    expect(screen.getByText(/regulamin/)).toBeInTheDocument();
  });
});

describe("ChatMessage (user)", () => {
  it("renders the user text as plain text without Markdown", () => {
    const plain: CaseUIMessage = {
      ...capturedFollowUpUser,
      parts: [{ text: "**bold** _x_", type: "text" }],
    };
    render(
      <ChatMessage
        isFirstAssistant={false}
        isStreaming={false}
        message={plain}
      />
    );
    const bubble = screen.getByTestId("user-message");
    expect(bubble.textContent).toBe("**bold** _x_");
    expect(bubble.querySelector("strong")).toBeNull();
    expect(bubble.querySelector("em")).toBeNull();
  });

  it("renders the captured follow-up text", () => {
    render(
      <ChatMessage
        isFirstAssistant={false}
        isStreaming={false}
        message={capturedFollowUpUser}
      />
    );
    expect(screen.getByTestId("user-message")).toHaveTextContent(
      "Opakowanie jest kompletne i nieotwarte, folie i plomby są nienaruszone."
    );
  });
});

describe("ChatMessage markers", () => {
  it("renders the marker under the bubble", () => {
    render(
      <ChatMessage
        isFirstAssistant={false}
        isStreaming={false}
        marker={<span>znacznik</span>}
        message={capturedFollowUpUser}
      />
    );
    expect(screen.getByText("znacznik")).toBeInTheDocument();
  });
});
