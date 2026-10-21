"use client";

import { type FormEvent, type ReactNode, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { CaseType, Category, PurchaseChannel } from "@/lib/case/constants";
import type { CaseFormField } from "@/lib/case/schemas";
import { texts } from "@/lib/case/texts";
import { useCaseSession } from "@/lib/session/context";
import type { FieldErrors, FormValues } from "@/lib/session/state";
import { AiNotice } from "./ai-notice";
import { CaseTypeTiles } from "./case-type-tiles";
import { CategoryField } from "./field-category";
import { ModelNameField } from "./field-model-name";
import { PurchaseChannelField } from "./field-purchase-channel";
import { PurchaseDateField } from "./field-purchase-date";
import { ReasonField } from "./field-reason";
import { firstInvalidField, focusField, validateCaseForm } from "./validate";

type CaseFormProps = {
  /** P3-04's <PhotoField/>, rendered after the reason field. */
  photoField: ReactNode;
  /** Called only when validation passes (no network here). */
  onValidSubmit: () => void;
  /** Wraps all controls in <fieldset disabled> (AC-17). */
  disabled?: boolean;
  /** When provided, rendered INSTEAD of the submit button. */
  footer?: ReactNode;
  /** Rendered just above the submit button/footer. */
  banner?: ReactNode;
};

/** Keeps the photo error already shown (e.g. a rejected file) instead of the generic one. */
function keepPhotoMessage(
  errors: FieldErrors,
  current: FieldErrors
): FieldErrors {
  if (errors.photo !== undefined && current.photo !== undefined) {
    return { ...errors, photo: current.photo };
  }
  return errors;
}

export function CaseForm({
  photoField,
  onValidSubmit,
  disabled = false,
  footer,
  banner,
}: CaseFormProps): React.JSX.Element {
  const { state, dispatch } = useCaseSession();
  const { formValues, fieldErrors, validationAttempted, originalPhoto } = state;
  const hasPhoto = originalPhoto !== null;
  const isComplaint = formValues.caseType === "complaint";

  // Every change dispatches FORM_CHANGED; after a failed submit it also re-validates.
  const applyChange = useCallback(
    <K extends CaseFormField>(field: K, value: FormValues[K]): void => {
      dispatch({ field, type: "FORM_CHANGED", value });
      if (validationAttempted) {
        const nextValues = { ...formValues, [field]: value } as FormValues;
        dispatch({
          errors: keepPhotoMessage(
            validateCaseForm(nextValues, hasPhoto),
            fieldErrors
          ),
          type: "VALIDATION_FAILED",
        });
      }
    },
    [dispatch, fieldErrors, formValues, hasPhoto, validationAttempted]
  );

  const handlers = useMemo(
    () => ({
      caseType: (value: CaseType) => applyChange("caseType", value),
      category: (value: Category) => applyChange("category", value),
      modelName: (value: string) => applyChange("modelName", value),
      purchaseChannel: (value: PurchaseChannel) =>
        applyChange("purchaseChannel", value),
      purchaseDate: (value: string) => applyChange("purchaseDate", value),
      reason: (value: string) => applyChange("reason", value),
    }),
    [applyChange]
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      const errors = keepPhotoMessage(
        validateCaseForm(formValues, hasPhoto),
        fieldErrors
      );
      const first = firstInvalidField(errors);
      if (first === null) {
        onValidSubmit();
        return;
      }
      dispatch({ errors, type: "VALIDATION_FAILED" });
      requestAnimationFrame(() => focusField(first));
    },
    [dispatch, fieldErrors, formValues, hasPhoto, onValidSubmit]
  );

  return (
    <>
      <p className="mb-4 text-sm text-foreground">{texts.app.intro}</p>
      <AiNotice />
      <form className="mt-6" noValidate onSubmit={handleSubmit}>
        <fieldset
          className="m-0 flex min-w-0 flex-col gap-6 border-0 p-0"
          disabled={disabled}
        >
          <CaseTypeTiles
            error={fieldErrors.caseType}
            onChange={handlers.caseType}
            value={formValues.caseType}
          />
          <PurchaseChannelField
            error={fieldErrors.purchaseChannel}
            onChange={handlers.purchaseChannel}
            value={formValues.purchaseChannel}
          />
          <CategoryField
            error={fieldErrors.category}
            onChange={handlers.category}
            value={formValues.category}
          />
          <ModelNameField
            error={fieldErrors.modelName}
            onChange={handlers.modelName}
            value={formValues.modelName}
          />
          <PurchaseDateField
            error={fieldErrors.purchaseDate}
            onChange={handlers.purchaseDate}
            value={formValues.purchaseDate}
          />
          <ReasonField
            error={fieldErrors.reason}
            onChange={handlers.reason}
            required={isComplaint}
            value={formValues.reason}
          />
          {photoField}
          {banner}
          {footer ?? (
            <Button className="h-12 w-full rounded-lg" type="submit">
              {texts.form.submit}
            </Button>
          )}
        </fieldset>
      </form>
    </>
  );
}
