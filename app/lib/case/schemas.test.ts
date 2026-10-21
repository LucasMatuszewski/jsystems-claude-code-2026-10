import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import {
  analysisModelSchemaFor,
  analyzeResponseSchema,
  CASE_FORM_FIELD_ORDER,
  caseContextSchema,
  caseFormSchema,
  chatRequestSchema,
  complaintAnalysisModelSchema,
  complaintImageAnalysisSchema,
  imageAnalysisSchema,
  returnAnalysisModelSchema,
  toFieldErrors,
} from "./schemas";

const baseInput = {
  caseType: "complaint",
  category: "laptop",
  modelName: "Testowy Model X1",
  purchaseChannel: "online",
  purchaseDate: "2026-10-01",
  reason: "Ekran pokazuje pionową linię od tygodnia.",
};

const validReturnSample = {
  accessoriesVisible: true,
  confidence: "high",
  equipmentVisible: "Laptop w otwartej obudowie",
  imageUsable: "yes",
  matchesCategory: "yes",
  matchesModel: "uncertain",
  observations: [
    {
      component: "Obudowa",
      description: "Brak widocznych uszkodzeń",
      location: "góra",
    },
  ],
  packagingVisible: false,
  protectiveFilms: "absent",
  resaleableAsNew: "uncertain",
  resaleableReasons: ["Drobne ślady użytkowania"],
  safetyHazards: [],
  seals: "not_visible",
  signsOfUse: [{ location: "klawiatura", type: "scuffs" }],
  unusableReason: null,
  variant: "return",
};

const validComplaintSample = {
  confidence: "medium",
  damages: [
    {
      extent: "pionowa linia",
      location: "środek panelu",
      type: "dead_pixels_or_lines",
    },
  ],
  damageVisible: "yes",
  equipmentVisible: "Monitor z widoczną linią",
  externalCauseTraces: [],
  imageUsable: "yes",
  likelyCause: "manufacturing_defect",
  likelyCauseRationale: "Linia bez śladów uderzenia.",
  manufacturingDefectTraces: ["symmetric_or_line_pattern"],
  matchesCategory: "yes",
  matchesModel: "yes",
  observations: [
    {
      component: "Panel",
      description: "Pionowa linia",
      location: "środek",
    },
  ],
  safetyHazards: ["other"],
  unusableReason: null,
  variant: "complaint",
};

const validCaseContext = {
  assessmentDate: "2026-10-21",
  caseType: "complaint",
  category: "laptop",
  daysSincePurchase: 20,
  modelName: "Testowy Model X1",
  purchaseChannel: "online",
  purchaseDate: "2026-10-01",
  reason: "Ekran pokazuje pionową linię od tygodnia.",
};

function messages(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `m${index}`,
    parts: [{ text: `wiadomość ${index}`, type: "text" }],
    role: "user",
  }));
}

function zodErrorOf(result: {
  success: boolean;
  error?: z.ZodError;
}): z.ZodError {
  if (result.success || !result.error) {
    throw new Error("expected a failed parse");
  }
  return result.error;
}

function issuePaths(result: { success: boolean; error?: unknown }): string[] {
  if (result.success || !result.error) {
    return [];
  }
  const error = result.error as {
    issues: { path: PropertyKey[]; message: string }[];
  };
  return error.issues.map((issue) => issue.path.map(String).join("."));
}

