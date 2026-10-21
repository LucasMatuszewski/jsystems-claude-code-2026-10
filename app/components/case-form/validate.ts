import {
  CASE_FORM_FIELD_ORDER,
  caseFormSchema,
  toFieldErrors,
} from "@/lib/case/schemas";
import { texts } from "@/lib/case/texts";
import type {
  FieldErrorKey,
  FieldErrors,
  FormValues,
} from "@/lib/session/state";

/** Runs caseFormSchema on the values plus the photo-presence rule; returns errors keyed by field ("photo" → texts.validation.photoRequired when hasPhoto is false). Empty object when valid. */
export function validateCaseForm(
  values: FormValues,
  hasPhoto: boolean
): FieldErrors {
  const result = caseFormSchema.safeParse(values);
  const errors: FieldErrors = result.success
    ? {}
    : { ...toFieldErrors(result.error) };
  if (!hasPhoto) {
    errors.photo = texts.validation.photoRequired;
  }
  return errors;
}

/** AC-01 order: form fields first, then the photo. */
export const FIELD_FOCUS_ORDER: readonly FieldErrorKey[] = [
  ...CASE_FORM_FIELD_ORDER,
  "photo",
];

/** First field in FIELD_FOCUS_ORDER that has an error, or null. */
export function firstInvalidField(errors: FieldErrors): FieldErrorKey | null {
  for (const field of FIELD_FOCUS_ORDER) {
    if (errors[field] !== undefined) {
      return field;
    }
  }
  return null;
}

/** Moves focus to the primary control of a field (ids follow the field-<name> contract). */
export function focusField(field: FieldErrorKey): void {
  document.getElementById(`field-${field}`)?.focus();
}
