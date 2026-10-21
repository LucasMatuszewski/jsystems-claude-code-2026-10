"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { texts } from "@/lib/case/texts";

type PhotoOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalPhotoUrl: string | null;
  reducedPhotoUrl: string;
};

export function PhotoOverlay({
  open,
  onOpenChange,
  originalPhotoUrl,
  reducedPhotoUrl,
}: PhotoOverlayProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const src =
    originalPhotoUrl !== null && failedUrl !== originalPhotoUrl
      ? originalPhotoUrl
      : reducedPhotoUrl;

  const handleError = useCallback(() => {
    setFailedUrl(originalPhotoUrl);
  }, [originalPhotoUrl]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="flex max-w-[calc(100%-2rem)] flex-col items-center gap-4 sm:max-w-3xl">
        <DialogTitle className="sr-only">{texts.summary.photoAlt}</DialogTitle>
        {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: error event only switches the image source */}
        {/* biome-ignore lint/performance/noImgElement: user-supplied photo URLs */}
        <img
          alt={texts.summary.photoAlt}
          className="max-h-[85vh] max-w-full object-contain"
          onError={handleError}
          src={src}
        />
        <Button onClick={handleClose} type="button" variant="outline">
          {texts.summary.photoClose}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
