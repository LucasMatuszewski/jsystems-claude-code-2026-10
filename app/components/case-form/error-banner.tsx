import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { texts } from "@/lib/case/texts";

type ErrorBannerProps = {
  onRetry: () => void;
  onDismiss: () => void;
};

/** Submission error banner with a retry action (AC-22). */
export function ErrorBanner({
  onRetry,
  onDismiss,
}: ErrorBannerProps): React.JSX.Element {
  return (
    <div
      className="flex items-start gap-3 rounded-[8px] border border-destructive bg-white p-4 text-destructive"
      role="alert"
    >
      <p className="min-w-0 flex-1 text-sm">{texts.submission.failed}</p>
      <div className="flex shrink-0 items-center gap-1">
        <Button onClick={onRetry} type="button" variant="outline">
          {texts.submission.retry}
        </Button>
        <Button
          aria-label={texts.submission.dismiss}
          onClick={onDismiss}
          size="icon"
          type="button"
          variant="ghost"
        >
          <XIcon aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
