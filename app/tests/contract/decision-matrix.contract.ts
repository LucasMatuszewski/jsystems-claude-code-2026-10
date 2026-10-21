import { type APIRequestContext, expect, test } from "@playwright/test";
import { DECISION_LABELS } from "../../lib/case/constants";
import { todayInWarsaw } from "../../lib/case/days";
import {
  setDecisionHistoryInputSchema,
  setDecisionOutputSchema,
} from "../../lib/case/messages";
import {
  type CaseContext,
  caseContextSchema,
  type ImageAnalysis,
  imageAnalysisSchema,
} from "../../lib/case/schemas";
import { complaintAnalysis, returnAnalysis } from "./helpers/analyses";
import {
  type CaseTypeValue,
  formFields,
  type PurchaseChannelValue,
} from "./helpers/case-data";
import {
  assistantMessageFromChunks,
  type ChatBody,
  type ChatResponse,
  followUpMessage,
  hiddenSubmissionMessage,
  postChat,
} from "./helpers/chat";
import { textOf, toolInputs, type UiChunk } from "./helpers/sse";

const CHAT_ID = "chat-decision-matrix-1";
const FOLLOW_UP_TEXT =
  "Opakowanie jest kompletne i nieotwarte, folie i plomby są nienaruszone.";

type Scenario = {
  caseType: CaseTypeValue;
  purchaseChannel: PurchaseChannelValue;
  category: string;
  daysAgo: number;
  reason?: string;
  analysis: ImageAnalysis;
};

/**
 * Hand-written caseContext for a scenario. The form fields come from the
 * shared case-data builder; the server recomputes daysSincePurchase anyway.
 */
function buildCaseContext(scenario: Scenario): CaseContext {
  const context = {
    ...formFields(scenario),
    assessmentDate: todayInWarsaw(),
    daysSincePurchase: scenario.daysAgo,
  };
  const parsed = caseContextSchema.safeParse(context);
  expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
  if (!parsed.success) {
    throw new Error("Hand-written caseContext fails caseContextSchema");
  }
  return parsed.data;
}

/** Validates a hand-written imageAnalysis against the schema (test bug if not). */
function validatedAnalysis(analysis: ImageAnalysis): ImageAnalysis {
  const parsed = imageAnalysisSchema.safeParse(analysis);
  expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
  if (!parsed.success) {
    throw new Error("Hand-written imageAnalysis fails imageAnalysisSchema");
  }
  return parsed.data;
}

/** Shared stream checks: 200, event stream, no error chunk, finish last. */
function expectStreamShape(response: ChatResponse): void {
  expect(response.status, response.raw).toBe(200);
  expect(response.headers["content-type"]).toMatch(/^text\/event-stream/);
  expect(
    response.chunks.some((chunk) => chunk.type === "error"),
    "no error chunk"
  ).toBe(false);
  expect(response.chunks.at(-1)?.type, "finish is the last chunk").toBe(
    "finish"
  );
}

type TurnResult = {
  label: string;
  text: string;
  chunks: UiChunk[];
};

/**
 * Sends a real first chat turn for a hand-written scenario and asserts the
 * stream shape plus TAC-05 (exactly one set_decision, started before any text).
 */
