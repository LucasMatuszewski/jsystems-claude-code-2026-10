"use client";

import { type ChangeEvent, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { todayInWarsaw } from "@/lib/case/days";
import { texts } from "@/lib/case/texts";
import { FieldError } from "./field-error";

type PurchaseDateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error: string | undefined;
};

export function PurchaseDateField({
  value,
  onChange,
  error,
}: PurchaseDateFieldProps): React.JSX.Element {
  const errorId = "field-purchaseDate-error";
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
    [onChange]
  );
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="field-purchaseDate">
        {texts.form.purchaseDate.label}
      </Label>
      <Input
        aria-describedby={error === undefined ? undefined : errorId}
        aria-invalid={error === undefined ? undefined : true}
        id="field-purchaseDate"
        max={todayInWarsaw()}
        onChange={handleChange}
        type="date"
        value={value}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}
