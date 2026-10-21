import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NewCaseDialog } from "@/components/chat/new-case-dialog";
import { texts } from "@/lib/case/texts";

afterEach(cleanup);

describe("NewCaseDialog", () => {
  it("opens the confirmation with title and description", async () => {
    const user = userEvent.setup();
    render(<NewCaseDialog onConfirm={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: texts.chat.newCase }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Rozpocząć nowe zgłoszenie?")).toBeInTheDocument();
    expect(
      screen.getByText("Obecna rozmowa zostanie utracona.")
    ).toBeInTheDocument();
  });

  it("closes on cancel without calling onConfirm", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<NewCaseDialog onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: texts.chat.newCase }));
    await user.click(
      screen.getByRole("button", { name: texts.newCaseDialog.cancel })
    );
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("calls onConfirm once on confirm", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<NewCaseDialog onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: texts.chat.newCase }));
    await user.click(
      screen.getByRole("button", { name: texts.newCaseDialog.confirm })
    );
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
