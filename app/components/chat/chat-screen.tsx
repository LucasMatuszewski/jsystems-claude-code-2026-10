"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { texts } from "@/lib/case/texts";

type ChatScreenProps = {
  summary: ReactNode;
  summaryToggleLabel: ReactNode;
  conversation: ReactNode;
  input: ReactNode;
};

export function ChatScreen({
  summary,
  summaryToggleLabel,
  conversation,
  input,
}: ChatScreenProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
      <Collapsible className="w-full min-w-0 lg:hidden">
        <CollapsibleTrigger className="flex w-full min-w-0 items-center justify-between gap-2 rounded-md border px-4 py-3 text-left text-sm font-medium">
          <span className="min-w-0 break-words">
            {texts.summary.toggle}
            {summaryToggleLabel}
          </span>
          <ChevronDown
            aria-hidden
            className="size-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180"
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">{summary}</CollapsibleContent>
      </Collapsible>
      <aside className="hidden w-80 shrink-0 lg:block">{summary}</aside>
      <section className="flex min-w-0 flex-1 flex-col">
        {conversation}
        {input}
      </section>
    </div>
  );
}
