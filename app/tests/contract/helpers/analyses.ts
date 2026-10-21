import type {
  ComplaintImageAnalysis,
  ReturnImageAnalysis,
} from "../../../lib/case/schemas";

/**
 * Hand-written hypothetical model outputs for policy-reasoning contract tests
 * (ADR-005 §3.2). They describe NO real photo: no image is sent and no
 * /api/analyze call is made. Each builder returns a full object with every
 * field of the variant schema, starting from a clean baseline.
 */

type CommonOverrides = Pick<
  ReturnImageAnalysis,
  | "confidence"
  | "equipmentVisible"
  | "imageUsable"
  | "matchesCategory"
  | "matchesModel"
  | "observations"
  | "safetyHazards"
  | "unusableReason"
>;

type ReturnOverrides = Partial<
  CommonOverrides &
    Pick<
      ReturnImageAnalysis,
      | "accessoriesVisible"
      | "packagingVisible"
      | "protectiveFilms"
      | "resaleableAsNew"
      | "resaleableReasons"
      | "seals"
      | "signsOfUse"
    >
>;

type ComplaintOverrides = Partial<
  CommonOverrides &
    Pick<
      ComplaintImageAnalysis,
      | "damageVisible"
      | "damages"
      | "externalCauseTraces"
      | "likelyCause"
      | "likelyCauseRationale"
      | "manufacturingDefectTraces"
    >
>;

function commonBaseline(): CommonOverrides & {
  equipmentVisible: string;
} {
  return {
    confidence: "high",
    equipmentVisible: "Smartfon",
    imageUsable: "yes",
    matchesCategory: "yes",
    matchesModel: "uncertain",
    observations: [],
    safetyHazards: [],
    unusableReason: null,
  };
}

/** Return-case analysis; defaults describe a clean, resaleable device. */
export function returnAnalysis(
  overrides: ReturnOverrides = {}
): ReturnImageAnalysis {
  return {
    accessoriesVisible: true,
    packagingVisible: true,
    protectiveFilms: "present",
    resaleableAsNew: "yes",
    resaleableReasons: [],
    seals: "intact",
    signsOfUse: [],
    variant: "return",
    ...commonBaseline(),
    ...overrides,
  };
}

/** Complaint-case analysis; defaults describe no visible damage. */
export function complaintAnalysis(
  overrides: ComplaintOverrides = {}
): ComplaintImageAnalysis {
  return {
    damages: [],
    damageVisible: "no",
    externalCauseTraces: [],
    likelyCause: "undetermined",
    likelyCauseRationale: "Brak widocznych uszkodzeń.",
    manufacturingDefectTraces: [],
    variant: "complaint",
    ...commonBaseline(),
    ...overrides,
  };
}
