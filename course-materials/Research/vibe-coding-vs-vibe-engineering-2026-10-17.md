# Vibe coding, vibe engineering and software factories

Checked: 2026-10-17. Sources were read directly; interpretations below distinguish proposals, observations and measured results.

## Definitions and dates

- **Vibe coding:** Andrej Karpathy introduced the expression in his [2 February 2025 post](https://x.com/karpathy/status/1886192184808149383). The original sense includes letting the model produce code without closely tracking its implementation. This is narrower than all AI-assisted programming. [Simon Willison's 19 March 2025 discussion](https://simonwillison.net/2025/Mar/19/vibe-coding/) preserves the original context and explains the distinction.
- **Vibe engineering:** Simon Willison explicitly proposed this name on [7 October 2025](https://simonwillison.net/2025/Oct/7/vibe-engineering/) for professional AI-assisted work in which the engineer remains accountable for the result. This establishes a dated proposal, not proof that nobody had used the words earlier. His article was later updated to note the growing use of "agentic engineering". For this course, specification, planning, verification and risk remain human responsibilities.
- Prototype versus production is a useful teaching comparison, not a formal classification of tools. The same agent can support either practice.

## Stages 0-5

The course's table is in [Course Notes - AI in Programming](../Course%20Notes%20-%20AI%20in%20Programming.md), section "Stages of AI-Assisted Programming (0 -> 5)":

| Stage | Name | Human role |
|---|---|---|
| 0 | Manual | Writes the code |
| 1 | Autocomplete | Selects suggestions |
| 2 | Chat | Asks and integrates the response |
| 3 | Agent | Oversees edits, tools and tests |
| 4 | Multi-agent | Splits work and integrates results |
| 5 | Dark factory | Defines specifications and handles escalations |

This is the trainer's teaching taxonomy, not a validated maturity standard. "Dark factory" describes an ambition for autonomous production, not evidence that maintenance or human accountability can be omitted.

## Why Software Factories Fail

- Speaker: **Dex Horthy, HumanLayer**. Channel: **AI Engineer**.
- [Video](https://www.youtube.com/watch?v=Ib5GBkD555M); [official transcript, chapters and article](https://ai.engineer/talks/Ib5GBkD555M-harness-engineering-is-not-enough-why-software-factories-fail).
- Publication: **2026-07-23**, from the official page's VideoObject `uploadDate` (2026-07-23T16:30:06.000Z). The longer distribution title is "Harness Engineering is not Enough: Why Software Factories Fail".
- Horthy argues that rewards for passing tests do not establish long-term maintainability. He describes the cost of returning to code after his team's lights-off experiment. His remedy is earlier human review of requirements, architecture and program design, followed by vertical slices.
- **Evidence limits:** the recovery story is experience; the general training/maintenance argument is his thesis. He explicitly acknowledges the lack of benchmarks proving the broad quality claim. It is not a controlled demonstration that every software factory must fail.
- Relevant chapters: 7:25 (unread code), 11:21 (training signals), 13:11 (architectural costs), 14:48 and 15:59 (earlier decisions and program design).

## Fixing the PR Bottleneck

- Speaker: **Matt Pocock, AIHero / AI Hero**. Channel: **AI Engineer**.
- [Video](https://www.youtube.com/watch?v=LlgiOCmFG_w); [official transcript, chapters and article](https://ai.engineer/talks/LlgiOCmFG_w-fixing-the-pr-bottleneck).
- Publication: **2026-09-26**, from the official page's VideoObject `uploadDate` (2026-09-26T00:07:54.000Z). Some secondary summaries say September 25; the publisher's machine-readable date is used here. The transcript closes with thanks to Paris; the page's event classification says Code 2025. Do not treat that inconsistent classification as the recording date.
- Pocock proposes three layers: deterministic checks, independent agent review, human judgment. He illustrates tests that assert constants, inspect source ordering instead of rendered behavior, or mock away failures. Small public interfaces can encourage behavioral tests. Recurring findings should improve checks and standards.
- **Evidence limits:** these are examples and workflow recommendations, not a measured universal speedup. Suggestions about reviewer commits still require repository authorization. Green CI proves only that the configured checks passed.
- Relevant chapters: 0:01 (brakes), 4:50 (weak tests), 8:22 (interfaces), 11:30 (separate review context), 16:23 (merge risk), 19:44 (retrospective).

## Measurement and cost context

[METR's 10 July 2025 randomized study](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) involved 16 developers and 246 tasks in familiar open-source repositories; AI use increased completion time by 19% in that setting. It does not establish the effect for every developer or for October 2026 tools. The article links a February 2026 follow-up. Course Notes also links Yegor Denisov-Blanch's Stanford-associated observational talks and discusses the productivity J-curve; neither warrants promising a fixed learning period or a universal ROI number.

For pricing comparisons and their dated limitations, see [Price of intelligence, 14 October 2026](price-of-intelligence-2026-10-14.md). The course teaches cost per accepted change, including review and rework, rather than equating cheaper tokens with cheaper delivery. Track lead time, deployment frequency, failures and recovery using [DORA's metric guidance](https://dora.dev/guides/dora-metrics/), alongside the review queue.
