import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CATEGORY_LABELS, MODEL_NAME_MAX } from "@/lib/case/constants";
import { todayInWarsaw } from "@/lib/case/days";
import { REASON_MAX, texts } from "@/lib/case/texts";
import { CaseSessionProvider, useCaseSession } from "@/lib/session/context";
import { CaseForm } from "./case-form";
import { FieldError } from "./field-error";

const LONG_REASON = "Ekran pęka bez wyraźnej przyczyny";

/** Stand-in for P3-04's PhotoField: focus target #field-photo and its error text. */
function PhotoStub({
  seedPhoto = false,
}: {
  seedPhoto?: boolean;
}): React.JSX.Element {
  const { state, dispatch } = useCaseSession();
  useEffect(() => {
    if (seedPhoto) {
      dispatch({
        photo: { file: new File(["x"], "a.jpg"), url: "blob:x" },
        type: "PHOTO_SELECTED",
      });
    }
  }, [dispatch, seedPhoto]);
  return (
    <>
      <button id="field-photo" type="button">
        photo
      </button>
      <FieldError id="field-photo-error" message={state.fieldErrors.photo} />
    </>
  );
}

const createTestChatId = () => "test-chat";

function renderForm(
  props: Partial<React.ComponentProps<typeof CaseForm>> = {},
  photoField: React.ReactNode = <PhotoStub />
) {
  const onValidSubmit = vi.fn();
  const utils = render(
    <CaseSessionProvider createChatId={createTestChatId}>
      <CaseForm
        onValidSubmit={onValidSubmit}
        photoField={photoField}
        {...props}
      />
    </CaseSessionProvider>
  );
  return { ...utils, onValidSubmit };
}

const SUBMIT = /Wyślij zgłoszenie/;

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
  vi.restoreAllMocks();
});

