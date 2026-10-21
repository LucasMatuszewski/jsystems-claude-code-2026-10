import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhotoOverlay } from "@/components/chat/photo-overlay";
import { texts } from "@/lib/case/texts";

afterEach(cleanup);

const REDUCED = "/reduced.jpg";
const ORIGINAL = "/original.jpg";

describe("PhotoOverlay", () => {
  it("shows the original photo in an open dialog", () => {
    render(
      <PhotoOverlay
        onOpenChange={vi.fn()}
        open
        originalPhotoUrl={ORIGINAL}
        reducedPhotoUrl={REDUCED}
      />
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByAltText(texts.summary.photoAlt)).toHaveAttribute(
      "src",
      ORIGINAL
    );
  });

  it("calls onOpenChange(false) on Escape", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PhotoOverlay
        onOpenChange={onOpenChange}
        open
        originalPhotoUrl={ORIGINAL}
        reducedPhotoUrl={REDUCED}
      />
    );
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) from the close button", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PhotoOverlay
        onOpenChange={onOpenChange}
        open
        originalPhotoUrl={ORIGINAL}
        reducedPhotoUrl={REDUCED}
      />
    );
    await user.click(
      screen.getByRole("button", { name: texts.summary.photoClose })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("falls back to the reduced photo when the original is null", () => {
    render(
      <PhotoOverlay
        onOpenChange={vi.fn()}
        open
        originalPhotoUrl={null}
        reducedPhotoUrl={REDUCED}
      />
    );
    expect(screen.getByAltText(texts.summary.photoAlt)).toHaveAttribute(
      "src",
      REDUCED
    );
  });

  it("switches to the reduced photo when the original fails to load", () => {
    render(
      <PhotoOverlay
        onOpenChange={vi.fn()}
        open
        originalPhotoUrl={ORIGINAL}
        reducedPhotoUrl={REDUCED}
      />
    );
    fireEvent.error(screen.getByAltText(texts.summary.photoAlt));
    expect(screen.getByAltText(texts.summary.photoAlt)).toHaveAttribute(
      "src",
      REDUCED
    );
  });
});
