import type { LucideIcon } from "lucide-react";
import { CircleCheck, CircleHelp, CircleX, UserSearch } from "lucide-react";
import type { DecisionLabel } from "@/lib/case/constants";

export const DECISION_STYLES: Record<
  DecisionLabel,
  { icon: LucideIcon; container: string; text: string }
> = {
  accepted: {
    container: "bg-success-bg border border-transparent",
    icon: CircleCheck,
    text: "text-success",
  },
  escalated: {
    container: "bg-promo-bg border border-transparent",
    icon: UserSearch,
    text: "text-promo",
  },
  needs_info: {
    container: "bg-info-bg border border-transparent",
    icon: CircleHelp,
    text: "text-info",
  },
  rejected: {
    container: "bg-background border border-destructive",
    icon: CircleX,
    text: "text-destructive",
  },
};
