import { describe, expect, it } from "vitest";
import { createSetDecisionTool } from "./tools";

type Executable = {
  execute: (input: unknown, options: unknown) => Promise<unknown> | unknown;
  inputSchema: { safeParse?: (v: unknown) => { success: boolean } };
};

async function run(
  turn: "first" | "follow-up",
  currentLabel: "accepted" | "rejected" | null,
  input: unknown
) {
  const tool = createSetDecisionTool(
    turn,
    currentLabel
  ) as unknown as Executable;
  return await tool.execute(input, { messages: [], toolCallId: "t1" });
}

describe("createSetDecisionTool execute", () => {
  it("records the first-turn decision", async () => {
    expect(
      await run("first", null, {
        changeReason: null,
        greeting: "Cześć!",
        label: "accepted",
      })
    ).toEqual({ previousLabel: null, reason: null, recorded: true });
  });

  it("records a changed follow-up decision with the previous label", async () => {
    expect(
      await run("follow-up", "accepted", {
        changeReason: "Nowy fakt.",
        greeting: null,
        label: "rejected",
      })
    ).toEqual({ previousLabel: "accepted", reason: null, recorded: true });
  });

  it("does not record an unchanged follow-up decision", async () => {
    expect(
      await run("follow-up", "accepted", {
        changeReason: "Bez zmian.",
        greeting: null,
        label: "accepted",
      })
    ).toEqual({
      previousLabel: "accepted",
      reason: "unchanged",
      recorded: false,
    });
  });
});

describe("createSetDecisionTool input schemas", () => {
  it("first-turn schema rejects greeting null", () => {
    const tool = createSetDecisionTool("first", null);
    const result = (
      tool.inputSchema as unknown as {
        "~standard": { validate: (v: unknown) => unknown };
      }
    )["~standard"].validate({
      changeReason: null,
      greeting: null,
      label: "accepted",
    });
    expect(JSON.stringify(result)).toContain("issues");
  });

  it("follow-up schema rejects changeReason null", () => {
    const tool = createSetDecisionTool("follow-up", "accepted");
    const result = (
      tool.inputSchema as unknown as {
        "~standard": { validate: (v: unknown) => unknown };
      }
    )["~standard"].validate({
      changeReason: null,
      greeting: null,
      label: "rejected",
    });
    expect(JSON.stringify(result)).toContain("issues");
  });
});
