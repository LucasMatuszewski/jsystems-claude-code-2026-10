import { z } from "zod";
import {
  CASE_TYPES,
  CATEGORIES,
  type CaseType,
  MODEL_NAME_MAX,
  MODEL_NAME_MIN,
  PURCHASE_CHANNELS,
  REASON_COMPLAINT_MIN,
} from "./constants";
import { isFutureInWarsaw } from "./days";
import { REASON_MAX, texts } from "./texts";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** True for a YYYY-MM-DD string that is a real calendar date. */
function isCalendarDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }
  const [year = 0, month = 1, day = 1] = value.split("-").map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const isoDateSchema = z
  .string()
  .refine(isCalendarDate, { message: "Invalid calendar date (YYYY-MM-DD)" });

const purchaseDateSchema = z
  .string({ error: texts.validation.purchaseDateRequired })
  .superRefine((value, ctx) => {
    if (!isCalendarDate(value)) {
      ctx.addIssue({
        code: "custom",
        message: texts.validation.purchaseDateRequired,
      });
      return;
    }
    if (isFutureInWarsaw(value)) {
      ctx.addIssue({
        code: "custom",
        message: texts.validation.purchaseDateFuture,
      });
    }
  });

/** Form fields without the cross-field complaint rule. */
export const caseFormBaseSchema = z.object({
  caseType: z.enum(CASE_TYPES, { error: texts.validation.caseTypeRequired }),
  category: z.enum(CATEGORIES, { error: texts.validation.categoryRequired }),
  modelName: z
    .string({ error: texts.validation.modelNameLength })
    .trim()
    .min(MODEL_NAME_MIN, { error: texts.validation.modelNameLength })
    .max(MODEL_NAME_MAX, { error: texts.validation.modelNameLength }),
  purchaseChannel: z.enum(PURCHASE_CHANNELS, {
    error: texts.validation.purchaseChannelRequired,
  }),
  purchaseDate: purchaseDateSchema,
  reason: z
    .string()
    .max(REASON_MAX, { error: texts.validation.reasonTooLong })
    .default(""),
});

type ComplaintRuleInput = { caseType: CaseType; reason: unknown };

/** Complaints need at least 20 trimmed characters in reason. */
function complaintReasonRule(
  value: ComplaintRuleInput,
  ctx: z.RefinementCtx
): void {
  if (value.caseType !== "complaint" || typeof value.reason !== "string") {
    return;
  }
  if (value.reason.trim().length < REASON_COMPLAINT_MIN) {
    ctx.addIssue({
      code: "custom",
      message: texts.validation.reasonComplaintMin,
      path: ["reason"],
    });
  }
}

export const caseFormSchema =
  caseFormBaseSchema.superRefine(complaintReasonRule);
export type CaseFormInput = z.input<typeof caseFormSchema>;
export type CaseForm = z.output<typeof caseFormSchema>;
export type CaseFormField = keyof CaseForm;

export const CASE_FORM_FIELD_ORDER: readonly CaseFormField[] = [
  "caseType",
  "purchaseChannel",
  "category",
  "modelName",
  "purchaseDate",
  "reason",
];

