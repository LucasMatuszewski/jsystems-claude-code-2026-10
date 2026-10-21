"use client";

import { FormScreen } from "@/components/case-form/form-screen";
import { ChatView } from "@/components/chat/chat-view";
import { NewCaseDialog } from "@/components/chat/new-case-dialog";
import { AppHeader } from "@/components/layout/app-header";
import { CaseSessionProvider, useCaseSession } from "@/lib/session/context";
import { useCaseChat } from "@/lib/session/use-case-chat";
import { useLeaveGuard } from "@/lib/session/use-leave-guard";

function CaseFlowScreens(): React.JSX.Element {
  const { state } = useCaseSession();
  const chat = useCaseChat();
  const isChat = state.screen === "chat";

  // AC-49: leaving the page during a chat asks for confirmation.
  useLeaveGuard(isChat);

  return (
    <>
      <AppHeader
        actions={
          isChat ? <NewCaseDialog onConfirm={chat.confirmNewCase} /> : undefined
        }
      />
      <main
        className={
          isChat
            ? "mx-auto flex w-full max-w-6xl flex-col px-4 py-6"
            : "mx-auto w-full max-w-3xl px-4 py-6"
        }
      >
        {isChat ? (
          <ChatView chat={chat} />
        ) : (
          <div data-screen={state.screen} data-testid="form-screen">
            <FormScreen
              onDeadline={chat.abortFirstTurn}
              startChat={chat.startChat}
            />
          </div>
        )}
      </main>
    </>
  );
}

export function CaseFlow(): React.JSX.Element {
  return (
    <CaseSessionProvider>
      <CaseFlowScreens />
    </CaseSessionProvider>
  );
}
