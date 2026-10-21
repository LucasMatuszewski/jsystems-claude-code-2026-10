"use client";

import type { ReactNode } from "react";
import { Message, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { DecisionCard } from "@/components/chat/decision-card";
import { toDecisionView } from "@/components/chat/decision-view";
import { Disclaimer } from "@/components/chat/disclaimer";
import type { CaseUIMessage } from "@/lib/case/messages";
import { isSetDecisionPart } from "@/lib/case/messages";
import { texts } from "@/lib/case/texts";

type ChatMessageProps = {
  message: CaseUIMessage;
  isFirstAssistant: boolean;
  isStreaming: boolean;
  marker?: ReactNode;
};

/** Images and links are not rendered from assistant Markdown (AC-46). */
const DISABLED_MARKDOWN_ELEMENTS = ["img", "a"];

export function ChatMessage({
  message,
  isFirstAssistant,
  isStreaming,
  marker,
}: ChatMessageProps) {
  if (message.role === "user") {
    const text = message.parts
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("");
    return (
      <Message data-testid="user-message-wrapper" from="user">
        <div
          className="ml-auto w-fit max-w-full whitespace-pre-wrap rounded-[12px] bg-[#222] px-4 py-3 text-sm text-white"
          data-testid="user-message"
        >
          {text}
        </div>
        {marker}
      </Message>
    );
  }

  const hasRecordedDecision = message.parts.some(
    (part) => isSetDecisionPart(part) && toDecisionView(part) !== null
  );
  const showDisclaimer =
    isFirstAssistant && !isStreaming && hasRecordedDecision;

  return (
    <Message data-testid="assistant-message" from="assistant">
      <div className="flex w-fit max-w-full flex-col gap-2 rounded-[12px] bg-[#F7F7F7] px-4 py-3 text-foreground text-sm">
        <p className="text-[13px] text-muted-foreground">
          {texts.chat.assistantLabel}
        </p>
        {message.parts.map((part, index) => {
          const key = `${message.id}-${index}`;
          if (part.type === "text") {
            return (
              <MessageResponse
                disallowedElements={DISABLED_MARKDOWN_ELEMENTS}
                key={key}
                unwrapDisallowed
              >
                {part.text}
              </MessageResponse>
            );
          }
          if (!isSetDecisionPart(part)) {
            return null;
          }
          if (
            part.state === "input-streaming" ||
            part.state === "input-available"
          ) {
            return (
              <div className="rounded-[12px] bg-background p-4" key={key}>
                <Shimmer>{texts.decision.pending}</Shimmer>
              </div>
            );
          }
          const view = toDecisionView(part);
          if (!view) {
            return null;
          }
          return (
            <div className="flex flex-col gap-2" key={key}>
              {view.isUpdate || view.greeting === null ? null : (
                <p>{view.greeting}</p>
              )}
              <DecisionCard view={view} />
            </div>
          );
        })}
        {showDisclaimer ? <Disclaimer /> : null}
      </div>
      {marker}
    </Message>
  );
}
