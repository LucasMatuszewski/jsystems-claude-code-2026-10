"use client";

import { useCallback } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CASE_TYPES, type CaseType } from "@/lib/case/constants";
import { texts } from "@/lib/case/texts";
import { FieldError } from "./field-error";

type CaseTypeTilesProps = {
  value: CaseType | null;
  onChange: (value: CaseType) => void;
  error: string | undefined;
};

export function CaseTypeTiles({
  value,
  onChange,
  error,
}: CaseTypeTilesProps): React.JSX.Element {
  const errorId = "field-caseType-error";
  const handleValueChange = useCallback(
    (next: string) => onChange(next as CaseType),
    [onChange]
  );
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-3 text-sm font-medium leading-none">
        {texts.form.caseType.label}
      </legend>
      <RadioGroup
        aria-describedby={error === undefined ? undefined : errorId}
        aria-invalid={error === undefined ? undefined : true}
        className="grid gap-3 sm:grid-cols-2"
        onValueChange={handleValueChange}
        value={value ?? ""}
      >
        {CASE_TYPES.map((type) => {
          const itemId =
            type === CASE_TYPES[0] ? "field-caseType" : `case-type-${type}`;
          const labelId = `case-type-label-${type}`;
          const descriptionId = `case-type-description-${type}`;
          return (
            <label
              className="flex cursor-pointer flex-col gap-1 rounded-xl border border-border p-4 has-[[data-state=checked]]:border-2 has-[[data-state=checked]]:border-primary"
              htmlFor={itemId}
              key={type}
            >
              <span className="flex items-center gap-2">
                <RadioGroupItem
                  aria-describedby={descriptionId}
                  aria-labelledby={labelId}
                  id={itemId}
                  value={type}
                />
                <span className="text-base font-semibold" id={labelId}>
                  {texts.form.caseType.options[type]}
                </span>
              </span>
              <span
                className="text-sm text-muted-foreground"
                id={descriptionId}
              >
                {texts.form.caseType.descriptions[type]}
              </span>
            </label>
          );
        })}
      </RadioGroup>
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}
