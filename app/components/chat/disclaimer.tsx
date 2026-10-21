import { texts } from "@/lib/case/texts";

export function Disclaimer() {
  return (
    <p className="text-[13px] text-muted-foreground" data-testid="disclaimer">
      {texts.decision.disclaimer}
    </p>
  );
}
