import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CaseFlow } from "@/components/case-flow";
import { texts } from "@/lib/case/texts";

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
});

afterEach(cleanup);

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
});
