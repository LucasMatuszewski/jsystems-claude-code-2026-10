import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { texts } from "@/lib/case/texts";
import { ProcessingSteps } from "./processing-steps";

afterEach(cleanup);

describe("ProcessingSteps", () => {
  it("lists both processing steps in order", () => {
    render(<ProcessingSteps step="analyzing" />);
    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent(texts.processing.analyzing);
    expect(items[1]).toHaveTextContent(texts.processing.deciding);
  });

  it("marks the analyzing step as current while analyzing", () => {
    render(<ProcessingSteps step="analyzing" />);
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items[0]).toHaveAttribute("aria-current", "step");
    expect(items[1]).not.toHaveAttribute("aria-current");
  });

  it("marks the deciding step as current while deciding", () => {
    render(<ProcessingSteps step="deciding" />);
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items[0]).not.toHaveAttribute("aria-current");
    expect(items[1]).toHaveAttribute("aria-current", "step");
  });

  it("is an aria-live polite region", () => {
    render(<ProcessingSteps step="analyzing" />);
    expect(screen.getByRole("list")).toHaveAttribute("aria-live", "polite");
  });
});
