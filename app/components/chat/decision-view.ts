import type { DecisionLabel } from "@/lib/case/constants";
import type { SetDecisionPart } from "@/lib/case/messages";

export type DecisionView = {
  label: DecisionLabel;
  previousLabel: DecisionLabel | null;
  greeting: string | null;
  changeReason: string | null;
  isUpdate: boolean;
};

/** null when the part is not output-available or not recorded. */
export function toDecisionView(part: SetDecisionPart): DecisionView | null {
  if (part.state !== "output-available" || part.output.recorded !== true) {
    return null;
  }
  const { previousLabel } = part.output;
  const { changeReason, greeting, label } = part.input;
  return {
    changeReason,
    greeting,
    isUpdate: previousLabel !== null,
    label,
    previousLabel,
  };
}
