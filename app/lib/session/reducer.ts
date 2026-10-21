import type {
  CaseContext,
  CaseFormField,
  ImageAnalysis,
} from "@/lib/case/schemas";
import {
  type CaseSessionState,
  createInitialState,
  type FieldErrors,
  type FormValues,
  type PhotoRef,
  type ReducedPhotoRef,
  type SubmissionError,
} from "@/lib/session/state";

export type CaseSessionAction =
  | {
      type: "FORM_CHANGED";
      field: CaseFormField;
      value: FormValues[CaseFormField];
    }
  | { type: "PHOTO_SELECTED"; photo: PhotoRef }
  | { type: "PHOTO_REJECTED"; message: string }
  | { type: "PHOTO_REMOVED" }
  | { type: "VALIDATION_FAILED"; errors: FieldErrors }
  | { type: "SUBMIT_STARTED" }
  | {
      type: "ANALYSIS_SUCCEEDED";
      caseContext: CaseContext;
      imageAnalysis: ImageAnalysis;
      reducedPhoto: ReducedPhotoRef;
    }
  | { type: "FIRST_CHUNK_RECEIVED" }
  | { type: "SUBMIT_FAILED"; code: SubmissionError }
  | { type: "ERROR_DISMISSED" }
  | { type: "RESET"; chatId: string };

/** Returns a copy of `errors` without `key`. */
function withoutError(
  errors: FieldErrors,
  key: keyof FieldErrors
): FieldErrors {
  const next: FieldErrors = { ...errors };
  delete next[key];
  return next;
}

/** Pure session reducer. Object URLs are handled by the provider, not here. */
export function caseSessionReducer(
  state: CaseSessionState,
  action: CaseSessionAction
): CaseSessionState {
  switch (action.type) {
    case "FORM_CHANGED":
      return {
        ...state,
        fieldErrors: withoutError(state.fieldErrors, action.field),
        formValues: {
          ...state.formValues,
          [action.field]: action.value,
        } as FormValues,
      };

    case "PHOTO_SELECTED":
      return {
        ...state,
        fieldErrors: withoutError(state.fieldErrors, "photo"),
        originalPhoto: action.photo,
      };

    case "PHOTO_REJECTED":
      return {
        ...state,
        fieldErrors: { ...state.fieldErrors, photo: action.message },
      };

    case "PHOTO_REMOVED":
      return { ...state, originalPhoto: null };

    case "VALIDATION_FAILED":
      return {
        ...state,
        fieldErrors: action.errors,
        validationAttempted: true,
      };

    case "SUBMIT_STARTED":
      return {
        ...state,
        fieldErrors: {},
        processingStep: "analyzing",
        screen: "processing",
        submissionError: null,
        validationAttempted: true,
      };

    case "ANALYSIS_SUCCEEDED":
      return {
        ...state,
        caseContext: action.caseContext,
        imageAnalysis: action.imageAnalysis,
        processingStep: "deciding",
        reducedPhoto: action.reducedPhoto,
      };

    case "FIRST_CHUNK_RECEIVED":
      if (state.screen !== "processing") {
        return state;
      }
      return { ...state, processingStep: null, screen: "chat" };

    case "SUBMIT_FAILED":
      return {
        ...state,
        caseContext: null,
        imageAnalysis: null,
        processingStep: null,
        reducedPhoto: null,
        screen: "form",
        submissionError: action.code,
      };

    case "ERROR_DISMISSED":
      if (state.submissionError === null) {
        return state;
      }
      return { ...state, submissionError: null };

    case "RESET":
      return createInitialState(action.chatId);

    default:
      return state;
  }
}
