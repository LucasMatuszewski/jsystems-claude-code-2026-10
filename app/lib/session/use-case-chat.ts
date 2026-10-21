"use client";

import { useChat } from "@ai-sdk/react";
import type { ChatStatus, ChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DecisionLabel } from "@/lib/case/constants";
import { deriveCurrentLabel } from "@/lib/case/labels";
import type { CaseUIMessage } from "@/lib/case/messages";
import type { CaseContext, ImageAnalysis } from "@/lib/case/schemas";
import { texts } from "@/lib/case/texts";
import {
  type ChatErrorCode,
  chatErrorCode,
  createCaseChatTransport,
} from "@/lib/session/chat-transport";
import { useCaseSession } from "@/lib/session/context";
import {
  FOLLOW_UP_DEADLINE_MS,
  hasFirstContent,
  hasRecordedDecision,
} from "@/lib/session/watchdog";

export type ChatMarker = {
  messageId: string;
  kind: "failed" | "interrupted" | "stopped" | "too-large";
};

type StartChatArgs = { caseContext: CaseContext; imageAnalysis: ImageAnalysis };

type UseCaseChatOptions = {
  /** Tests only: replaces the HTTP transport. */
  transport?: ChatTransport<CaseUIMessage>;
};

export type UseCaseChat = {
  messages: CaseUIMessage[];
  status: ChatStatus;
  currentLabel: DecisionLabel | null;
  marker: ChatMarker | null;
  inputDisabled: boolean;
  startChat: (args: StartChatArgs) => void;
  abortFirstTurn: () => void;
  sendFollowUp: (text: string) => void;
  stop: () => void;
  retry: () => void;
  confirmNewCase: () => void;
};

const isActive = (status: ChatStatus): boolean =>
  status === "submitted" || status === "streaming";

const isFollowUpMessage = (message: CaseUIMessage): boolean =>
  message.role === "user" && message.metadata?.kind === "follow-up";

const lastUserMessage = (
  messages: readonly CaseUIMessage[]
): CaseUIMessage | undefined => messages.findLast((m) => m.role === "user");

/**
 * Chat runtime for the case flow (ADR-004 §3.3): useChat with the case-context
 * transport, the switch to the chat screen on the first content part, first-turn
 * failures, the 60 s follow-up watchdog, retry, stop and the new-case reset.
 */
