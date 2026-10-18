# GPT Sol pricing: input, output and cache reads

Checked: **18 October 2026**. USD per million tokens, direct provider Standard API pricing for short prompts. These are API token prices, not subscription prices or subscription usage multipliers.

## Verified prices

| Model | Uncached input | Cached input read | Output | Cache read / input |
|---|---:|---:|---:|---:|
| GPT-5.6 Sol | $4.00 | $0.40 | $20.00 | 10% |
| GPT-6 Sol | $2.00 | $0.20 | $10.00 | 10% |
| GPT-6.1 Sol | $2.00 | $0.10 | $10.00 | 5% |

GPT-6 and GPT-6.1 Sol input and output list prices match. Only the cache-read rate is halved in that comparison; total savings depend on the workload. Above 272K input tokens, both models apply higher long-context rates to the whole request. Processing tiers and regional processing can also change the price, so compare the same tier and context range. Sources: [GPT-6 Sol](https://developers.openai.com/api/docs/models/gpt-6-sol), [GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol).

GPT-6 Sol costs half as much as the verified **GPT-5.6 Sol** for uncached input, cache reads and output. The GPT-5.6 Sol model page describes its current rates as promotional, available at least through 21 November 2026. Source: [GPT-5.6 Sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol).

The [Arena text leaderboard](https://arena.ai/leaderboard/chat/text), dated 15 October and inspected on 18 October, lists both models at **$2 / $10** input/output. This capture does not reproduce a twofold difference between them. It does not show cache-read pricing in that column.

The earlier report that Arena showed GPT-6.1 Sol at twice GPT-6 Sol's price conflicts with the verified provider prices. Treat that earlier display as a pricing error, not a model-price increase. The current leaderboard no longer shows that difference. This check confirms the current values; it does not establish when Arena changed its earlier display.

## Read rates separately

Cache **reads** and cache **writes** are different billable operations. A 5% cache-read price does not mean a 95% discount on output, writes or the complete task. Cost comparisons should record model ID, provider, processing tier, prompt size and cached-token share.
