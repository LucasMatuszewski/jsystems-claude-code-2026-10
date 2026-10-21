import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppHeader } from "./app-header";

describe("AppHeader", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the x-kom logo image pointing to /logo.svg", () => {
    render(<AppHeader />);

    const logo = screen.getByRole("img", { name: "x-kom" });
    expect(logo).toHaveAttribute("src", "/logo.svg");
  });

  it("renders the product name as a level 1 heading", () => {
    render(<AppHeader />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/^Asystent zwrotów i reklamacji$/);
  });

  it("renders the actions node when provided", () => {
    render(<AppHeader actions={<button type="button">X</button>} />);

    expect(screen.getByRole("button", { name: "X" })).toBeInTheDocument();
  });

  it("renders no extra actions when none are provided", () => {
    render(<AppHeader />);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("does not place the logo inside a link", () => {
    render(<AppHeader />);

    expect(screen.queryByRole("link")).toBeNull();
  });
});
