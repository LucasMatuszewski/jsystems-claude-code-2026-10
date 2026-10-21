import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { CaseSummary } from "@/components/chat/case-summary";
import type { CaseContext } from "@/lib/case/schemas";
import { texts } from "@/lib/case/texts";

afterEach(cleanup);

const caseContext: CaseContext = {
  assessmentDate: "2026-10-21",
  caseType: "complaint",
  category: "laptop",
  daysSincePurchase: 430,
  modelName: "Testowy Model X1",
  purchaseChannel: "in_store",
  purchaseDate: "2025-08-17",
  reason: "Linia na ekranie\nod tygodnia",
};

const REDUCED = "/reduced.jpg";
const ORIGINAL = "/original.jpg";

function renderSummary(
  overrides: Partial<CaseContext> = {},
  original = ORIGINAL
) {
  return render(
    <CaseSummary
      caseContext={{ ...caseContext, ...overrides }}
      currentLabel="needs_info"
      originalPhotoUrl={original}
      reducedPhotoUrl={REDUCED}
    />
  );
}

describe("CaseSummary", () => {
  it("renders the heading and all eight field labels in order", () => {
    renderSummary();
    expect(
      screen.getByRole("heading", { level: 2, name: texts.summary.heading })
    ).toBeInTheDocument();
    const labels = Array.from(document.querySelectorAll("dt")).map((dt) =>
      dt.textContent?.trim()
    );
    expect(labels).toEqual([
      texts.summary.caseType,
      texts.summary.purchaseChannel,
      texts.summary.category,
      texts.summary.modelName,
      texts.summary.purchaseDate,
      texts.summary.daysSincePurchase,
      texts.summary.reason,
      texts.summary.currentDecision,
    ]);
  });

  it("renders the formatted field values", () => {
    const { container } = renderSummary();
    const values = Array.from(container.querySelectorAll("dd")).map((dd) =>
      dd.textContent?.trim()
    );
    expect(values[0]).toBe("Reklamacja");
    expect(values[1]).toBe("Sklep stacjonarny");
    expect(values[2]).toBe("Laptop");
    expect(values[3]).toBe("Testowy Model X1");
    expect(values[4]).toBe("17.08.2025");
    expect(values[5]).toBe("430");
  });

  it("renders both lines of the reason", () => {
    renderSummary();
    expect(screen.getByText(/Linia na ekranie/)).toBeInTheDocument();
    expect(screen.getByText(/od tygodnia/)).toBeInTheDocument();
  });

  it("renders the empty marker when the reason is blank", () => {
    const { container } = renderSummary({ reason: "   " });
    const reasonDt = screen.getByText(texts.summary.reason);
    const reasonDd = reasonDt.nextElementSibling as HTMLElement;
    expect(reasonDd.textContent?.trim()).toBe(texts.summary.empty);
    expect(container).toBeInTheDocument();
  });

  it("renders the current decision badge", () => {
    const { container } = renderSummary();
    expect(container.querySelector('[data-label="needs_info"]')).not.toBeNull();
    expect(
      screen.getByText(texts.decision.labels.needs_info)
    ).toBeInTheDocument();
  });

  it("shows the reduced photo with the photo alt text", () => {
    renderSummary();
    const img = screen.getByAltText(texts.summary.photoAlt);
    expect(img).toHaveAttribute("src", REDUCED);
  });

  it("opens an overlay with the original photo when the photo is clicked", async () => {
    const user = userEvent.setup();
    renderSummary();
    await user.click(
      screen.getByRole("button", { name: texts.summary.photoOpen })
    );
    const dialog = await screen.findByRole("dialog");
    const img = within(dialog).getByAltText(texts.summary.photoAlt);
    expect(img).toHaveAttribute("src", ORIGINAL);
  });
});