export function useCaseChat(options: UseCaseChatOptions = {}): UseCaseChat {
  const { state, dispatch, reset } = useCaseSession();
  const { chatId, screen, processingStep, caseContext, imageAnalysis } = state;

  const contextRef = useRef<StartChatArgs | null>(null);
  useEffect(() => {
    if (caseContext !== null && imageAnalysis !== null) {
      contextRef.current = { caseContext, imageAnalysis };
    }
  }, [caseContext, imageAnalysis]);

  const injectedTransport = options.transport;
  const transport = useMemo(
    () =>
      injectedTransport ?? createCaseChatTransport(() => contextRef.current),
    [injectedTransport]
  );

  const chat = useChat<CaseUIMessage>({ id: chatId, throttle: 50, transport });
  const { messages, status, error } = chat;

  // Latest values for timers and callbacks.
  const messagesRef = useRef(messages);
  const statusRef = useRef(status);
  const screenRef = useRef(screen);
  const chatRef = useRef(chat);
  messagesRef.current = messages;
  statusRef.current = status;
  screenRef.current = screen;
  chatRef.current = chat;

  const [marker, setMarker] = useState<ChatMarker | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handledErrorRef = useRef<Error | undefined>(undefined);

  const clearTimer = useCallback((): void => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback((): void => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const lastUser = lastUserMessage(messagesRef.current);
      chatRef.current.stop();
      if (lastUser !== undefined) {
        setMarker({ kind: "failed", messageId: lastUser.id });
      }
    }, FOLLOW_UP_DEADLINE_MS);
  }, [clearTimer]);

  // A new chat id means a new conversation: drop markers and timers.
  // biome-ignore lint/correctness/useExhaustiveDependencies: chatId is the trigger
  useEffect(() => {
    clearTimer();
    setMarker(null);
    handledErrorRef.current = undefined;
  }, [chatId, clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  /** Back to the form with a banner; the partial conversation is discarded. */
  const failFirstTurn = useCallback(
    (code: ChatErrorCode): void => {
      const { current } = chatRef;
      current.stop();
      current.setMessages([]);
      current.clearError();
      setMarker(null);
      if (screenRef.current !== "form") {
        dispatch({ code, type: "SUBMIT_FAILED" });
      }
    },
    [dispatch]
  );

  // AC-37: the first content part of the first assistant message opens the chat.
  useEffect(() => {
    if (screen !== "processing" || processingStep !== "deciding") {
      return;
    }
    const last = messages.at(-1);
    if (last?.role === "assistant" && hasFirstContent(last)) {
      dispatch({ type: "FIRST_CHUNK_RECEIVED" });
    }
  }, [messages, screen, processingStep, dispatch]);

  // The follow-up watchdog is satisfied by the first content of the reply.
  useEffect(() => {
    const last = messages.at(-1);
    if (
      timerRef.current !== null &&
      last?.role === "assistant" &&
      hasFirstContent(last)
    ) {
      clearTimer();
    }
  }, [messages, clearTimer]);

  // Errors: first turn (AC-22) and follow-ups (AC-41, AC-45).
  useEffect(() => {
    if (
      status !== "error" ||
      error === undefined ||
      handledErrorRef.current === error
    ) {
      return;
    }
    handledErrorRef.current = error;
    clearTimer();
    const code = chatErrorCode(error);
    const { current } = messagesRef;

    if (!current.some(isFollowUpMessage)) {
      const firstAssistant = current.find((m) => m.role === "assistant");
      if (firstAssistant !== undefined && hasRecordedDecision(firstAssistant)) {
        setMarker({ kind: "interrupted", messageId: firstAssistant.id });
        return;
      }
      failFirstTurn(code);
      return;
    }

    const lastUser = lastUserMessage(current);
    if (lastUser !== undefined) {
      setMarker({
        kind: code === "REQUEST_TOO_LARGE" ? "too-large" : "failed",
        messageId: lastUser.id,
      });
    }
  }, [status, error, clearTimer, failFirstTurn]);

  const startChat = useCallback((args: StartChatArgs): void => {
    contextRef.current = args;
    chatRef.current
      .sendMessage({
        metadata: { kind: "case-submission" },
        text: texts.chat.hiddenSubmissionText,
      })
      .catch(() => undefined);
  }, []);

  const abortFirstTurn = useCallback((): void => {
    clearTimer();
    const { current } = chatRef;
    current.stop();
    current.setMessages([]);
    current.clearError();
    setMarker(null);
  }, [clearTimer]);

  const inputDisabled = marker?.kind === "too-large";

  const sendFollowUp = useCallback(
    (text: string): void => {
      if (
        isActive(statusRef.current) ||
        inputDisabled ||
        screenRef.current !== "chat"
      ) {
        return;
      }
      setMarker(null);
      chatRef.current
        .sendMessage({ metadata: { kind: "follow-up" }, text })
        .catch(() => undefined);
      startTimer();
    },
    [inputDisabled, startTimer]
  );

  const stop = useCallback((): void => {
    clearTimer();
    const active = isActive(statusRef.current);
    const { current } = messagesRef;
    chatRef.current.stop();
    if (
      !active ||
      screenRef.current !== "chat" ||
      current.some(isFollowUpMessage)
    ) {
      return;
    }
    // Stopping the FIRST message: keep it only when a decision was recorded.
    const firstAssistant = current.find((m) => m.role === "assistant");
    if (firstAssistant !== undefined && hasRecordedDecision(firstAssistant)) {
      setMarker({ kind: "stopped", messageId: firstAssistant.id });
    } else {
      failFirstTurn("NETWORK_ERROR");
    }
  }, [clearTimer, failFirstTurn]);

  const retry = useCallback((): void => {
    if (marker === null || marker.kind === "too-large") {
      return;
    }
    const wasFollowUp = marker.kind === "failed";
    setMarker(null);
    const { current } = chatRef;
    current.clearError();
    current.regenerate().catch(() => undefined);
    if (wasFollowUp) {
      startTimer();
    }
  }, [marker, startTimer]);

  const confirmNewCase = useCallback((): void => {
    clearTimer();
    chatRef.current.stop();
    reset();
  }, [clearTimer, reset]);

  const currentLabel = useMemo(() => deriveCurrentLabel(messages), [messages]);

  return {
    abortFirstTurn,
    confirmNewCase,
    currentLabel,
    inputDisabled,
    marker,
    messages,
    retry,
    sendFollowUp,
    startChat,
    status,
    stop,
  };
}
