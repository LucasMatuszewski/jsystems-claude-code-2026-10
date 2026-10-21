import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatInput } from "@/components/chat/chat-input";
import { CHAT_MESSAGE_MAX } from "@/lib/case/constants";
import { texts } from "@/lib/case/texts";

afterEach(cleanup);

function setup(props: Partial<Parameters<typeof ChatInput>[0]> = {}) {
  const onSend = vi.fn();
  const onStop = vi.fn();
  const utils = render(
    <ChatInput onSend={onSend} onStop={onStop} status="ready" {...props} />
  );
  const textarea = screen.getByLabelText(
    texts.chat.inputLabel
  ) as HTMLTextAreaElement;
  return { ...utils, onSend, onStop, textarea, user: userEvent.setup() };
}

describe("ChatInput", () => {
  it("renders the labelled textarea with placeholder and maxLength", () => {
    const { textarea } = setup();
    expect(textarea).toHaveAttribute(
      "placeholder",
      texts.chat.inputPlaceholder
    );
    expect(textarea).toHaveAttribute("maxLength", String(CHAT_MESSAGE_MAX));
    expect(textarea).toHaveAttribute("maxLength", "2000");
  });

  it("disables the send button for empty and whitespace-only input", async () => {
    const { user, textarea, onSend } = setup();
    const button = screen.getByRole("button", { name: texts.chat.send });
    expect(button).toBeDisabled();
    await user.type(textarea, "   ");
    expect(button).toBeDisabled();
    await user.keyboard("{Enter}");
    expect(onSend).not.toHaveBeenCalled();
  });

  it("sends trimmed text on Enter once and clears the textarea", async () => {
    const { user, textarea, onSend } = setup();
    await user.type(textarea, "Cześć");
    await user.keyboard("{Enter}");
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith("Cześć");
    expect(textarea).toHaveValue("");
  });

  it("inserts a newline on Shift+Enter without sending", async () => {
    const { user, textarea, onSend } = setup();
    await user.type(textarea, "Linia");
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    expect(onSend).not.toHaveBeenCalled();
    expect(textarea.value).toContain("\n");
  });

  it("shows the stop button while streaming and calls onStop on click", async () => {
    const { user, onStop, onSend } = setup({ status: "streaming" });
    const stop = screen.getByRole("button", { name: texts.chat.stop });
    expect(stop).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: texts.chat.send })
    ).not.toBeInTheDocument();
    await user.click(stop);
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onSend).not.toHaveBeenCalled();
  });

  it("does not send on Enter while streaming and keeps the textarea editable", async () => {
    const { user, textarea, onSend } = setup({ status: "streaming" });
    await user.type(textarea, "Pytanie");
    await user.keyboard("{Enter}");
    expect(onSend).not.toHaveBeenCalled();
    expect(textarea).toBeEnabled();
    await user.type(textarea, " dalej");
    expect(textarea).toHaveValue("Pytanie dalej");
  });

  it("shows the counter only above 1800 characters", () => {
    const { textarea } = setup();
    fireEvent.change(textarea, { target: { value: "a".repeat(1800) } });
    expect(screen.queryByText("1800 / 2000")).not.toBeInTheDocument();
    fireEvent.change(textarea, { target: { value: "a".repeat(1801) } });
    expect(screen.getByText("1801 / 2000")).toBeInTheDocument();
  });

  it("renders no file input and no attachment control", () => {
    const { container } = setup();
    expect(container.querySelector("input[type=file]")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /załącz|attach|plik/i })
    ).not.toBeInTheDocument();
  });

  it("disables the textarea and the button when disabled", () => {
    const { textarea } = setup({ disabled: true });
    expect(textarea).toBeDisabled();
    expect(
      screen.getByRole("button", { name: texts.chat.send })
    ).toBeDisabled();
  });
});