describe("CaseForm", () => {
  it("renders the labels in AC-01 order with the photo slot last", () => {
    renderForm();
    const anchors = [
      screen.getByText(texts.form.caseType.label),
      screen.getByText(texts.form.purchaseChannel.label),
      screen.getByText(texts.form.category.label),
      screen.getByText(texts.form.modelName.label),
      screen.getByText(texts.form.purchaseDate.label),
      screen.getByText(texts.form.reason.labelReturn),
      screen.getByText("photo"),
    ];
    for (let index = 0; index < anchors.length - 1; index += 1) {
      const current = anchors[index];
      const next = anchors[index + 1];
      if (current === undefined || next === undefined) {
        throw new Error("missing anchor");
      }
      expect(
        current.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    }
  });

  it("offers two case types and two purchase channels with nothing preselected", () => {
    renderForm();
    expect(screen.getByRole("radio", { name: "Zwrot" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Reklamacja" })).not.toBeChecked();
    expect(
      screen.getByRole("radio", { name: "Sklep internetowy" })
    ).not.toBeChecked();
    expect(
      screen.getByRole("radio", { name: "Sklep stacjonarny" })
    ).not.toBeChecked();
    expect(
      screen.getByText(texts.form.caseType.descriptions.return)
    ).toBeVisible();
    expect(
      screen.getByText(texts.form.caseType.descriptions.complaint)
    ).toBeVisible();
  });

  it("lists the category options in AC-04 order", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("combobox"));
    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual([
      CATEGORY_LABELS.smartphone,
      CATEGORY_LABELS.laptop,
      CATEGORY_LABELS.tablet,
      CATEGORY_LABELS.desktop,
      CATEGORY_LABELS.monitor,
      CATEGORY_LABELS.tv,
      CATEGORY_LABELS.audio,
      CATEGORY_LABELS.console,
      CATEGORY_LABELS.other,
    ]);
  });

  it("shows the AI notice verbatim", () => {
    renderForm();
    expect(screen.getByText(texts.form.aiNotice)).toBeVisible();
    expect(screen.getByText(texts.app.intro)).toBeVisible();
  });

  it("shows every error, focuses the case type and does not submit when everything is empty", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { onValidSubmit } = renderForm();

    await user.click(screen.getByRole("button", { name: SUBMIT }));

    expect(screen.getByText(texts.validation.caseTypeRequired)).toBeVisible();
    expect(
      screen.getByText(texts.validation.purchaseChannelRequired)
    ).toBeVisible();
    expect(screen.getByText(texts.validation.categoryRequired)).toBeVisible();
    expect(screen.getByText(texts.validation.modelNameLength)).toBeVisible();
    expect(
      screen.getByText(texts.validation.purchaseDateRequired)
    ).toBeVisible();
    expect(screen.getByText(texts.validation.photoRequired)).toBeVisible();
    await waitFor(() =>
      expect(document.getElementById("field-caseType")).toHaveFocus()
    );
    expect(onValidSubmit).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("shows the required marker for complaints and the optional label for returns", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("radio", { name: "Reklamacja" }));

    const complaintTextarea = screen.getByLabelText(/Opisz problem/);
    expect(complaintTextarea).toHaveAttribute("aria-required", "true");
    expect(screen.getByText(texts.form.requiredMarker)).toBeInTheDocument();

    await user.type(complaintTextarea, "abc");
    await user.click(screen.getByRole("radio", { name: "Zwrot" }));

    const returnTextarea = screen.getByLabelText(texts.form.reason.labelReturn);
    expect(returnTextarea).not.toHaveAttribute("aria-required", "true");
    expect(returnTextarea).toHaveValue("abc");
    expect(
      screen.queryByText(texts.form.requiredMarker)
    ).not.toBeInTheDocument();
  });

  it("caps the reason at REASON_MAX and shows the counter for the current value", async () => {
    const user = userEvent.setup();
    renderForm();
    const textarea = screen.getByLabelText(texts.form.reason.labelReturn);
    expect(textarea).toHaveAttribute("maxLength", String(REASON_MAX));
    await user.type(textarea, "abc");
    expect(screen.getByText(`3 / ${REASON_MAX}`)).toBeVisible();
  });

  it("caps the model name at MODEL_NAME_MAX and shows the AC-05 message for a single character", async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByLabelText(texts.form.modelName.label);
    expect(input).toHaveAttribute("maxLength", String(MODEL_NAME_MAX));
    await user.type(input, "A");
    await user.click(screen.getByRole("button", { name: SUBMIT }));
    expect(screen.getByText(texts.validation.modelNameLength)).toBeVisible();
  });

  it("limits the purchase date to today in Warsaw and shows the AC-06 message for a future date", async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByLabelText(texts.form.purchaseDate.label);
    expect(input).toHaveAttribute("max", todayInWarsaw());
    fireEvent.change(input, { target: { value: "2999-01-01" } });
    await user.click(screen.getByRole("button", { name: SUBMIT }));
    expect(screen.getByText(texts.validation.purchaseDateFuture)).toBeVisible();
  });

  it("removes the case type error on change after a failed submit without another submit", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: SUBMIT }));
    expect(screen.getByText(texts.validation.caseTypeRequired)).toBeVisible();
    await user.click(screen.getByRole("radio", { name: "Zwrot" }));
    expect(
      screen.queryByText(texts.validation.caseTypeRequired)
    ).not.toBeInTheDocument();
  });

  it("calls onValidSubmit once and shows no errors when every field is valid", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { onValidSubmit } = renderForm({}, <PhotoStub seedPhoto />);

    await user.click(screen.getByRole("radio", { name: "Reklamacja" }));
    await user.click(screen.getByRole("radio", { name: "Sklep internetowy" }));
    await user.click(screen.getByRole("combobox"));
    await user.click(
      screen.getByRole("option", { name: CATEGORY_LABELS.laptop })
    );
    await user.type(
      screen.getByLabelText(texts.form.modelName.label),
      "Laptop Pro"
    );
    fireEvent.change(screen.getByLabelText(texts.form.purchaseDate.label), {
      target: { value: "2024-05-01" },
    });
    fireEvent.change(screen.getByLabelText(/Opisz problem/), {
      target: { value: LONG_REASON },
    });

    await user.click(screen.getByRole("button", { name: SUBMIT }));

    expect(onValidSubmit).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll('[id$="-error"]')).toHaveLength(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("disables every control inside a disabled fieldset", () => {
    renderForm({ disabled: true });
    expect(document.querySelector("fieldset[disabled]")).not.toBeNull();
    expect(screen.getByRole("button", { name: SUBMIT })).toBeDisabled();
    expect(screen.getByLabelText(texts.form.modelName.label)).toBeDisabled();
    expect(screen.getByLabelText(texts.form.purchaseDate.label)).toBeDisabled();
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
    }
  });

  it("renders the footer instead of the submit button when a footer is provided", () => {
    renderForm({ footer: <p>Footer content</p> });
    expect(
      screen.queryByRole("button", { name: SUBMIT })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Footer content")).toBeVisible();
  });
});
