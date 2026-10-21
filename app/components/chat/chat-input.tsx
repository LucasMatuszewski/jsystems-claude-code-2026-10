"use client";

import type { ChatStatus } from "ai";
import { CornerDownLeftIcon, SquareIcon } from "lucide-react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { useCallback, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CHAT_MESSAGE_MAX } from "@/lib/case/constants";
import { formatCounter, texts } from "@/lib/case/texts";
import { cn } from "@/lib/utils";

const COUNTER_THRESHOLD = 1800;

export type ChatInputProps = {
  status: ChatStatus;
  onSend: (text: string) => void;
  onStop: () => void;
  /** Non-retryable state, e.g. REQUEST_TOO_LARGE. */
  disabled?: boolean;
};

export function ChatInput({
  status,
  onSend,
  onStop,
  disabled = false,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const inputId = useId();
  const busy = status === "submitted" || status === "streaming";
  const trimmed = text.trim();
  const canSend =
    !busy &&
    !disabled &&
    trimmed.length > 0 &&
    trimmed.length <= CHAT_MESSAGE_MAX;

  const send = useCallback(() => {
    if (!canSend) {
      return;
    }
    onSend(trimmed);
    setText("");
  }, [canSend, onSend, trimmed]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      send();
    },
    [send]
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setText(event.currentTarget.value);
    },
    []
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== "Enter" || event.shiftKey) {
        return;
      }
      if (event.nativeEvent.isComposing) {
        return;
      }
      event.preventDefault();
      send();
    },
    [send]
  );

  return (
    <form
      className="flex items-end gap-2 rounded-lg bg-input p-2"
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor={inputId}>
        {texts.chat.inputLabel}
      </label>
      <div className="flex min-w-0 flex-1 flex-col items-end gap-1">
        <Textarea
          className={cn(
            "min-h-10 border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
          )}
          disabled={disabled}
          id={inputId}
          maxLength={CHAT_MESSAGE_MAX}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={texts.chat.inputPlaceholder}
          rows={1}
          value={text}
        />
        {text.length > COUNTER_THRESHOLD ? (
          <span className="px-2 text-xs text-muted-foreground">
            {formatCounter(text.length, CHAT_MESSAGE_MAX)}
          </span>
        ) : null}
      </div>
      {busy ? (
        <Button
          aria-label={texts.chat.stop}
          onClick={onStop}
          size="icon-lg"
          type="button"
        >
          <SquareIcon className="size-4" />
        </Button>
      ) : (
        <Button
          aria-label={texts.chat.send}
          disabled={!canSend}
          size="icon-lg"
          type="submit"
        >
          <CornerDownLeftIcon className="size-4" />
        </Button>
      )}
    </form>
  );
}
