"use client";

import { useCallback } from "react";
import type { CaseContext, ImageAnalysis } from "@/lib/case/schemas";
import { useCaseSession } from "@/lib/session/context";
import { useSubmission } from "@/lib/session/use-submission";
import { CaseForm } from "./case-form";
import { ErrorBanner } from "./error-banner";
import { PhotoField } from "./photo-field";
import { ProcessingSteps } from "./processing-steps";

type FormScreenProps = {
  /** P4-05 passes the useChat start here. */
  startChat: (args: {
    caseContext: CaseContext;
    imageAnalysis: ImageAnalysis;
  }) => void;
  onDeadline?: () => void;
};

/** The case form wired to the submission pipeline (AC-17, AC-18, AC-22). */
export function FormScreen({
  startChat,
  onDeadline,
}: FormScreenProps): React.JSX.Element {
  const { state, dispatch } = useCaseSession();
  const { submit } = useSubmission({ onDeadline, startChat });
  const isProcessing = state.screen === "processing";

  const handleSubmit = useCallback((): void => {
    submit().catch(() => undefined);
  }, [submit]);

  const handleDismiss = useCallback((): void => {
    dispatch({ type: "ERROR_DISMISSED" });
  }, [dispatch]);

  return (
    <CaseForm
      banner={
        state.submissionError ? (
          <ErrorBanner onDismiss={handleDismiss} onRetry={handleSubmit} />
        ) : undefined
      }
      disabled={isProcessing}
      footer={
        isProcessing && state.processingStep ? (
          <ProcessingSteps step={state.processingStep} />
        ) : undefined
      }
      onValidSubmit={handleSubmit}
      photoField={<PhotoField />}
    />
  );
}
