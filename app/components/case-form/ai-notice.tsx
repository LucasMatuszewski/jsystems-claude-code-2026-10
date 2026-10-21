import { texts } from "@/lib/case/texts";

export function AiNotice(): React.JSX.Element {
  return (
    <div
      className="rounded-lg bg-info-bg p-4 text-sm text-foreground"
      data-testid="ai-notice"
    >
      {texts.form.aiNotice}
    </div>
  );
}
