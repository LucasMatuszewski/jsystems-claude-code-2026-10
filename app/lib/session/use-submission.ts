"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  type CaseContext,
  caseFormSchema,
  type ImageAnalysis,
} from "@/lib/case/schemas";
import { reducePhoto } from "@/lib/image/reduce";
import { useCaseSession } from "@/lib/session/context";
import {
  SUBMISSION_DEADLINE_MS,
  type SubmitDeps,
  submitCase,
} from "@/lib/session/submit-case";

type UseSubmissionOptions = {
  /** Starts the chat with the analysis results (P4-05 wires useChat here). */
  startChat: (args: {
    caseContext: CaseContext;
    imageAnalysis: ImageAnalysis;
  }) => void;
  onDeadline?: () => void;
  deps?: Partial<SubmitDeps>;
};

/**
 * Runs the submission for the stored form values and photo.
 * A single 60 s deadline starts with the submission and is cleared when the
 * screen becomes "chat" or "form" (ADR-004 §3.3).
 */
export function useSubmission(opts: UseSubmissionOptions): {
  submit: () => Promise<void>;
} {
  const { state, dispatch } = useCaseSession();
  const { formValues, originalPhoto, screen } = state;
  const { startChat, onDeadline, deps } = opts;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  // Incremented for every new attempt and every invalidation (deadline, unmount).
  const attemptRef = useRef(0);
  const screenRef = useRef(screen);

  const clearDeadline = useCallback((): void => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    screenRef.current = screen;
    if (screen === "chat" || screen === "form") {
      clearDeadline();
    }
  }, [screen, clearDeadline]);

  useEffect(
    () => () => {
      attemptRef.current += 1;
      clearDeadline();
      controllerRef.current?.abort();
    },
    [clearDeadline]
  );

  const submit = useCallback(async (): Promise<void> => {
    const parsed = caseFormSchema.safeParse(formValues);
    if (!parsed.success || originalPhoto === null) {
      return;
    }

    const attempt = attemptRef.current + 1;
    attemptRef.current = attempt;
    clearDeadline();
    const controller = new AbortController();
    controllerRef.current = controller;

    dispatch({ type: "SUBMIT_STARTED" });

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (attemptRef.current !== attempt) {
        return;
      }
      // Invalidate this attempt so a late response is ignored.
      attemptRef.current += 1;
      controller.abort();
      if (screenRef.current === "processing") {
        onDeadline?.();
        dispatch({ code: "ANALYSIS_TIMEOUT", type: "SUBMIT_FAILED" });
      }
    }, SUBMISSION_DEADLINE_MS);

    const result = await submitCase(
      parsed.data,
      originalPhoto.file,
      controller.signal,
      {
        createObjectURL:
          deps?.createObjectURL ?? ((blob: Blob) => URL.createObjectURL(blob)),
        fetch: deps?.fetch ?? globalThis.fetch,
        reduce: deps?.reduce ?? reducePhoto,
      }
    );

    if (attemptRef.current !== attempt) {
      return;
    }

    if (!result.ok) {
      clearDeadline();
      dispatch({ code: result.code, type: "SUBMIT_FAILED" });
      return;
    }

    // The deadline keeps running until the first chunk or the next screen change.
    dispatch({
      caseContext: result.caseContext,
      imageAnalysis: result.imageAnalysis,
      reducedPhoto: result.reducedPhoto,
      type: "ANALYSIS_SUCCEEDED",
    });
    startChat({
      caseContext: result.caseContext,
      imageAnalysis: result.imageAnalysis,
    });
  }, [
    clearDeadline,
    deps,
    dispatch,
    formValues,
    onDeadline,
    originalPhoto,
    startChat,
  ]);

  return { submit };
}
