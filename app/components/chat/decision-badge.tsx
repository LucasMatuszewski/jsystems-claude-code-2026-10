import { DECISION_STYLES } from "@/components/chat/decision-styles";
import type { DecisionLabel } from "@/lib/case/constants";
import { texts } from "@/lib/case/texts";
import { cn } from "@/lib/utils";

type DecisionBadgeProps = { label: DecisionLabel | null };

export function DecisionBadge({ label }: DecisionBadgeProps) {
  if (label === null) {
    return (
      <span className="text-muted-foreground text-sm" data-label="none">
        {texts.summary.empty}
      </span>
    );
  }

  const style = DECISION_STYLES[label];
  const Icon = style.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[13px] font-medium",
        style.container,
        style.text
      )}
      data-label={label}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      <span>{texts.decision.labels[label]}</span>
    </span>
  );
}
