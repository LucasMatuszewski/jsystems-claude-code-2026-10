"use client";

import { useCallback } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PURCHASE_CHANNELS, type PurchaseChannel } from "@/lib/case/constants";
import { texts } from "@/lib/case/texts";
import { FieldError } from "./field-error";

type PurchaseChannelFieldProps = {
  value: PurchaseChannel | null;
  onChange: (value: PurchaseChannel) => void;
  error: string | undefined;
};

export function PurchaseChannelField({
  value,
  onChange,
  error,
}: PurchaseChannelFieldProps): React.JSX.Element {
  const errorId = "field-purchaseChannel-error";
  const handleValueChange = useCallback(
    (next: string) => onChange(next as PurchaseChannel),
    [onChange]
  );
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-3 text-sm font-medium leading-none">
        {texts.form.purchaseChannel.label}
      </legend>
      <RadioGroup
        aria-describedby={error === undefined ? undefined : errorId}
        aria-invalid={error === undefined ? undefined : true}
        onValueChange={handleValueChange}
        value={value ?? ""}
      >
        {PURCHASE_CHANNELS.map((channel, index) => {
          const itemId =
            index === 0
              ? "field-purchaseChannel"
              : `purchase-channel-${channel}`;
          const labelId = `purchase-channel-label-${channel}`;
          return (
            <label
              className="flex cursor-pointer items-center gap-2 text-sm"
              htmlFor={itemId}
              key={channel}
            >
              <RadioGroupItem
                aria-labelledby={labelId}
                id={itemId}
                value={channel}
              />
              <span id={labelId}>
                {texts.form.purchaseChannel.options[channel]}
              </span>
            </label>
          );
        })}
      </RadioGroup>
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}