describe("caseFormSchema", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-21T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("valid input", () => {
    it("parses a valid complaint", () => {
      expect(caseFormSchema.safeParse(baseInput).success).toBe(true);
    });

    it("parses a valid return with an empty reason", () => {
      const result = caseFormSchema.safeParse({
        ...baseInput,
        caseType: "return",
        reason: "",
      });
      expect(result.success).toBe(true);
    });

    it("trims modelName in the output", () => {
      const result = caseFormSchema.parse({
        ...baseInput,
        modelName: "  Ab  ",
      });
      expect(result.modelName).toBe("Ab");
    });
  });

  describe("modelName length", () => {
    it.each([
      ["A", false],
      ["Ab", true],
      ["a".repeat(100), true],
      ["a".repeat(101), false],
      ["   ", false],
    ])("modelName %j valid=%s", (modelName, valid) => {
      const result = caseFormSchema.safeParse({ ...baseInput, modelName });
      expect(result.success).toBe(valid);
      if (!valid) {
        expect(toFieldErrors(zodErrorOf(result)).modelName).toBe(
          "Podaj nazwę lub model sprzętu (min. 2 znaki)"
        );
      }
    });
  });

  describe("required enums", () => {
    it("returns the required messages for null enum fields", () => {
      const result = caseFormSchema.safeParse({
        ...baseInput,
        caseType: null,
        category: null,
        purchaseChannel: null,
      });
      expect(result.success).toBe(false);
      const errors = toFieldErrors(zodErrorOf(result));
      expect(errors.caseType).toBe("Wybierz rodzaj zgłoszenia");
      expect(errors.purchaseChannel).toBe("Wybierz miejsce zakupu");
      expect(errors.category).toBe("Wybierz kategorię sprzętu");
    });

    it("reports all failing fields at once for an all-null input", () => {
      const result = caseFormSchema.safeParse({
        caseType: null,
        category: null,
        modelName: null,
        purchaseChannel: null,
        purchaseDate: null,
        reason: null,
      });
      expect(result.success).toBe(false);
      const errors = toFieldErrors(zodErrorOf(result));
      expect(Object.keys(errors)).toEqual(
        expect.arrayContaining([
          "caseType",
          "purchaseChannel",
          "category",
          "purchaseDate",
          "modelName",
        ])
      );
    });
  });

  describe("purchaseDate", () => {
    it.each([
      ["", "Podaj datę zakupu"],
      ["2026-02-30", "Podaj datę zakupu"],
      ["21.10.2026", "Podaj datę zakupu"],
    ])("rejects %j with purchaseDateRequired", (purchaseDate, message) => {
      const result = caseFormSchema.safeParse({ ...baseInput, purchaseDate });
      expect(result.success).toBe(false);
      expect(toFieldErrors(zodErrorOf(result)).purchaseDate).toBe(message);
    });

    it("accepts today's date", () => {
      const result = caseFormSchema.safeParse({
        ...baseInput,
        purchaseDate: "2026-10-21",
      });
      expect(result.success).toBe(true);
    });

    it("rejects a future date with purchaseDateFuture", () => {
      const result = caseFormSchema.safeParse({
        ...baseInput,
        purchaseDate: "2026-10-22",
      });
      expect(toFieldErrors(zodErrorOf(result)).purchaseDate).toBe(
        "Data zakupu nie może być z przyszłości"
      );
    });

    it("accepts the next day when it is already the 22nd in Warsaw", () => {
      vi.setSystemTime(new Date("2026-10-21T22:30:00Z"));
      const result = caseFormSchema.safeParse({
        ...baseInput,
        purchaseDate: "2026-10-22",
      });
      expect(result.success).toBe(true);
    });

    it("rejects the next day while it is still the 21st in Warsaw", () => {
      vi.setSystemTime(new Date("2026-10-21T21:30:00Z"));
      const result = caseFormSchema.safeParse({
        ...baseInput,
        purchaseDate: "2026-10-22",
      });
      expect(toFieldErrors(zodErrorOf(result)).purchaseDate).toBe(
        "Data zakupu nie może być z przyszłości"
      );
    });
  });

  describe("reason", () => {
    it("requires at least 20 trimmed characters for a complaint", () => {
      const nineteen = "a".repeat(19);
      const result = caseFormSchema.safeParse({
        ...baseInput,
        reason: nineteen,
      });
      expect(toFieldErrors(zodErrorOf(result)).reason).toBe(
        "Opisz problem (min. 20 znaków)"
      );
      expect(issuePaths(result)).toContain("reason");
    });

    it("accepts exactly 20 characters for a complaint", () => {
      const result = caseFormSchema.safeParse({
        ...baseInput,
        reason: "a".repeat(20),
      });
      expect(result.success).toBe(true);
    });

    it("ignores surrounding spaces when counting complaint characters", () => {
      const result = caseFormSchema.safeParse({
        ...baseInput,
        reason: `   ${"a".repeat(19)}   `,
      });
      expect(toFieldErrors(zodErrorOf(result)).reason).toBe(
        "Opisz problem (min. 20 znaków)"
      );
    });

    it("accepts an empty reason for a return", () => {
      const result = caseFormSchema.safeParse({
        ...baseInput,
        caseType: "return",
        reason: "",
      });
      expect(result.success).toBe(true);
    });

    it("keeps the reason untrimmed in the output", () => {
      const reason = `  ${"a".repeat(25)}  `;
      const result = caseFormSchema.parse({ ...baseInput, reason });
      expect(result.reason).toBe(reason);
    });

    it.each([
      "complaint",
      "return",
    ])("accepts 2000 characters and rejects 2001 for %s", (caseType) => {
      const ok = caseFormSchema.safeParse({
        ...baseInput,
        caseType,
        reason: "a".repeat(2000),
      });
      expect(ok.success).toBe(true);

      const tooLong = caseFormSchema.safeParse({
        ...baseInput,
        caseType,
        reason: "a".repeat(2001),
      });
      expect(toFieldErrors(zodErrorOf(tooLong)).reason).toBe(
        "Opis może mieć maksymalnie 2000 znaków"
      );
    });
  });

  it("CASE_FORM_FIELD_ORDER matches the AC-01 order without photo", () => {
    expect([...CASE_FORM_FIELD_ORDER]).toEqual([
      "caseType",
      "purchaseChannel",
      "category",
      "modelName",
      "purchaseDate",
      "reason",
    ]);
  });
});

