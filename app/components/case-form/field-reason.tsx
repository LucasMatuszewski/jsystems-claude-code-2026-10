"use client";

import { type ChangeEvent, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCounter, REASON_MAX, texts } from "@/lib/case/texts";
import { FieldError } from "./field-error";

type ReasonFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error: string | undefined;
  /** True when caseType is complaint: the reason is then required. */
  required: boolean;
};

export function ReasonField({
  value,
  onChange,
  error,
  required,
}: ReasonFieldProps): React.JSX.Element {
  const errorId = "field-reason-error";
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
    [onChange]
  );
  const counterId = "field-reason-counter";
  const describedBy = [error === undefined ? undefined : errorId, counterId]
    .filter((id): id is string => id !== undefined)
    .join(" ");
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="field-reason">
        {required
          ? texts.form.reason.labelComplaint
          : texts.form.reason.labelReturn}
        {required ? (
          <span aria-hidden="true">{texts.form.requiredMarker}</span>
        ) : null}
      </Label>
      <Textarea
        aria-describedby={describedBy}
        aria-invalid={error === undefined ? undefined : true}
        aria-required={required ? true : undefined}
        id="field-reason"
        maxLength={REASON_MAX}
        onChange={handleChange}
        value={value}
      />
      <p
        aria-live="polite"
        className="text-right text-xs text-muted-foreground"
        id={counterId}
      >
        {formatCounter(value.length)}
      </p>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
