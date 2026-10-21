import type { CaseType, Category, PurchaseChannel } from "@/lib/case/constants";
import type { AppErrorCode } from "@/lib/case/errors";
import type {
  CaseContext,
  CaseFormField,
  ImageAnalysis,
} from "@/lib/case/schemas";

export type FormValues = {
  caseType: CaseType | null;
  purchaseChannel: PurchaseChannel | null;
  category: Category | null;
  modelName: string;
  purchaseDate: string;
  reason: string;
};

export type FieldErrorKey = CaseFormField | "photo";
export type FieldErrors = Partial<Record<FieldErrorKey, string>>;
export type Screen = "form" | "processing" | "chat";
export type ProcessingStep = "analyzing" | "deciding" | null;
export type SubmissionError = AppErrorCode | "NETWORK_ERROR";

/** Original photo and its object URL. */
export type PhotoRef = { file: File; url: string };
/** Reduced photo blob and its object URL. */
export type ReducedPhotoRef = { blob: Blob; url: string };

export type CaseSessionState = {
  chatId: string;
  screen: Screen;
  processingStep: ProcessingStep;
  formValues: FormValues;
  fieldErrors: FieldErrors;
  /** After the first submit attempt fields re-validate on change (ADR-004 §3.6). */
  validationAttempted: boolean;
  originalPhoto: PhotoRef | null;
  reducedPhoto: ReducedPhotoRef | null;
  caseContext: CaseContext | null;
  imageAnalysis: ImageAnalysis | null;
  submissionError: SubmissionError | null;
};

export const EMPTY_FORM_VALUES: FormValues = {
  caseType: null,
  category: null,
  modelName: "",
  purchaseChannel: null,
  purchaseDate: "",
  reason: "",
};

export function createInitialState(chatId: string): CaseSessionState {
  return {
    caseContext: null,
    chatId,
    fieldErrors: {},
    formValues: EMPTY_FORM_VALUES,
    imageAnalysis: null,
    originalPhoto: null,
    processingStep: null,
    reducedPhoto: null,
    screen: "form",
    submissionError: null,
    validationAttempted: false,
  };
}
