"use client";

import { type ChangeEvent, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MODEL_NAME_MAX } from "@/lib/case/constants";
import { texts } from "@/lib/case/texts";
import { FieldError } from "./field-error";

type ModelNameFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error: string | undefined;
};

export function ModelNameField({
  value,
  onChange,
  error,
}: ModelNameFieldProps): React.JSX.Element {
  const errorId = "field-modelName-error";
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
    [onChange]
  );
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="field-modelName">{texts.form.modelName.label}</Label>
      <Input
        aria-describedby={error === undefined ? undefined : errorId}
        aria-invalid={error === undefined ? undefined : true}
        id="field-modelName"
        maxLength={MODEL_NAME_MAX}
        onChange={handleChange}
        placeholder={texts.form.modelName.placeholder}
        value={value}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}
