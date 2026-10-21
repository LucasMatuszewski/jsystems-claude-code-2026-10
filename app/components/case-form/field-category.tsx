"use client";

import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  type Category,
} from "@/lib/case/constants";
import { texts } from "@/lib/case/texts";
import { FieldError } from "./field-error";

type CategoryFieldProps = {
  value: Category | null;
  onChange: (value: Category) => void;
  error: string | undefined;
};

export function CategoryField({
  value,
  onChange,
  error,
}: CategoryFieldProps): React.JSX.Element {
  const errorId = "field-category-error";
  const handleValueChange = useCallback(
    (next: string) => onChange(next as Category),
    [onChange]
  );
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="field-category">{texts.form.category.label}</Label>
      <Select onValueChange={handleValueChange} value={value ?? ""}>
        <SelectTrigger
          aria-describedby={error === undefined ? undefined : errorId}
          aria-invalid={error === undefined ? undefined : true}
          className="w-full"
          id="field-category"
        >
          <SelectValue placeholder={texts.form.category.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((category) => (
            <SelectItem key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
