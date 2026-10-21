"use client";

import { Button } from "@/components/ui/button";
import { texts } from "@/lib/case/texts";
import { cn } from "@/lib/utils";

export type FailedMarkerProps = {
  kind: "failed" | "interrupted" | "stopped" | "too-large";
  onRetry?: () => void;
};

export function FailedMarker({ kind, onRetry }: FailedMarkerProps) {
  if (kind === "too-large") {
    return (
      <div className="text-sm text-destructive">
        {texts.errors.REQUEST_TOO_LARGE}
      </div>
    );
  }

  const isFailed = kind === "failed";
  const isError = kind !== "stopped";

  return (
    <div
      className={cn(
        "flex flex-col items-end gap-1 text-sm",
        isError ? "text-destructive" : "text-muted-foreground"
      )}
      role={isFailed ? "alert" : undefined}
    >
      {isFailed ? (
        <>
          <p className="font-medium">{texts.chat.failedMarker}</p>
          <p>{texts.chat.followUpFailed}</p>
        </>
      ) : (
        <p>{texts.chat.interrupted}</p>
      )}
      {onRetry ? (
        <Button onClick={onRetry} size="sm" type="button" variant="ghost">
          {texts.chat.retry}
        </Button>
      ) : null}
    </div>
  );
}
