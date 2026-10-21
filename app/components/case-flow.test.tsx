import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CaseFlow } from "@/components/case-flow";

afterEach(cleanup);

describe("CaseFlow", () => {
  it("renders the app header", () => {
    render(<CaseFlow />);
    expect(
      screen.getByRole("heading", { name: "Asystent zwrotów i reklamacji" })
    ).toBeInTheDocument();
  });

  it("shows the form placeholder initially and no chat placeholder", () => {
    render(<CaseFlow />);
    const form = screen.getByTestId("form-screen");
    expect(form).toHaveAttribute("data-screen", "form");
    expect(screen.queryByTestId("chat-screen")).not.toBeInTheDocument();
  });
});
