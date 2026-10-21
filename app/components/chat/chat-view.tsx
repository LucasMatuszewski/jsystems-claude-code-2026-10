"use client";

import type { ReactNode } from "react";
import { CaseSummary } from "@/components/chat/case-summary";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatScreen } from "@/components/chat/chat-screen";
import { DecisionBadge } from "@/components/chat/decision-badge";
import { FailedMarker } from "@/components/chat/failed-marker";
import { MessageList } from "@/components/chat/message-list";
import { CASE_TYPE_LABELS } from "@/lib/case/constants";
import { useCaseSession } from "@/lib/session/context";
import type { UseCaseChat } from "@/lib/session/use-case-chat";

type ChatViewProps = { chat: UseCaseChat };

/** The chat screen: summary, conversation and input bound to the chat session (PRD §9.2). */
export function ChatView({ chat }: ChatViewProps) {
  const { state } = useCaseSession();
  const { caseContext, originalPhoto, reducedPhoto } = state;

  if (caseContext === null || reducedPhoto === null) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("ChatView rendered without case context or reduced photo.");
    }
    return null;
  }

  const markerNode: Record<string, ReactNode> | undefined = chat.marker
    ? {
        [chat.marker.messageId]: (
          <FailedMarker
            kind={chat.marker.kind}
            onRetry={chat.marker.kind === "too-large" ? undefined : chat.retry}
          />
        ),
      }
    : undefined;

  return (
    <div
      className="flex min-h-[calc(100dvh-72px)] flex-col"
      data-testid="chat-screen"
    >
      <ChatScreen
        conversation={
          <MessageList
            markers={markerNode}
            messages={chat.messages}
            status={chat.status}
          />
        }
        input={
          <ChatInput
            disabled={chat.inputDisabled}
            onSend={chat.sendFollowUp}
            onStop={chat.stop}
            status={chat.status}
          />
        }
        summary={
          <CaseSummary
            caseContext={caseContext}
            currentLabel={chat.currentLabel}
            originalPhotoUrl={originalPhoto?.url ?? null}
            reducedPhotoUrl={reducedPhoto.url}
          />
        }
        summaryToggleLabel={
          <>
            {CASE_TYPE_LABELS[caseContext.caseType]}{" "}
            <DecisionBadge label={chat.currentLabel} />
          </>
        }
      />
    </div>
  );
}
