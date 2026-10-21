"use client";

import { FormScreen } from "@/components/case-form/form-screen";
import { AppHeader } from "@/components/layout/app-header";
import { CaseSessionProvider, useCaseSession } from "@/lib/session/context";
import { useCaseChat } from "@/lib/session/use-case-chat";

function CaseFlowScreens(): React.JSX.Element {
  const { state } = useCaseSession();
  const chat = useCaseChat();

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        {state.screen === "chat" ? (
          <div data-testid="chat-screen" />
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
