import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { texts } from "@/lib/case/texts";
import { ErrorBanner } from "./error-banner";

afterEach(cleanup);

describe("ErrorBanner", () => {
  it("shows the AC-22 message in an alert", () => {
    render(<ErrorBanner onDismiss={vi.fn()} onRetry={vi.fn()} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(
      "Nie udało się przeanalizować zgłoszenia. Spróbuj ponownie."
    );
    expect(texts.submission.failed).toBe(
      "Nie udało się przeanalizować zgłoszenia. Spróbuj ponownie."
    );
  });

  it("calls onRetry from the retry button", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorBanner onDismiss={vi.fn()} onRetry={onRetry} />);
    await user.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("calls onDismiss from the dismiss icon button", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<ErrorBanner onDismiss={onDismiss} onRetry={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Zamknij" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