async function runFirstTurn(
  request: APIRequestContext,
  name: string,
  scenario: Scenario
): Promise<TurnResult> {
  const caseContext = buildCaseContext(scenario);
  const imageAnalysis = validatedAnalysis(scenario.analysis);
  const body: ChatBody = {
    caseContext,
    id: CHAT_ID,
    imageAnalysis,
    messages: [hiddenSubmissionMessage()],
  };
  const response = await postChat(request, body);
  expectStreamShape(response);

  const { chunks } = response;
  const calls = toolInputs(chunks, "set_decision");
  expect(calls, "set_decision tool-input-available count").toHaveLength(1);
  const [call] = calls;
  if (call === undefined) {
    throw new Error("No set_decision tool-input-available chunk");
  }
  expect(
    setDecisionHistoryInputSchema.safeParse(call.input).success,
    JSON.stringify(call.input)
  ).toBe(true);

  const toolStartIndex = chunks.findIndex(
    (chunk) =>
      chunk.type === "tool-input-start" && chunk.toolName === "set_decision"
  );
  const firstTextIndex = chunks.findIndex(
    (chunk) => chunk.type === "text-start"
  );
  expect(
    toolStartIndex,
    "set_decision tool-input-start"
  ).toBeGreaterThanOrEqual(0);
  expect(
    firstTextIndex === -1 || toolStartIndex < firstTextIndex,
    "set_decision must start before any text"
  ).toBe(true);

  const input = call.input as { label: unknown };
  const label = String(input.label);
  expect(DECISION_LABELS).toContain(label);
  const text = textOf(chunks);

  console.log(`${name} label: ${label}`);
  console.log(`${name} response text:\n${text}`);
  return { chunks, label, text };
}

// ---------------------------------------------------------------------------
// C-07: decision matrix, policy reasoning on hand-written analyses.
// ---------------------------------------------------------------------------

test.describe("C-07 decision matrix", () => {
  test("C-07 (a) return with a visible scratch and not resaleable as new is rejected under §3 ust. 3", async ({
    request,
  }) => {
    const turn = await runFirstTurn(request, "C-07 (a)", {
      analysis: returnAnalysis({
        observations: [
          {
            component: "tylna obudowa",
            description: "Widoczne rysy na tylnej obudowie.",
            location: "tylna obudowa",
          },
        ],
        resaleableAsNew: "no",
        resaleableReasons: ["Widoczne rysy na tylnej obudowie."],
        signsOfUse: [{ location: "tylna obudowa", type: "scratches" }],
      }),
      caseType: "return",
      category: "smartphone",
      daysAgo: 20,
      purchaseChannel: "in_store",
    });

    expect(turn.label).toBe("rejected");
    expect(turn.text).toMatch(/§\s?3 ust\. 3/);
  });

  test("C-07 (b) complaint with a crack from an impact point does not blame the customer", async ({
    request,
  }) => {
    const turn = await runFirstTurn(request, "C-07 (b)", {
      analysis: complaintAnalysis({
        damages: [
          {
            extent: "pęknięcia rozchodzące się z jednego punktu",
            location: "ekran, lewy górny róg",
            type: "crack",
          },
        ],
        damageVisible: "yes",
        externalCauseTraces: ["impact_point", "radiating_cracks"],
        likelyCause: "user_caused",
        likelyCauseRationale:
          "Widoczny punkt uderzenia, od którego rozchodzą się pęknięcia.",
      }),
      caseType: "complaint",
      category: "smartphone",
      daysAgo: 400,
      purchaseChannel: "online",
      reason: "Ekran pękł i przestał reagować na dotyk w lewym górnym rogu.",
    });

    expect(["rejected", "escalated"]).toContain(turn.label);
    expect(turn.text).not.toMatch(
      /uszkodziłeś|uszkodziłaś|z Twojej winy|Twoja wina/i
    );
  });

  test("C-07 (c) complaint with a line defect and no external traces is accepted with repair or replacement", async ({
    request,
  }) => {
    const turn = await runFirstTurn(request, "C-07 (c)", {
      analysis: complaintAnalysis({
        damages: [
          {
            extent: "pionowa linia przez całą wysokość",
            location: "ekran, środek",
            type: "dead_pixels_or_lines",
          },
        ],
        damageVisible: "yes",
        externalCauseTraces: [],
        likelyCause: "manufacturing_defect",
        likelyCauseRationale:
          "Pionowa linia bez śladów zewnętrznych uszkodzeń wskazuje na wadę fabryczną.",
        manufacturingDefectTraces: [
          "defect_without_external_traces",
          "symmetric_or_line_pattern",
        ],
      }),
      caseType: "complaint",
      category: "laptop",
      daysAgo: 400,
      purchaseChannel: "in_store",
      reason:
        "Na ekranie pojawiła się pionowa linia, laptop nie był upuszczony.",
    });

    expect(turn.label).toBe("accepted");
    expect(turn.text).toMatch(/napraw|wymian/i);
  });

  test("C-07 (d) unusable blurry photo asks for a new photo with tips", async ({
    request,
  }) => {
    const turn = await runFirstTurn(request, "C-07 (d)", {
      analysis: returnAnalysis({
        confidence: "low",
        equipmentVisible: "Nie da się rozpoznać",
        imageUsable: "no",
        matchesCategory: "uncertain",
        unusableReason: "blurry",
      }),
      caseType: "return",
      category: "smartphone",
      daysAgo: 9,
      purchaseChannel: "online",
    });

    expect(turn.label).toBe("needs_info");
    expect(turn.text).toMatch(/Nowe zgłoszenie|nowe zgłoszenie/);
    expect(turn.text).toMatch(/świat|ostr|cał/i);
  });

  test("C-07 (e) clean return inside the window is accepted or escalated", async ({
    request,
  }) => {
    const turn = await runFirstTurn(request, "C-07 (e)", {
      analysis: returnAnalysis(),
      caseType: "return",
      category: "smartphone",
      daysAgo: 9,
      purchaseChannel: "online",
    });

    expect(["accepted", "escalated"]).toContain(turn.label);
  });
});

