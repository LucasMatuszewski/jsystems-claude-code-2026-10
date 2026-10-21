import { CheckIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { texts } from "@/lib/case/texts";
import { cn } from "@/lib/utils";

type ProcessingStepsProps = { step: "analyzing" | "deciding" };

const STEPS = [
  { key: "analyzing", label: texts.processing.analyzing },
  { key: "deciding", label: texts.processing.deciding },
] as const;

/** Two-step progress list shown while the submission is processing (AC-18). */
export function ProcessingSteps({
  step,
}: ProcessingStepsProps): React.JSX.Element {
  const activeIndex = STEPS.findIndex((item) => item.key === step);

  return (
    <ol aria-live="polite" className="m-0 flex flex-col gap-3 p-0">
      {STEPS.map((item, index) => {
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;
        return (
          <li
            aria-current={isActive ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 text-sm",
              isActive
                ? "font-semibold text-foreground"
                : "text-muted-foreground"
            )}
            key={item.key}
          >
            {isActive ? <Spinner className="text-foreground" /> : null}
            {isDone ? (
              <CheckIcon aria-hidden="true" className="size-4" />
            ) : null}
            <span>{item.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
