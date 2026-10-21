import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/chat/route";
import { streamDecisionTurn } from "@/lib/ai/decision-agent";
import { errorEnvelopeSchema } from "@/lib/case/errors";

// Pre-model validation only: the decision agent is mocked.
vi.mock("@/lib/ai/decision-agent", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/ai/decision-agent")>();
  return { ...actual, streamDecisionTurn: vi.fn() };
});

const URL = "http://localhost/api/chat";

function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw" }).format(
    new Date()
  );
}
function daysAgo(n: number): string {
  const d = new Date(`${today()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const returnAnalysis = {
  accessoriesVisible: false,
  confidence: "medium",
  equipmentVisible: "Smartfon.",
  imageUsable: "yes",
  matchesCategory: "yes",
  matchesModel: "uncertain",
  observations: [],
  packagingVisible: false,
  protectiveFilms: "absent",
  resaleableAsNew: "uncertain",
  resaleableReasons: [],
  safetyHazards: [],
  seals: "not_visible",
  signsOfUse: [],
  unusableReason: null,
  variant: "return",
};

function caseContext(overrides: Record<string, unknown> = {}) {
  return {
    assessmentDate: today(),
    caseType: "return",
    category: "smartphone",
    daysSincePurchase: 9,
    modelName: "Testowy Model X1",
    purchaseChannel: "online",
    purchaseDate: daysAgo(9),
    reason: "",
    ...overrides,
  };
}

const submission = {
  id: "m1",
  metadata: { kind: "case-submission" },
  parts: [{ text: "Przesłano zgłoszenie.", type: "text" }],
  role: "user",
};
const assistantMsg = (id: string) => ({
  id,
  parts: [{ state: "done", text: "Odpowiedź.", type: "text" }],
  role: "assistant",
});
const followUp = (id: string, text = "Pytanie?") => ({
  id,
  metadata: { kind: "follow-up" },
  parts: [{ text, type: "text" }],
  role: "user",
});

function body(overrides: Record<string, unknown> = {}) {
  return {
    caseContext: caseContext(),
    id: "chat-1",
    imageAnalysis: returnAnalysis,
    messages: [submission],
    ...overrides,
  };
}

function jsonRequest(payload: unknown, headers: Record<string, string> = {}) {
  return new Request(URL, {
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
    headers: { "content-type": "application/json", ...headers },
    method: "POST",
  });
}

async function expectEnvelope(
  response: Response,
  status: number,
  code: string
) {
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("no-store");
  const parsed = errorEnvelopeSchema.safeParse(await response.json());
  expect(parsed.success).toBe(true);
  if (parsed.success) {
    expect(parsed.data.error.code).toBe(code);
  }
}

describe("POST /api/chat pre-model validation", () => {
  beforeEach(() => {
    vi.mocked(streamDecisionTurn).mockReset();
    vi.mocked(streamDecisionTurn).mockResolvedValue(new Response("ok"));
  });

  it("413 when content-length exceeds 2 MiB", async () => {
    const res = await POST(
      jsonRequest(body(), { "content-length": "3000000" })
    );
    await expectEnvelope(res, 413, "REQUEST_TOO_LARGE");
    expect(streamDecisionTurn).not.toHaveBeenCalled();
  });

  it("415 for a non-JSON content type", async () => {
    const res = await POST(
      new Request(URL, {
        body: "x",
        headers: { "content-type": "text/plain" },
        method: "POST",
      })
    );
    await expectEnvelope(res, 415, "UNSUPPORTED_CONTENT_TYPE");
    expect(streamDecisionTurn).not.toHaveBeenCalled();
  });

  it("400 for invalid JSON", async () => {
    await expectEnvelope(
      await POST(jsonRequest("{nope")),
      400,
      "VALIDATION_ERROR"
    );
    expect(streamDecisionTurn).not.toHaveBeenCalled();
  });

  it("400 for a file part in a user message", async () => {
    const withFile = {
      ...followUp("m3"),
      parts: [
        { text: "Zdjęcie.", type: "text" },
        {
          mediaType: "image/jpeg",
          type: "file",
          url: "data:image/jpeg;base64,AAAA",
        },
      ],
    };
    const res = await POST(
      jsonRequest(
        body({ messages: [submission, assistantMsg("m2"), withFile] })
      )
    );
    await expectEnvelope(res, 400, "VALIDATION_ERROR");
    expect(streamDecisionTurn).not.toHaveBeenCalled();
  });

  it("400 for a 2001-character user text", async () => {
    const res = await POST(
      jsonRequest(
        body({
          messages: [
            submission,
            assistantMsg("m2"),
            followUp("m3", "a".repeat(2001)),
          ],
        })
      )
    );
    await expectEnvelope(res, 400, "VALIDATION_ERROR");
    expect(streamDecisionTurn).not.toHaveBeenCalled();
  });

  it("400 when caseContext.caseType mismatches imageAnalysis.variant", async () => {
    const res = await POST(
      jsonRequest(
        body({
          caseContext: caseContext({
            caseType: "complaint",
            reason: "Telefon sam się wyłącza podczas rozmów i ładowania.",
          }),
        })
      )
    );
    await expectEnvelope(res, 400, "VALIDATION_ERROR");
    expect(streamDecisionTurn).not.toHaveBeenCalled();
  });

  it("400 when the last message is an assistant message", async () => {
    const res = await POST(
      jsonRequest(body({ messages: [submission, assistantMsg("m2")] }))
    );
    await expectEnvelope(res, 400, "VALIDATION_ERROR");
    expect(streamDecisionTurn).not.toHaveBeenCalled();
  });

  it("400 for a future purchase date", async () => {
    const res = await POST(
      jsonRequest(
        body({ caseContext: caseContext({ purchaseDate: daysAgo(-3) }) })
      )
    );
    await expectEnvelope(res, 400, "VALIDATION_ERROR");
    expect(streamDecisionTurn).not.toHaveBeenCalled();
  });

  it("accepts 70 messages and recomputes daysSincePurchase", async () => {
    const messages: unknown[] = [submission];
    for (let i = 1; i < 69; i += 1) {
      messages.push(i % 2 === 1 ? assistantMsg(`a${i}`) : followUp(`u${i}`));
    }
    messages.push(followUp("final"));
    expect(messages).toHaveLength(70);
    const res = await POST(
      jsonRequest(
        body({ caseContext: caseContext({ daysSincePurchase: 999 }), messages })
      )
    );
    expect(res.status).toBe(200);
    expect(streamDecisionTurn).toHaveBeenCalledTimes(1);
    const args = vi.mocked(streamDecisionTurn).mock.calls[0]?.[0];
    expect(args?.caseContext.daysSincePurchase).toBe(9);
    expect(args?.messages).toHaveLength(70);
  });
});