// ---------------------------------------------------------------------------
// C-08: a missing-evidence first answer is revised after a follow-up.
// ---------------------------------------------------------------------------

test.describe("C-08 decision revision", () => {
  test("C-08 (f) incomplete packaging is revised after the customer confirms it", async ({
    request,
  }) => {
    const scenario: Scenario = {
      analysis: returnAnalysis({
        packagingVisible: false,
        protectiveFilms: "not_visible",
        resaleableAsNew: "uncertain",
        seals: "not_visible",
      }),
      caseType: "return",
      category: "smartphone",
      daysAgo: 20,
      purchaseChannel: "in_store",
      reason: "",
    };
    const first = await runFirstTurn(request, "C-08 (f) first turn", scenario);
    expect(["needs_info", "escalated"]).toContain(first.label);

    const assistant = assistantMessageFromChunks(first.chunks, "m-assistant-1");
    const followUp = followUpMessage("m-follow-1", FOLLOW_UP_TEXT);
    const body: ChatBody = {
      caseContext: buildCaseContext(scenario),
      id: CHAT_ID,
      imageAnalysis: validatedAnalysis(scenario.analysis),
      messages: [hiddenSubmissionMessage(), assistant, followUp],
    };
    const response = await postChat(request, body);
    expectStreamShape(response);

    const calls = toolInputs(response.chunks, "set_decision");
    const changed = calls.find(
      (call) => (call.input as { label?: unknown }).label !== first.label
    );
    expect(
      changed,
      `follow-up set_decision with a label other than ${first.label}`
    ).toBeDefined();
    if (changed === undefined) {
      return;
    }
    const output = response.chunks.find(
      (chunk) =>
        chunk.type === "tool-output-available" &&
        chunk.toolCallId === changed.toolCallId
    );
    expect(
      output,
      "tool-output-available for the follow-up call"
    ).toBeDefined();
    expect(setDecisionOutputSchema.safeParse(output?.output).success).toBe(
      true
    );
    expect(output?.output).toMatchObject({
      previousLabel: first.label,
      recorded: true,
    });

    const followLabel = String((changed.input as { label: unknown }).label);
    console.log(`C-08 (f) first label: ${first.label}`);
    console.log(`C-08 (f) follow-up label: ${followLabel}`);
    console.log(`C-08 (f) follow-up text:\n${textOf(response.chunks)}`);
  });
});
