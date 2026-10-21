import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { errorResponse } from "@/lib/case/errors";
import { texts } from "@/lib/case/texts";
import { CaseSessionProvider, useCaseSession } from "@/lib/session/context";
import type { CaseSessionAction } from "@/lib/session/reducer";
import { FormScreen } from "./form-screen";

// Photo reduction needs createImageBitmap and canvas, which jsdom does not provide.
vi.mock("@/lib/image/reduce", () => ({
  reducePhoto: async (file: Blob) => ({ blob: file, height: 1, width: 1 }),
}));

const MODEL_NAME = "Testowy Model X1";
const PHOTO = new File(["photo-bytes"], "phone-1.jpg", { type: "image/jpeg" });
const SUBMIT = /Wyślij zgłoszenie/;

const SEED_ACTIONS: CaseSessionAction[] = [
  { field: "caseType", type: "FORM_CHANGED", value: "return" },
  { field: "purchaseChannel", type: "FORM_CHANGED", value: "online" },
  { field: "category", type: "FORM_CHANGED", value: "smartphone" },
  { field: "modelName", type: "FORM_CHANGED", value: MODEL_NAME },
  { field: "purchaseDate", type: "FORM_CHANGED", value: "2026-10-12" },
  { field: "reason", type: "FORM_CHANGED", value: "" },
  { photo: { file: PHOTO, url: "blob:original" }, type: "PHOTO_SELECTED" },
];

/** Dispatches the valid form state once on mount. */
function Seeder(): null {
  const { dispatch } = useCaseSession();
  useEffect(() => {
    for (const action of SEED_ACTIONS) {
      dispatch(action);
    }
  }, [dispatch]);
  return null;
}

const createTestChatId = () => "test-chat";

function renderScreen() {
  const startChat = vi.fn();
  const onDeadline = vi.fn();
  render(
    <CaseSessionProvider createChatId={createTestChatId}>
      <Seeder />
      <FormScreen onDeadline={onDeadline} startChat={startChat} />
    </CaseSessionProvider>
  );
  return { onDeadline, startChat };
}

beforeEach(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => undefined;
  Element.prototype.scrollIntoView = () => undefined;
  globalThis.ResizeObserver = class {
    observe = () => undefined;
    unobserve = () => undefined;
    disconnect = () => undefined;
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("FormScreen", () => {
  it("disables all controls and replaces the submit button with the processing steps while processing", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => undefined))
    );
    renderScreen();

    await user.click(await screen.findByRole("button", { name: SUBMIT }));

    await waitFor(() => expect(screen.getByRole("list")).toBeInTheDocument());
    expect(
      screen.queryByRole("button", { name: SUBMIT })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: texts.form.modelName.label })
    ).toBeDisabled();
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }
  });

  it("shows the error banner and keeps the entered model name after a 502", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => errorResponse("ANALYSIS_FAILED"))
    );
    renderScreen();

    await user.click(await screen.findByRole("button", { name: SUBMIT }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      texts.submission.failed
    );
    expect(
      screen.getByRole("textbox", { name: texts.form.modelName.label })
    ).toHaveValue(MODEL_NAME);
    expect(screen.getByRole("button", { name: SUBMIT })).toBeEnabled();
  });
});
