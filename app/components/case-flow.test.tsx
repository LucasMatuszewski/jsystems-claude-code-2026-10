import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The seeded chat state is injected on mount through the real session actions.
const seed = vi.hoisted(() => ({ chat: false }));

vi.mock("@/lib/session/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/session/context")>();
  const { useEffect } = await import("react");
  const { analyzeResponseFromCapture } = await import(
    "@/tests/fixtures/derived/analyze-response"
  );

  function SeedChat(): null {
    const { dispatch } = actual.useCaseSession();
    useEffect(() => {
      dispatch({ type: "SUBMIT_STARTED" });
      dispatch({
        caseContext: analyzeResponseFromCapture.caseContext,
        imageAnalysis: analyzeResponseFromCapture.imageAnalysis,
        reducedPhoto: { blob: new Blob(["x"]), url: "blob:reduced" },
        type: "ANALYSIS_SUCCEEDED",
      });
      dispatch({ type: "FIRST_CHUNK_RECEIVED" });
    }, [dispatch]);
    return null;
  }

  function CaseSessionProvider({
    children,
    createChatId,
  }: {
    children: React.ReactNode;
    createChatId?: () => string;
  }): React.JSX.Element {
    return (
      <actual.CaseSessionProvider createChatId={createChatId}>
        {seed.chat ? <SeedChat /> : null}
        {children}
      </actual.CaseSessionProvider>
    );
  }

  return { ...actual, CaseSessionProvider };
});

// Imported after the mock so CaseFlow uses the seeded provider.
const { CaseFlow } = await import("@/components/case-flow");
const { texts } = await import("@/lib/case/texts");

// Radix UI primitives used by the form need these browser APIs, which jsdom lacks.
beforeEach(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => undefined;
  Element.prototype.scrollIntoView = () => undefined;
  globalThis.ResizeObserver = class {
    observe = () => undefined;
    unobserve = () => undefined;
    disconnect = () => undefined;
  };
  if (typeof URL.revokeObjectURL !== "function") {
    URL.revokeObjectURL = () => undefined;
  }
  seed.chat = false;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CaseFlow", () => {
  it("renders the app header", () => {
    render(<CaseFlow />);
    expect(
      screen.getByRole("heading", { name: "Asystent zwrotów i reklamacji" })
    ).toBeInTheDocument();
  });

  it("shows the case form initially and no chat placeholder", () => {
    render(<CaseFlow />);
    const form = screen.getByTestId("form-screen");
    expect(form).toHaveAttribute("data-screen", "form");
    expect(screen.getByText(texts.form.caseType.label)).toBeInTheDocument();
    expect(screen.queryByTestId("chat-screen")).not.toBeInTheDocument();
  });

  it("shows the new-case button in the header on the chat screen", async () => {
    seed.chat = true;
    render(<CaseFlow />);
    expect(
      await screen.findByRole("button", { name: texts.chat.newCase })
    ).toBeInTheDocument();
    expect(screen.getByTestId("chat-screen")).toBeInTheDocument();
  });

  it("returns to an empty form after confirming the new case", async () => {
    seed.chat = true;
    const user = userEvent.setup();
    render(<CaseFlow />);

    await user.click(
      await screen.findByRole("button", { name: texts.chat.newCase })
    );
    await user.click(
      await screen.findByRole("button", { name: texts.newCaseDialog.confirm })
    );

    await waitFor(() =>
      expect(screen.getByTestId("form-screen")).toHaveAttribute(
        "data-screen",
        "form"
      )
    );
    expect(screen.queryByTestId("chat-screen")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: texts.chat.newCase })
    ).not.toBeInTheDocument();
  });

  it("has no new-case button on the form screen", () => {
    render(<CaseFlow />);
    expect(
      screen.queryByRole("button", { name: texts.chat.newCase })
    ).not.toBeInTheDocument();
  });

  it("registers no beforeunload guard on the form screen", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    render(<CaseFlow />);
    expect(
      addSpy.mock.calls.filter(([type]) => type === "beforeunload")
    ).toHaveLength(0);
  });

  it("registers a beforeunload guard on the chat screen", async () => {
    seed.chat = true;
    const addSpy = vi.spyOn(window, "addEventListener");
    render(<CaseFlow />);
    await screen.findByTestId("chat-screen");
    expect(addSpy.mock.calls.some(([type]) => type === "beforeunload")).toBe(
      true
    );
  });
});
