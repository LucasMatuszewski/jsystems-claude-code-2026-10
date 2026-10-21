import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CaseContext, ImageAnalysis } from "@/lib/case/schemas";
import {
  type CaseSessionAction,
  caseSessionReducer,
} from "@/lib/session/reducer";
import {
  type CaseSessionState,
  createInitialState,
  EMPTY_FORM_VALUES,
  type PhotoRef,
  type ReducedPhotoRef,
} from "@/lib/session/state";

afterEach(cleanup);

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Reflect.ownKeys(value)) {
      deepFreeze((value as Record<PropertyKey, unknown>)[key]);
    }
  }
  return value;
}

function makePhoto(name: string, url: string): PhotoRef {
  return { file: new File(["x"], name, { type: "image/jpeg" }), url };
}

function makeReduced(url: string): ReducedPhotoRef {
  return { blob: new Blob(["y"], { type: "image/jpeg" }), url };
}

const caseContext = {
  assessmentDate: "2026-10-21",
  caseType: "return",
  category: "laptop",
  daysSincePurchase: 3,
  modelName: "Model X",
  purchaseChannel: "online",
  purchaseDate: "2026-10-18",
  reason: "",
} as unknown as CaseContext;

const imageAnalysis = {
  confidence: "high",
  variant: "return",
} as unknown as ImageAnalysis;

function filledState(): CaseSessionState {
  return deepFreeze({
    ...createInitialState("chat-1"),
    fieldErrors: { modelName: "bad" },
    formValues: {
      caseType: "complaint",
      category: "tv",
      modelName: "TV-1",
      purchaseChannel: "in_store",
      purchaseDate: "2026-10-01",
      reason: "Some reason text here",
    },
    originalPhoto: makePhoto("a.jpg", "blob:a"),
  });
}

function reduce(state: CaseSessionState, action: CaseSessionAction) {
  return caseSessionReducer(deepFreeze(state), deepFreeze(action));
}

describe("createInitialState", () => {
  it("starts on the form screen with everything empty", () => {
    const state = createInitialState("chat-9");
    expect(state).toEqual({
      caseContext: null,
      chatId: "chat-9",
      fieldErrors: {},
      formValues: EMPTY_FORM_VALUES,
      imageAnalysis: null,
      originalPhoto: null,
      processingStep: null,
      reducedPhoto: null,
      screen: "form",
      submissionError: null,
      validationAttempted: false,
    });
  });

  it("has empty form values with null selects and empty strings", () => {
    expect(EMPTY_FORM_VALUES).toEqual({
      caseType: null,
      category: null,
      modelName: "",
      purchaseChannel: null,
      purchaseDate: "",
      reason: "",
    });
  });
});

