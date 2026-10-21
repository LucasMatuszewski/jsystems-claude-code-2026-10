import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Dispatch } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PhotoField } from "@/components/case-form/photo-field";
import { texts } from "@/lib/case/texts";
import { CaseSessionProvider, useCaseSession } from "@/lib/session/context";
import type { CaseSessionAction } from "@/lib/session/reducer";

// Real example photos from the repository root (cwd of vitest is app/).
const EXAMPLES_DIR = path.resolve(
  import.meta.dirname,
  "../../../assets/example-images"
);

function realFile(name: string, type: string): File {
  const buffer = readFileSync(path.join(EXAMPLES_DIR, name));
  return new File([buffer], name, { type });
}

let objectUrlCounter = 0;

beforeEach(() => {
  objectUrlCounter = 0;
  URL.createObjectURL = vi.fn(() => {
    objectUrlCounter += 1;
    return `blob:test-${objectUrlCounter}`;
  });
  if (typeof URL.revokeObjectURL !== "function") {
    URL.revokeObjectURL = vi.fn();
  }
});

afterEach(cleanup);

const createChatId = () => "chat-test";

function renderPhotoField() {
  let dispatchRef: Dispatch<CaseSessionAction> | null = null;

  function DispatchProbe(): null {
    dispatchRef = useCaseSession().dispatch;
    return null;
  }

  const utils = render(
    <CaseSessionProvider createChatId={createChatId}>
      <PhotoField />
      <DispatchProbe />
    </CaseSessionProvider>
  );

  const dispatch = (action: CaseSessionAction) => {
    if (dispatchRef === null) {
      throw new Error("dispatch is not ready");
    }
    dispatchRef(action);
  };

  const input =
    utils.container.querySelector<HTMLInputElement>('input[type="file"]');
  if (input === null) {
    throw new Error("file input not rendered");
  }

  return { dispatch, input, ...utils };
}

describe("PhotoField", () => {
  it("accepts a JPEG that carries a .png name and shows the thumbnail, name and remove button", async () => {
    const { input } = renderPhotoField();
    const user = userEvent.setup({ applyAccept: false });

    await user.upload(input, realFile("laptop-1.png", "image/png"));

    const preview = await screen.findByRole("img", {
      name: texts.form.photo.previewAlt,
    });
    expect(preview).toHaveAttribute("src", "blob:test-1");
    expect(screen.getByText("laptop-1.png")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: texts.form.photo.remove })
    ).toBeVisible();
    expect(
      document.querySelector("#field-photo-error")
    ).not.toBeInTheDocument();
  });

  it("replaces the photo when another file is chosen", async () => {
    const { input } = renderPhotoField();
    const user = userEvent.setup({ applyAccept: false });

    await user.upload(input, realFile("laptop-1.png", "image/png"));
    await screen.findByText("laptop-1.png");

    await user.upload(input, realFile("laptop-2.webp", "image/webp"));

    await screen.findByText("laptop-2.webp");
    expect(screen.queryByText("laptop-1.png")).not.toBeInTheDocument();
  });

  it("removes the photo when Usuń is pressed", async () => {
    const { input } = renderPhotoField();
    const user = userEvent.setup({ applyAccept: false });

    await user.upload(input, realFile("phone-1.jpg", "image/jpeg"));
    await screen.findByRole("img", { name: texts.form.photo.previewAlt });

    await user.click(
      screen.getByRole("button", { name: texts.form.photo.remove })
    );

    expect(
      screen.queryByRole("img", { name: texts.form.photo.previewAlt })
    ).not.toBeInTheDocument();
  });

  it("rejects a file whose content is not an image and shows the format error", async () => {
    const { input } = renderPhotoField();
    const user = userEvent.setup({ applyAccept: false });

    await user.upload(input, realFile("README.md", "text/markdown"));

    expect(
      await screen.findByText(texts.validation.photoFormat)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: texts.form.photo.previewAlt })
    ).not.toBeInTheDocument();
  });

  it("rejects a file above 10 MB and shows the size error", async () => {
    const { input } = renderPhotoField();
    const user = userEvent.setup({ applyAccept: false });
    const file = realFile("phone-1.jpg", "image/jpeg");
    Object.defineProperty(file, "size", { value: 10_485_761 });

    await user.upload(input, file);

    expect(
      await screen.findByText(texts.validation.photoTooLarge)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: texts.form.photo.previewAlt })
    ).not.toBeInTheDocument();
  });

  it("shows the case-type hint only after a case type is chosen, and the format hint always", async () => {
    const { dispatch } = renderPhotoField();

    expect(screen.getByText(texts.form.photo.formatHint)).toBeVisible();
    expect(screen.queryByText(texts.form.photo.hints.return)).toBeNull();
    expect(screen.queryByText(texts.form.photo.hints.complaint)).toBeNull();

    dispatch({ field: "caseType", type: "FORM_CHANGED", value: "return" });
    await waitFor(() =>
      expect(screen.getByText(texts.form.photo.hints.return)).toBeVisible()
    );
    expect(screen.queryByText(texts.form.photo.hints.complaint)).toBeNull();
    expect(screen.getByText(texts.form.photo.formatHint)).toBeVisible();

    dispatch({ field: "caseType", type: "FORM_CHANGED", value: "complaint" });
    await waitFor(() =>
      expect(screen.getByText(texts.form.photo.hints.complaint)).toBeVisible()
    );
    expect(screen.queryByText(texts.form.photo.hints.return)).toBeNull();
  });

  it("exposes the choose button with id field-photo and its accessible name", () => {
    const { container } = renderPhotoField();

    const button = screen.getByRole("button", {
      name: texts.form.photo.choose,
    });
    expect(button).toHaveAttribute("id", "field-photo");
    expect(button).not.toHaveAttribute("aria-invalid");
    expect(container.querySelector("#field-photo")).toBe(button);
  });

  it("marks the choose button invalid and links the error when a photo is rejected", async () => {
    const { input } = renderPhotoField();
    const user = userEvent.setup({ applyAccept: false });

    await user.upload(input, realFile("README.md", "text/markdown"));

    const error = await screen.findByText(texts.validation.photoFormat);
    expect(error).toHaveAttribute("id", "field-photo-error");
    const button = screen.getByRole("button", {
      name: texts.form.photo.choose,
    });
    expect(button).toHaveAttribute("aria-invalid", "true");
    expect(button).toHaveAttribute("aria-describedby", "field-photo-error");
  });

  it("restricts the file input accept attribute to JPEG, PNG and WebP", () => {
    const { input } = renderPhotoField();

    expect(input).toHaveAttribute("type", "file");
    expect(input).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
  });
});
