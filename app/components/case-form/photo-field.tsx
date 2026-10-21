"use client";

import { type ChangeEvent, type DragEvent, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { texts } from "@/lib/case/texts";
import {
  CLIENT_PHOTO_MAX_BYTES,
  SNIFF_BYTES,
  sniffImage,
} from "@/lib/image/sniff";
import { useCaseSession } from "@/lib/session/context";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";
const LABEL_ID = "field-photo-label";
const BUTTON_ID = "field-photo";
const ERROR_ID = "field-photo-error";

export function PhotoField(): React.JSX.Element {
  const { state, dispatch } = useCaseSession();
  const { originalPhoto: photo, fieldErrors, formValues } = state;
  const inputRef = useRef<HTMLInputElement>(null);

  const error = fieldErrors.photo;

  let hint: string | null = null;
  if (formValues.caseType === "return") {
    hint = texts.form.photo.hints.return;
  } else if (formValues.caseType === "complaint") {
    hint = texts.form.photo.hints.complaint;
  }

  // Size first (cheap), then content sniffing: `accept` is only a hint.
  const handleFile = useCallback(
    async (file: File | undefined): Promise<void> => {
      if (file === undefined) {
        return;
      }
      if (file.size > CLIENT_PHOTO_MAX_BYTES) {
        dispatch({
          message: texts.validation.photoTooLarge,
          type: "PHOTO_REJECTED",
        });
        return;
      }
      const head = await file.slice(0, SNIFF_BYTES).arrayBuffer();
      if (sniffImage(head).type === "unknown") {
        dispatch({
          message: texts.validation.photoFormat,
          type: "PHOTO_REJECTED",
        });
        return;
      }
      dispatch({
        photo: { file, url: URL.createObjectURL(file) },
        type: "PHOTO_SELECTED",
      });
    },
    [dispatch]
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const input = event.currentTarget;
      handleFile(input.files?.[0])
        .then(() => {
          // Allow choosing the same file again.
          input.value = "";
        })
        .catch(() => undefined);
    },
    [handleFile]
  );

  const handleChoose = useCallback((): void => {
    inputRef.current?.click();
  }, []);

  const handleRemove = useCallback((): void => {
    dispatch({ type: "PHOTO_REMOVED" });
  }, [dispatch]);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>): void => {
      event.preventDefault();
      // A disabled parent fieldset disables the input as well.
      if (inputRef.current?.matches(":disabled")) {
        return;
      }
      handleFile(event.dataTransfer.files[0]).catch(() => undefined);
    },
    [handleFile]
  );

  return (
    <fieldset
      aria-labelledby={LABEL_ID}
      className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0"
    >
      <span className="font-medium text-sm" id={LABEL_ID}>
        {texts.form.photo.label}
      </span>
      {hint === null ? null : (
        <p className="text-[13px] text-muted-foreground">{hint}</p>
      )}
      <p className="text-[13px] text-muted-foreground">
        {texts.form.photo.formatHint}
      </p>
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: drag-and-drop is an enhancement; the button below is the accessible control */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: same drop-target enhancement as above */}
      <div
        className="flex flex-col items-center gap-3 rounded-[12px] border border-dashed border-border p-6 text-center"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {photo === null ? null : (
          <div className="flex w-full items-center gap-3">
            {/* biome-ignore lint/performance/noImgElement: object URL preview, not optimizable by next/image */}
            <img
              alt={texts.form.photo.previewAlt}
              className="max-h-40 max-w-[160px] rounded-[8px] object-contain"
              src={photo.url}
            />
            <div className="flex min-w-0 flex-col items-start gap-1">
              <span className="max-w-full truncate text-sm">
                {photo.file.name}
              </span>
              <Button onClick={handleRemove} type="button" variant="ghost">
                {texts.form.photo.remove}
              </Button>
            </div>
          </div>
        )}
        <Button
          aria-describedby={error === undefined ? undefined : ERROR_ID}
          aria-invalid={error === undefined ? undefined : true}
          id={BUTTON_ID}
          onClick={handleChoose}
          type="button"
          variant="outline"
        >
          {texts.form.photo.choose}
        </Button>
        <p className="text-[13px] text-muted-foreground">
          {texts.form.photo.dropHint}
        </p>
        <input
          accept={ACCEPTED_TYPES}
          className="sr-only"
          onChange={handleChange}
          ref={inputRef}
          tabIndex={-1}
          type="file"
        />
      </div>
      {error === undefined ? null : (
        <p className="text-[13px] text-destructive" id={ERROR_ID}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