describe("caseSessionReducer", () => {
  it("FORM_CHANGED sets the field value", () => {
    const next = reduce(createInitialState("c"), {
      field: "modelName",
      type: "FORM_CHANGED",
      value: "Phone",
    });
    expect(next.formValues.modelName).toBe("Phone");
  });

  it("FORM_CHANGED clears only that field's error", () => {
    const next = reduce(
      {
        ...createInitialState("c"),
        fieldErrors: { category: "b", modelName: "a" },
      },
      { field: "modelName", type: "FORM_CHANGED", value: "Phone" }
    );
    expect(next.fieldErrors).toEqual({ category: "b" });
  });

  it("PHOTO_SELECTED stores the photo and clears the photo error", () => {
    const photo = makePhoto("b.jpg", "blob:b");
    const next = reduce(
      { ...createInitialState("c"), fieldErrors: { photo: "old" } },
      { photo, type: "PHOTO_SELECTED" }
    );
    expect(next.originalPhoto).toBe(photo);
    expect(next.fieldErrors).toEqual({});
  });

  it("PHOTO_REJECTED keeps the previous photo and sets the photo error", () => {
    const state = filledState();
    const next = reduce(state, { message: "Za duże", type: "PHOTO_REJECTED" });
    expect(next.originalPhoto).toBe(state.originalPhoto);
    expect(next.fieldErrors.photo).toBe("Za duże");
  });

  it("PHOTO_REMOVED clears the original photo", () => {
    const next = reduce(filledState(), { type: "PHOTO_REMOVED" });
    expect(next.originalPhoto).toBeNull();
  });

  it("VALIDATION_FAILED replaces errors and marks validation as attempted", () => {
    const next = reduce(filledState(), {
      errors: { caseType: "Wymagane" },
      type: "VALIDATION_FAILED",
    });
    expect(next.fieldErrors).toEqual({ caseType: "Wymagane" });
    expect(next.validationAttempted).toBe(true);
  });

  it("SUBMIT_STARTED switches to processing and resets submission state", () => {
    const next = reduce(
      {
        ...filledState(),
        submissionError: "ANALYSIS_FAILED",
        validationAttempted: false,
      },
      { type: "SUBMIT_STARTED" }
    );
    expect(next.screen).toBe("processing");
    expect(next.processingStep).toBe("analyzing");
    expect(next.submissionError).toBeNull();
    expect(next.fieldErrors).toEqual({});
    expect(next.validationAttempted).toBe(true);
  });

  it("ANALYSIS_SUCCEEDED stores analysis data and moves to deciding", () => {
    const reduced = makeReduced("blob:r");
    const next = reduce(
      { ...filledState(), processingStep: "analyzing", screen: "processing" },
      {
        caseContext,
        imageAnalysis,
        reducedPhoto: reduced,
        type: "ANALYSIS_SUCCEEDED",
      }
    );
    expect(next.caseContext).toBe(caseContext);
    expect(next.imageAnalysis).toBe(imageAnalysis);
    expect(next.reducedPhoto).toBe(reduced);
    expect(next.processingStep).toBe("deciding");
    expect(next.screen).toBe("processing");
  });

  it("FIRST_CHUNK_RECEIVED moves processing to chat", () => {
    const next = reduce(
      { ...filledState(), processingStep: "deciding", screen: "processing" },
      { type: "FIRST_CHUNK_RECEIVED" }
    );
    expect(next.screen).toBe("chat");
    expect(next.processingStep).toBeNull();
  });

  it("FIRST_CHUNK_RECEIVED is a no-op on the form screen", () => {
    const state = filledState();
    const next = reduce(state, { type: "FIRST_CHUNK_RECEIVED" });
    expect(next).toBe(state);
  });

  it("SUBMIT_FAILED returns to the form, keeps form values and photo, clears analysis", () => {
    const state: CaseSessionState = {
      ...filledState(),
      caseContext,
      imageAnalysis,
      processingStep: "deciding",
      reducedPhoto: makeReduced("blob:r"),
      screen: "processing",
    };
    const next = reduce(state, {
      code: "NETWORK_ERROR",
      type: "SUBMIT_FAILED",
    });
    expect(next.screen).toBe("form");
    expect(next.processingStep).toBeNull();
    expect(next.submissionError).toBe("NETWORK_ERROR");
    expect(next.formValues).toBe(state.formValues);
    expect(next.originalPhoto).toBe(state.originalPhoto);
    expect(next.caseContext).toBeNull();
    expect(next.imageAnalysis).toBeNull();
    expect(next.reducedPhoto).toBeNull();
  });

  it("ERROR_DISMISSED clears the submission error", () => {
    const next = reduce(
      { ...filledState(), submissionError: "ANALYSIS_TIMEOUT" },
      { type: "ERROR_DISMISSED" }
    );
    expect(next.submissionError).toBeNull();
  });

  it("RESET returns a fresh state with the new chatId", () => {
    const next = reduce(filledState(), { chatId: "chat-new", type: "RESET" });
    expect(next).toEqual(createInitialState("chat-new"));
  });

  it("never mutates the input state", () => {
    const state = filledState();
    const before = structuredClone({
      ...state,
      originalPhoto: null,
    });
    const actions: CaseSessionAction[] = [
      { field: "modelName", type: "FORM_CHANGED", value: "Z" },
      { photo: makePhoto("c.jpg", "blob:c"), type: "PHOTO_SELECTED" },
      { message: "m", type: "PHOTO_REJECTED" },
      { type: "PHOTO_REMOVED" },
      { errors: { reason: "r" }, type: "VALIDATION_FAILED" },
      { type: "SUBMIT_STARTED" },
      { code: "ANALYSIS_FAILED", type: "SUBMIT_FAILED" },
      { type: "ERROR_DISMISSED" },
      { chatId: "x", type: "RESET" },
    ];
    for (const action of actions) {
      reduce(state, action);
    }
    expect({ ...state, originalPhoto: null }).toEqual(before);
    expect(state.originalPhoto?.url).toBe("blob:a");
  });

  it("returns the same state object when ERROR_DISMISSED has nothing to clear", () => {
    const state = createInitialState("c");
    const next = reduce(state, { type: "ERROR_DISMISSED" });
    expect(next).toBe(state);
  });
});
