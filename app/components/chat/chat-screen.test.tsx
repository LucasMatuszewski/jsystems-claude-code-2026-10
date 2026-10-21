import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ChatScreen } from "@/components/chat/chat-screen";
import { texts } from "@/lib/case/texts";

afterEach(cleanup);

function renderScreen() {
  return render(
    <ChatScreen
      conversation={<div>Rozmowa slot</div>}
      input={<div>Input slot</div>}
      summary={<div>Summary content</div>}
      summaryToggleLabel={<span>Laptop</span>}
    />
  );
}

describe("ChatScreen", () => {
  it("renders the conversation and input slots", () => {
    renderScreen();
    expect(screen.getByText("Rozmowa slot")).toBeInTheDocument();
    expect(screen.getByText("Input slot")).toBeInTheDocument();
  });

  it("renders a collapsed summary toggle with the accessible name prefix", () => {
    renderScreen();
    const trigger = screen.getByRole("button", {
      name: new RegExp(texts.summary.toggle),
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("expands and shows the summary content on click", async () => {
    const user = userEvent.setup();
    renderScreen();
    const trigger = screen.getByRole("button", {
      name: new RegExp(texts.summary.toggle),
    });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const regionId = trigger.getAttribute("aria-controls") ?? "";
    const region = document.getElementById(regionId);
    expect(region).not.toBeNull();
    expect(
      within(region as HTMLElement).getByText("Summary content")
    ).toBeVisible();
  });
});
