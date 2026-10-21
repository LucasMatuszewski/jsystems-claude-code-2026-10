import { describe, expect, it } from "vitest";
import { texts } from "@/lib/case/texts";
import type { FieldErrors, FormValues } from "@/lib/session/state";
import {
  FIELD_FOCUS_ORDER,
  firstInvalidField,
  validateCaseForm,
} from "./validate";

const EMPTY: FormValues = {
  caseType: null,
  category: null,
  modelName: "",
  purchaseChannel: null,
  purchaseDate: "",
  reason: "",
};

const VALID: FormValues = {
  caseType: "return",
  category: "laptop",
  modelName: "Laptop Pro",
  purchaseChannel: "online",
  purchaseDate: "2024-05-01",
  reason: "",
};

describe("validateCaseForm", () => {
  it("returns an error for every empty required field and the photo when no photo is present", () => {
    expect(validateCaseForm(EMPTY, false)).toEqual({
      caseType: texts.validation.caseTypeRequired,
      category: texts.validation.categoryRequired,
      modelName: texts.validation.modelNameLength,
      photo: texts.validation.photoRequired,
      purchaseChannel: texts.validation.purchaseChannelRequired,
      purchaseDate: texts.validation.purchaseDateRequired,
    });
  });

  it("returns only the photo error when the fields are valid but no photo is present", () => {
    expect(validateCaseForm(VALID, false)).toEqual({
      photo: texts.validation.photoRequired,
    });
  });

  it("returns no errors when the fields are valid and a photo is present", () => {
    expect(validateCaseForm(VALID, true)).toEqual({});
  });

  it("requires at least 20 characters in reason for a complaint", () => {
    const errors = validateCaseForm(
      { ...VALID, caseType: "complaint", reason: "za krótko" },
      true
    );
    expect(errors).toEqual({
      reason: texts.validation.reasonComplaintMin,
    });
  });

  it("rejects a purchase date in the future", () => {
    expect(
      validateCaseForm({ ...VALID, purchaseDate: "2999-01-01" }, true)
    ).toEqual({ purchaseDate: texts.validation.purchaseDateFuture });
  });

  it("rejects a model name shorter than 2 characters", () => {
    expect(validateCaseForm({ ...VALID, modelName: "A" }, true)).toEqual({
      modelName: texts.validation.modelNameLength,
    });
  });
});

describe("FIELD_FOCUS_ORDER", () => {
  it("follows AC-01 order with the photo last", () => {
    expect(FIELD_FOCUS_ORDER).toEqual([
      "caseType",
      "purchaseChannel",
      "category",
      "modelName",
      "purchaseDate",
      "reason",
      "photo",
    ]);
  });
});

describe("firstInvalidField", () => {
  it("returns the first invalid field in AC-01 order", () => {
    const errors: FieldErrors = { category: "a", reason: "b" };
    expect(firstInvalidField(errors)).toBe("category");
  });

  it("returns photo only when no form field is invalid", () => {
    expect(firstInvalidField({ photo: "x", reason: "y" })).toBe("reason");
    expect(firstInvalidField({ photo: "x" })).toBe("photo");
  });

  it("returns null when there are no errors", () => {
    expect(firstInvalidField({})).toBeNull();
  });
});
