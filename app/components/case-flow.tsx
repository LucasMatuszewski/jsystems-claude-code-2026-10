"use client";

import { FormScreen } from "@/components/case-form/form-screen";
import { AppHeader } from "@/components/layout/app-header";
import { CaseSessionProvider, useCaseSession } from "@/lib/session/context";

// P4-05: replace noop with useChat start
const noop = (): void => undefined;

function CaseFlowScreens(): React.JSX.Element {
  const { state } = useCaseSession();

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        {state.screen === "chat" ? (
          <div data-testid="chat-screen" />
        ) : (
          <div data-screen={state.screen} data-testid="form-screen">
            <FormScreen startChat={noop} />
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
