"use client";

import { DECISION_STYLES } from "@/components/chat/decision-styles";
import type { DecisionView } from "@/components/chat/decision-view";
import { decisionLabelText } from "@/lib/case/labels";
import { texts } from "@/lib/case/texts";
import { cn } from "@/lib/utils";

type DecisionCardProps = { view: DecisionView };

export function DecisionCard({ view }: DecisionCardProps) {
  const style = DECISION_STYLES[view.label];
  const Icon = style.icon;
  const { previousLabel } = view;

  return (
    <div
      className={cn("flex flex-col gap-2 rounded-[12px] p-4", style.container)}
      data-label={view.label}
      data-testid="decision-card"
    >
      <div className="flex items-center gap-2">
        <Icon aria-hidden className="size-5 shrink-0" />
        <h3 className="font-semibold text-sm">
          {view.isUpdate ? texts.decision.updatedTitle : texts.decision.title}
        </h3>
      </div>
      <p className={cn("font-semibold text-base", style.text)}>
        {decisionLabelText(view.label)}
      </p>
      {view.isUpdate && previousLabel !== null ? (
        <p className="text-sm">
          {`${texts.decision.previousPrefix} ${decisionLabelText(previousLabel)}`}
        </p>
      ) : null}
      {view.isUpdate && view.changeReason ? (
        <p className="text-sm">{view.changeReason}</p>
      ) : null}
      {view.isUpdate ? (
        <p className="text-muted-foreground text-sm">
          {texts.decision.updateReminder}
        </p>
      ) : null}
    </div>
  );
}
