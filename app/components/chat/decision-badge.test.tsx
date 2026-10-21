import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DecisionBadge } from "@/components/chat/decision-badge";
import { DECISION_STYLES } from "@/components/chat/decision-styles";
import type { DecisionLabel } from "@/lib/case/constants";
import { texts } from "@/lib/case/texts";

afterEach(cleanup);

const LABELS: DecisionLabel[] = [
  "accepted",
  "rejected",
  "needs_info",
  "escalated",
];

describe("DecisionBadge", () => {
  it.each(LABELS)("renders the Polish text and data-label for %s", (label) => {
    const { container } = render(<DecisionBadge label={label} />);
    expect(screen.getByText(texts.decision.labels[label])).toBeInTheDocument();
    const root = container.querySelector("[data-label]");
    expect(root).toHaveAttribute("data-label", label);
  });

  it("uses a distinct container and text class pair per label", () => {
    const pairs = LABELS.map((label) => {
      const { container, unmount } = render(<DecisionBadge label={label} />);
      const root = container.querySelector("[data-label]") as HTMLElement;
      const textEl = screen.getByText(texts.decision.labels[label]);
      const pair = `${root.className}|${textEl.className}`;
      unmount();
      return pair;
    });
    expect(new Set(pairs).size).toBe(LABELS.length);
  });

  it("uses distinct style entries per label", () => {
    const containers = new Set(LABELS.map((l) => DECISION_STYLES[l].container));
    const texts_ = new Set(LABELS.map((l) => DECISION_STYLES[l].text));
    expect(containers.size).toBe(LABELS.length);
    expect(texts_.size).toBe(LABELS.length);
  });

  it("renders the empty marker with data-label none when label is null", () => {
    const { container } = render(<DecisionBadge label={null} />);
    expect(screen.getByText(texts.summary.empty)).toBeInTheDocument();
    expect(container.querySelector('[data-label="none"]')).not.toBeNull();
  });
});
