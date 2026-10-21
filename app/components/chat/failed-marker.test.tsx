import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FailedMarker } from "@/components/chat/failed-marker";
import { texts } from "@/lib/case/texts";

afterEach(cleanup);

describe("FailedMarker", () => {
  it("renders the failed marker text with an alert role and retry", async () => {
    const onRetry = vi.fn();
    render(<FailedMarker kind="failed" onRetry={onRetry} />);
    expect(screen.getByText(texts.chat.failedMarker)).toBeInTheDocument();
    expect(screen.getByText(texts.chat.followUpFailed)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: texts.chat.retry }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders the interrupted text with retry calling onRetry", async () => {
    const onRetry = vi.fn();
    render(<FailedMarker kind="interrupted" onRetry={onRetry} />);
    expect(screen.getByText(texts.chat.interrupted)).toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: texts.chat.retry }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders the stopped text with retry and no alert role", async () => {
    const onRetry = vi.fn();
    render(<FailedMarker kind="stopped" onRetry={onRetry} />);
    expect(screen.getByText(texts.chat.interrupted)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: texts.chat.retry }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders the too-large text without a retry button", () => {
    render(<FailedMarker kind="too-large" />);
    expect(
      screen.getByText(texts.errors.REQUEST_TOO_LARGE)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: texts.chat.retry })
    ).not.toBeInTheDocument();
  });
});