describe("caseContextSchema", () => {
  it("parses a valid context", () => {
    expect(caseContextSchema.safeParse(validCaseContext).success).toBe(true);
  });

  it("rejects a negative daysSincePurchase", () => {
    const result = caseContextSchema.safeParse({
      ...validCaseContext,
      daysSincePurchase: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer daysSincePurchase", () => {
    const result = caseContextSchema.safeParse({
      ...validCaseContext,
      daysSincePurchase: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it("accepts zero daysSincePurchase", () => {
    const result = caseContextSchema.safeParse({
      ...validCaseContext,
      daysSincePurchase: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe("imageAnalysisSchema", () => {
  it("parses a full valid return sample", () => {
    expect(imageAnalysisSchema.safeParse(validReturnSample).success).toBe(true);
  });

  it("parses a full valid complaint sample", () => {
    expect(imageAnalysisSchema.safeParse(validComplaintSample).success).toBe(
      true
    );
  });

  it("rejects a complaint sample labelled as return", () => {
    const result = imageAnalysisSchema.safeParse({
      ...validComplaintSample,
      variant: "return",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a return sample missing seals", () => {
    const { seals: _seals, ...withoutSeals } = validReturnSample;
    expect(imageAnalysisSchema.safeParse(withoutSeals).success).toBe(false);
  });

  it("rejects observations with 16 items", () => {
    const [observation] = validComplaintSample.observations;
    const result = imageAnalysisSchema.safeParse({
      ...validComplaintSample,
      observations: Array.from({ length: 16 }, () => observation),
    });
    expect(result.success).toBe(false);
  });

  it("accepts unusableReason null", () => {
    const result = imageAnalysisSchema.safeParse({
      ...validReturnSample,
      imageUsable: "no",
      unusableReason: "blurry",
    });
    expect(result.success).toBe(true);
    expect(
      imageAnalysisSchema.safeParse({
        ...validReturnSample,
        unusableReason: null,
      }).success
    ).toBe(true);
  });
});

describe("analysis model schemas", () => {
  it("returnAnalysisModelSchema has no variant key", () => {
    expect("variant" in returnAnalysisModelSchema.shape).toBe(false);
  });

  it("analysisModelSchemaFor returns the matching model schema", () => {
    expect(analysisModelSchemaFor("complaint")).toBe(
      complaintAnalysisModelSchema
    );
    expect(analysisModelSchemaFor("return")).toBe(returnAnalysisModelSchema);
  });

  it("complaintImageAnalysisSchema requires variant complaint", () => {
    expect(
      complaintImageAnalysisSchema.safeParse(validComplaintSample).success
    ).toBe(true);
  });
});

describe("chatRequestSchema", () => {
  const validRequest = {
    caseContext: validCaseContext,
    id: "chat-1",
    imageAnalysis: validComplaintSample,
    messages: messages(70),
  };

  it("accepts 70 messages (no cap)", () => {
    expect(chatRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it("rejects an empty messages array", () => {
    const result = chatRequestSchema.safeParse({
      ...validRequest,
      messages: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a complaint context with a return analysis", () => {
    const result = chatRequestSchema.safeParse({
      ...validRequest,
      imageAnalysis: { ...validReturnSample, variant: "return" },
    });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("imageAnalysis.variant");
  });

  it("rejects an empty id", () => {
    const result = chatRequestSchema.safeParse({ ...validRequest, id: "" });
    expect(result.success).toBe(false);
  });
});

describe("analyzeResponseSchema", () => {
  it("parses caseContext and imageAnalysis", () => {
    const result = analyzeResponseSchema.safeParse({
      caseContext: validCaseContext,
      imageAnalysis: validComplaintSample,
    });
    expect(result.success).toBe(true);
  });
});