/** First message per field, keyed by top-level field name. */
export function toFieldErrors(
  error: z.ZodError
): Partial<Record<CaseFormField, string>> {
  const errors: Partial<Record<CaseFormField, string>> = {};
  for (const issue of error.issues) {
    const [key] = issue.path;
    if (typeof key !== "string") {
      continue;
    }
    const field = key as CaseFormField;
    if (errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

export const caseContextSchema = caseFormBaseSchema
  .extend({
    assessmentDate: isoDateSchema,
    daysSincePurchase: z.number().int().min(0),
  })
  .superRefine(complaintReasonRule);
export type CaseContext = z.output<typeof caseContextSchema>;

// ---------------------------------------------------------------------------
// Image analysis (ADR-002 §4.1). Model-facing schemas carry no `variant`.
// ---------------------------------------------------------------------------

const yesNoSchema = z.enum(["yes", "no"]);
const yesNoUncertainSchema = z.enum(["yes", "no", "uncertain"]);

const observationSchema = z.object({
  component: z.string().max(80).describe("Component of the equipment seen."),
  description: z.string().max(300).describe("What is visible on it."),
  location: z.string().max(80).describe("Where on the equipment it is seen."),
});

const commonAnalysisShape = {
  confidence: z
    .enum(["high", "medium", "low"])
    .describe("Overall confidence of this analysis."),
  equipmentVisible: z
    .string()
    .max(200)
    .describe("Short description of the equipment visible in the photo."),
  imageUsable: yesNoSchema.describe(
    "Whether the photo is usable for assessment."
  ),
  matchesCategory: yesNoUncertainSchema.describe(
    "Whether the visible equipment matches the declared category."
  ),
  matchesModel: yesNoUncertainSchema.describe(
    "Whether the visible equipment matches the declared model name."
  ),
  observations: z
    .array(observationSchema)
    .max(15)
    .describe("Notable visible details of the equipment."),
  safetyHazards: z
    .array(z.enum(["swollen_battery", "burn_marks", "other"]))
    .max(5)
    .describe(
      "Visible safety hazards, such as a swollen battery or burn marks."
    ),
  unusableReason: z
    .enum([
      "blurry",
      "too_dark",
      "device_not_visible",
      "packaging_only",
      "other",
    ])
    .nullable()
    .describe("Why the photo is unusable, or null when it is usable."),
};

const returnOnlyShape = {
  accessoriesVisible: z.boolean().describe("Whether accessories are visible."),
  packagingVisible: z
    .boolean()
    .describe("Whether the original packaging is visible."),
  protectiveFilms: z
    .enum(["present", "absent", "not_visible"])
    .describe("Whether a protective film is on the screen."),
  resaleableAsNew: yesNoUncertainSchema.describe(
    "Whether the equipment could be resold as new."
  ),
  resaleableReasons: z
    .array(z.string().max(200))
    .max(5)
    .describe("Short reasons for the resaleability assessment."),
  seals: z
    .enum(["intact", "broken", "not_visible"])
    .describe("Whether the seals are intact."),
  signsOfUse: z
    .array(
      z.object({
        location: z.string().max(80).describe("Where the sign of use is seen."),
        type: z
          .enum([
            "scratches",
            "scuffs",
            "fingerprints",
            "dirt",
            "discoloration",
            "worn_surface",
            "other",
          ])
          .describe("Kind of sign of use."),
      })
    )
    .max(15)
    .describe("Visible signs of use on the equipment."),
};

const complaintOnlyShape = {
  damages: z
    .array(
      z.object({
        extent: z.string().max(200).describe("Size or extent of the damage."),
        location: z.string().max(80).describe("Where the damage is located."),
        type: z
          .enum([
            "crack",
            "dead_pixels_or_lines",
            "swelling",
            "corrosion",
            "detached_part",
            "burn_mark",
            "other",
          ])
          .describe("Kind of damage."),
      })
    )
    .max(10)
    .describe("Visible damages of the equipment."),
  damageVisible: yesNoUncertainSchema.describe("Whether damage is visible."),
  externalCauseTraces: z
    .array(
      z.enum([
        "impact_point",
        "radiating_cracks",
        "liquid_residue",
        "corrosion",
        "bent_body",
        "signs_of_opening",
        "other",
      ])
    )
    .max(10)
    .describe("Traces suggesting an external cause of damage."),
  likelyCause: z
    .enum([
      "manufacturing_defect",
      "user_caused",
      "normal_wear",
      "undetermined",
    ])
    .describe("Most likely cause of the problem."),
  likelyCauseRationale: z
    .string()
    .max(400)
    .describe("Short rationale for the likely cause."),
  manufacturingDefectTraces: z
    .array(
      z.enum([
        "defect_without_external_traces",
        "symmetric_or_line_pattern",
        "delamination",
        "other",
      ])
    )
    .max(10)
    .describe("Traces suggesting a manufacturing defect."),
};

export const returnAnalysisModelSchema = z.object({
  ...commonAnalysisShape,
  ...returnOnlyShape,
});

export const complaintAnalysisModelSchema = z.object({
  ...commonAnalysisShape,
  ...complaintOnlyShape,
});

export const returnImageAnalysisSchema = returnAnalysisModelSchema.extend({
  variant: z.literal("return"),
});

export const complaintImageAnalysisSchema = complaintAnalysisModelSchema.extend(
  { variant: z.literal("complaint") }
);

export const imageAnalysisSchema = z.discriminatedUnion("variant", [
  returnImageAnalysisSchema,
  complaintImageAnalysisSchema,
]);
export type ImageAnalysis = z.output<typeof imageAnalysisSchema>;
export type ReturnImageAnalysis = z.output<typeof returnImageAnalysisSchema>;
export type ComplaintImageAnalysis = z.output<
  typeof complaintImageAnalysisSchema
>;

export function analysisModelSchemaFor(caseType: CaseType) {
  return caseType === "complaint"
    ? complaintAnalysisModelSchema
    : returnAnalysisModelSchema;
}

// ---------------------------------------------------------------------------
// Responses and chat request
// ---------------------------------------------------------------------------

export const analyzeResponseSchema = z.object({
  caseContext: caseContextSchema,
  imageAnalysis: imageAnalysisSchema,
});

export const chatRequestSchema = z
  .object({
    caseContext: caseContextSchema,
    id: z.string().min(1).max(100),
    imageAnalysis: imageAnalysisSchema,
    // No cap on message count (ADR-003 D-API4); UI messages are validated in the route.
    messages: z.array(z.unknown()).min(1),
  })
  .superRefine((value, ctx) => {
    if (value.imageAnalysis?.variant !== value.caseContext?.caseType) {
      ctx.addIssue({
        code: "custom",
        message: "imageAnalysis.variant must match caseContext.caseType",
        path: ["imageAnalysis", "variant"],
      });
    }
  });
export type ChatRequest = z.output<typeof chatRequestSchema>;
