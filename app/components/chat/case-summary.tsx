"use client";

import { useCallback, useState } from "react";
import { DecisionBadge } from "@/components/chat/decision-badge";
import { PhotoOverlay } from "@/components/chat/photo-overlay";
import {
  CASE_TYPE_LABELS,
  CATEGORY_LABELS,
  type DecisionLabel,
  PURCHASE_CHANNEL_LABELS,
} from "@/lib/case/constants";
import type { CaseContext } from "@/lib/case/schemas";
import { texts } from "@/lib/case/texts";

type CaseSummaryProps = {
  caseContext: CaseContext;
  reducedPhotoUrl: string;
  originalPhotoUrl: string | null;
  currentLabel: DecisionLabel | null;
};

/** Formats a YYYY-MM-DD string as dd.mm.yyyy without Date parsing. */
function formatPurchaseDate(isoDate: string): string {
  const [year = "", month = "", day = ""] = isoDate.split("-");
  return `${day}.${month}.${year}`;
}

export function CaseSummary({
  caseContext,
  reducedPhotoUrl,
  originalPhotoUrl,
  currentLabel,
}: CaseSummaryProps) {
  const [photoOpen, setPhotoOpen] = useState(false);
  const reason = caseContext.reason.trim();

  const openPhoto = useCallback(() => {
    setPhotoOpen(true);
  }, []);

  const rows: { key: string; label: string; value: React.ReactNode }[] = [
    {
      key: "caseType",
      label: texts.summary.caseType,
      value: CASE_TYPE_LABELS[caseContext.caseType],
    },
    {
      key: "purchaseChannel",
      label: texts.summary.purchaseChannel,
      value: PURCHASE_CHANNEL_LABELS[caseContext.purchaseChannel],
    },
    {
      key: "category",
      label: texts.summary.category,
      value: CATEGORY_LABELS[caseContext.category],
    },
    {
      key: "modelName",
      label: texts.summary.modelName,
      value: caseContext.modelName,
    },
    {
      key: "purchaseDate",
      label: texts.summary.purchaseDate,
      value: formatPurchaseDate(caseContext.purchaseDate),
    },
    {
      key: "daysSincePurchase",
      label: texts.summary.daysSincePurchase,
      value: String(caseContext.daysSincePurchase),
    },
    {
      key: "reason",
      label: texts.summary.reason,
      value:
        reason === "" ? (
          texts.summary.empty
        ) : (
          <span className="whitespace-pre-wrap break-words">{reason}</span>
        ),
    },
    {
      key: "currentDecision",
      label: texts.summary.currentDecision,
      value: <DecisionBadge label={currentLabel} />,
    },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <h2 className="text-base font-semibold break-words">
        {texts.summary.heading}
      </h2>
      <button
        aria-label={texts.summary.photoOpen}
        className="block w-full max-w-60 cursor-zoom-in overflow-hidden rounded-lg"
        onClick={openPhoto}
        type="button"
      >
        {/* biome-ignore lint/performance/noImgElement: user-supplied photo URLs */}
        <img
          alt={texts.summary.photoAlt}
          className="h-auto w-full object-cover"
          src={reducedPhotoUrl}
        />
      </button>
      <dl className="flex flex-col gap-3 text-sm">
        {rows.map((row) => (
          <div className="flex min-w-0 flex-col gap-1" key={row.key}>
            <dt className="text-muted-foreground break-words">{row.label}</dt>
            <dd className="min-w-0 break-words font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
      <PhotoOverlay
        onOpenChange={setPhotoOpen}
        open={photoOpen}
        originalPhotoUrl={originalPhotoUrl}
        reducedPhotoUrl={reducedPhotoUrl}
      />
    </div>
  );
}
