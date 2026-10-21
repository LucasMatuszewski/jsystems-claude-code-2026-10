"use client";

import type { ChatStatus } from "ai";
import type { ReactNode } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ChatMessage } from "@/components/chat/chat-message";
import type { CaseUIMessage } from "@/lib/case/messages";
import { texts } from "@/lib/case/texts";

type MessageListProps = {
  messages: CaseUIMessage[];
  status: ChatStatus;
  markers?: Record<string, ReactNode>;
};

export function MessageList({ messages, status, markers }: MessageListProps) {
  const firstAssistant = messages.find(
    (message) => message.role === "assistant"
  );
  const lastMessage = messages.at(-1);
  const showTyping = status === "submitted" && lastMessage?.role === "user";

  return (
    <Conversation className="h-full">
      <ConversationContent>
        {messages
          .filter((message) => message.metadata?.kind !== "case-submission")
          .map((message) => (
            <ChatMessage
              isFirstAssistant={message === firstAssistant}
              isStreaming={status === "streaming" && message === lastMessage}
              key={message.id}
              marker={markers?.[message.id]}
              message={message}
            />
          ))}
        {showTyping ? (
          <div data-testid="typing-indicator">
            <Shimmer>{texts.chat.typing}</Shimmer>
          </div>
        ) : null}
      </ConversationContent>
      <ConversationScrollButton aria-label={texts.chat.scrollToBottom} />
    </Conversation>
  );
}
