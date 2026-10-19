---
title: Speech-to-Text Models for Polish - Handy Computer Analysis
date: 2026-10-19
tags:
  - ai/speech-to-text
  - ai/models
  - polish-nlp
  - handy-computer
  - whisper
  - nemo
---

# Speech-to-Text Models for Polish: Comprehensive Analysis for Handy Computer

## 1. Executive Summary & Core Findings

This research analyzes Automatic Speech Recognition (ASR) models for the Polish language, focusing on models available in the open-source **Handy Computer** (`cjpais/Handy`, v0.9.8 with the unified `transcribe-cpp` GGUF engine).

### Top Recommendations at a Glance

1. **Top Recommendation for Polish (Accuracy + Speed Champion):**
   - **Model:** `Canary 1B v2` (`nvidia/canary-1b-v2`, default quant: `Q5_K_M`)
   - **Why:** Delivers the lowest error rate among NVIDIA models at **6.64% WER on FLEURS Polish** (beating Parakeet TDT). In Handy catalog benchmarks, its speed score is **81** (slightly faster than Parakeet TDT at 79), while only taking ~836 MB VRAM. Also supports native direct translation into English (`translate: true`).
2. **Top Alternative for Polish Dictation (Zero Hallucination Transducer):**
   - **Model:** `Parakeet TDT 0.6B v3` (`nvidia/parakeet-tdt-0.6b-v3`, default quant: `Q8_0`)
   - **Why:** FastConformer-TDT non-autoregressive architecture achieves **7.28% MLS / 7.31% FLEURS WER** and completely avoids pause/silence hallucination loops.
3. **Best for Complex Syntax, Punctuation & Literary Polish:**
   - **Model:** `Whisper Large v3 Turbo` (`openai/whisper-large-v3-turbo`, default quant: `Q8_0`)
   - **Why:** 809M parameters with 4 decoder layers instead of 32. Because Polish is a well-represented high-resource language in Whisper's corpus, Turbo preserves ~98% of Large-v3 accuracy while cutting latency by over 3x and using only ~809 MB VRAM.
4. **Highest Raw Word-Level Accuracy (for clean, single-language dictation):**
   - **Model:** `Cohere Transcribe` (`CohereLabs/cohere-transcribe-03-2026`, default quant: `Q5_K_M`)
   - **Why:** 2.0B parameter enterprise Conformer architecture. Top-rated accuracy score in Handy's catalog (92/100). Requires setting the language explicitly to Polish (`pl`) because it lacks automatic language detection.
5. **Best for Direct Polish-to-English Speech Translation (Single-Step):**
   - **Model:** `Canary 1B v2` (`nvidia/canary-1b-v2`, default quant: `Q5_K_M`)
   - **Why:** 6.64% WER on FLEURS Polish with native translation encoder-decoder heads. However, when using Handy's LLM post-processing feature, two-stage translation (Direct Polish ASR + LLM) outperforms native single-step speech translation.

---

## 2. Handy Computer: Architecture & Model Catalog Audit

Handy Computer (`handy.computer`) transitioned in 2026 to a unified runtime: **`transcribe-cpp`** (GGUF / ggml format), replacing earlier fragmented ONNX and raw Whisper runtimes. All models are distributed via Hugging Face (`handy-computer/*`) and mirrors (`blob.handy.computer`).

The catalog contains **16 model variants that explicitly support Polish (`pl`)**:

| Model Slug | Base Architecture / Model | Parameters | Speed Score | Accuracy Score | Capabilities | Default Quant & Size |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `cohere-transcribe-03-2026` | Cohere ASR (`CohereLabs`) | 2.0B | 63 | **92** | Offline, no timestamps | `Q5_K_M` (1.77 GB) |
| `Qwen3-ASR-1.7B` | Qwen3 ASR (`Qwen`) | 2.0B | 38 | 90 | Offline, lang-detect | `Q5_K_M` (1.57 GB) |
| `whisper-large-v3` | Whisper (`OpenAI`) | 1.5B | 23 | 89 | Timestamps, translate, lang-detect | `Q5_K_M` (1.00 GB) |
| `Fun-ASR-MLT-Nano-2512` | FunASR (`FunAudioLLM`) | 985M | 68 | 89 | Offline, 31 languages | `Q8_0` (891 MB) |
| `parakeet-tdt-0.6b-v3` | FastConformer-TDT (`NVIDIA`) | 600M | **79** | 88 | Token timestamps, lang-detect | `Q8_0` (740 MB) |
| `canary-1b-v2` | Conformer Enc-Dec (`NVIDIA`) | 1.0B | **81** | 88 | Native translation, 25 EU langs | `Q5_K_M` (836 MB) |
| `whisper-large-v3-turbo` | Whisper Turbo (`OpenAI`) | 809M | 35 | 88 | Segment timestamps, lang-detect | `Q8_0` (809 MB) |
| `Qwen3-ASR-0.6B` | Qwen3 ASR (`Qwen`) | 782M | 63 | 87 | Offline, lang-detect | `Q8_0` (850 MB) |
| `whisper-large-v2` | Whisper (`OpenAI`) | 1.5B | 23 | 84 | Timestamps, translate, lang-detect | `Q5_K_M` (1.00 GB) |
| `whisper-medium` | Whisper (`OpenAI`) | 764M | 42 | 84 | Timestamps, translate, lang-detect | `Q8_0` (832 MB) |
| `whisper-large` (v1) | Whisper (`OpenAI`) | 1.5B | 23 | 83 | Timestamps, translate, lang-detect | `Q5_K_M` (1.00 GB) |
| `nemotron-3.5-asr-streaming-0.6b`| FastConformer-RNNT (`NVIDIA`) | 600M | **84** | 82 | **Live streaming**, token timestamps | `Q8_0` (751 MB) |
| `whisper-small` | Whisper (`OpenAI`) | 242M | 78 | 80 | Timestamps, translate, lang-detect | `Q8_0` (242 MB) |
| `whisper-base` | Whisper (`OpenAI`) | 73M | 99 | 71 | Timestamps, translate, lang-detect | `Q8_0` (73 MB) |
| `parakeet-primeline` | FastConformer-TDT | 600M | 79 | 67 | Fine-tuned for German; poor PL | `Q8_0` (740 MB) |
| `whisper-tiny` | Whisper (`OpenAI`) | 38M | 100 | 61 | Timestamps, translate, lang-detect | `Q8_0` (38 MB) |

---

## 3. Empirical Benchmarks & Academic Evidence for Polish

### 3.1. BIGOS V2 Benchmark (NeurIPS 2024)
The primary academic authority on Polish speech recognition is the **BIGOS V2 benchmark** (*Benchmark Intended Grouping of Open Speech Corpora for Polish ASR*, M. Junczyk, NeurIPS 2024 Datasets and Benchmarks Track). It evaluates models across 24 curated Polish corpora (over 600 evaluation runs):

- **Read vs. Spontaneous Speech Disparity:**
  - On read speech (**BIGOS V2** - clean audio, audiobooks, parliamentary readings): commercial median WER was **12.96%**, free open-source median WER was **15.47%**. Top performers reached **2.10% WER**.
  - On spontaneous/conversational speech (**PELCRA for BIGOS** - interviews, natural dialogues): commercial median WER jumped to **29.90%**, free open-source median WER reached **34.18%**.
- **Model Family Standings:**
  - **Whisper Large (v1, v2, v3)** achieved the lowest overall WER among open-source models across both read and conversational Polish.
  - **NVIDIA NeMo Conformer / Multilingual** proved remarkably efficient, achieving competitive accuracy with far lower compute requirements.
  - **The Whisper Hallucination Finding:** The paper explicitly highlighted that Whisper exhibits hallucination loops during Polish speech under two specific conditions: very short audio bursts with rapid speech, and long recordings containing prolonged pauses or slowly pronounced words.

### 3.2. Google FLEURS & Multilingual LibriSpeech (MLS) Benchmarks
Standardized academic benchmark results on the Polish test splits:

| Model Architecture | FLEURS Polish WER (`pl_pl`) | MLS Polish WER | Architecture Type | Hallucination Risk |
| :--- | :---: | :---: | :--- | :--- |
| **Whisper Large v3** | ~5.4% - 5.7% | ~6.1% | Autoregressive Enc-Dec | Moderate to High on pauses |
| **Whisper Large v3 Turbo** | ~6.2% | ~6.9% | Autoregressive (4 dec layers) | Moderate |
| **Canary 1B v2** | **6.64%** | **8.77%** | Conformer Enc-Dec | Low |
| **Parakeet TDT 0.6B v3** | **7.31%** | **7.28%** | FastConformer-TDT | **Zero (Non-autoregressive)** |
| **Whisper Medium** | ~7.8% | ~8.9% | Autoregressive Enc-Dec | Moderate |
| **Whisper Small** | ~11.2% | ~12.5% | Autoregressive Enc-Dec | Moderate |
| **Facebook MMS 1B** | ~8.1% | ~9.4% | Wav2Vec2 / CTC | Zero |

---

## 4. Architectural Deep Dive: Which Model Fits Polish Best?

### 4.1. NVIDIA Parakeet TDT 0.6B v3 (The Dictation Champion)
- **Mechanism:** Uses a Token-and-Duration Transducer (TDT). Unlike standard RNN-T or Whisper autoregressive decoders, TDT predicts both the token and its time duration simultaneously.
- **Why it shines for Polish desktop dictation:**
  - **No silence looping:** When you hesitate, pause to think, or take a breath, Whisper often hallucinates repetitive phrases or phantom subtitles. Parakeet simply pauses.
  - **Speed:** Non-autoregressive decoding makes it roughly 4 times faster than Whisper Large.
  - **Diacritics & Inflection:** Trained on extensive European datasets covering 25 languages including Polish. Handles complex Slavic morphological endings reliably.

### 4.2. OpenAI Whisper Large v3 vs. Large v3 Turbo
- **Large v3:** The gold standard for text formatting and diacritic fidelity. It understands sentence structure, capitalizes properly, and generates natural punctuation. However, on local hardware, it is sluggish (speed score 23) and consumes substantial resources.
- **Large v3 Turbo:** Slashes decoder layers from 32 to 4 while preserving the full encoder. For low-resource languages, Turbo degrades noticeably. But for Polish, which is well-represented in Whisper training data, the WER drop is marginal (<1 p.p.). Turbo delivers the rich punctuation of Whisper without the heavy latency penalty.

### 4.3. Cohere Transcribe (03-2026)
- **Mechanism:** 2.0B parameter Conformer optimized strictly for minimizing WER on 14 selected global languages (including Polish).
- **Pros:** Highest accuracy score in Handy (92). Exceptional handling of specialized and enterprise terminology.
- **Critical Caveat:** Does not support automatic language detection. If selected, Handy must have the language explicitly set to Polish (`pl`); running it in `auto` mode degrades accuracy or defaults to English.

### 4.4. NVIDIA Canary 1B v2
- **Mechanism:** Multi-task encoder-decoder with specialized prompt tokens for transcription and translation across 25 European languages.
- **Pros:** Excellent Polish recognition (6.64% FLEURS) combined with native direct translation into English, German, French, and Spanish.

---

## 5. Polish Transcription vs. Translation Workflows

> [!TIP] Post-Processing Prompts
> For copyable post-processing prompts configured for Handy (including developer vocabulary lists, safe punctuation rules, and Polish-to-English translation), see:
> [`../Prompt examples/Handy.computer - transcription prompts.md`](../Prompt%20examples/Handy.computer%20-%20transcription%20prompts.md)


When translating Polish speech into English, there are two distinct workflows:

```
Workflow A: Native End-to-End ASR Translation (Single-Step)
Speech (PL) ---> [ Canary 1B v2 / Whisper Large v3 ] ---> English Text

Workflow B: Direct ASR + LLM Post-Processing (Two-Stage - Recommended)
Speech (PL) ---> [ Parakeet TDT / Turbo / Cohere (PL) ] ---> Clean PL Text ---> [ LLM Prompt ] ---> Idiomatic EN Text
```

### Why Workflow B (Two-Stage) is Superior
1. **Preservation of Proper Names and Technical Terms:** Native speech-to-text translation frequently mistranslates Polish surnames, company names (e.g. Edukey), and technical dev terms (e.g. Tailwind, PayloadCMS, Encore).
2. **Grammar & Tone Control:** An LLM post-processing step (such as Azure OpenAI `gpt-6-luna-sweden` or similar models configured in Handy) can follow strict system prompts: preserving punctuation, maintaining developer terminology, and producing natural phrasing.
3. **Model Decoupling:** You can use the fastest, most reliable Polish transcription model (`Parakeet TDT 0.6B v3` or `Whisper Large v3 Turbo`) without being restricted to models that support the `translate` capability flag.

---

## 6. Hardware Optimization for Dell Vostro 7500 (GTX 1650 4GB VRAM)

Your local workstation features an Intel i7-10750H CPU and an NVIDIA GTX 1650 GPU with **4GB of VRAM**:

1. **VRAM Safety:**
   - `Parakeet TDT 0.6B v3` (`Q8_0`): **740 MB** -> Optimal. Fits comfortably in VRAM, leaves plenty of room for display server and background apps.
   - `Whisper Large v3 Turbo` (`Q8_0`): **809 MB** -> Optimal. Fast and compact.
   - `Canary 1B v2` (`Q5_K_M`): **836 MB** -> Easily fits.
   - `Cohere Transcribe` (`Q5_K_M`): **1.77 GB** -> Fits, but takes ~45% of available VRAM.
   - `Whisper Large v3` (`Q5_K_M`): **1.00 GB** -> Fits, but computation latency on GTX 1650 Turing compute units is noticeable (~2.5-3x slower than Turbo).

2. **Crucial Configuration Fix for Handy:**
   - In your current Handy settings (`~/.local/share/com.pais.handy/settings_store.json`), the configured model was:
     `selected_model = handy-computer/parakeet-unified-en-0.6b-gguf/parakeet-unified-en-0.6b-Q8_0.gguf`
   - **This is an English-only model.** Attempting to dictate Polish into `parakeet-unified-en` forces phoneme collision and produces garbled text.
   - To fix, switch the active model in Handy to `parakeet-tdt-0.6b-v3` or `whisper-large-v3-turbo`.

---

## 7. Actionable Decision Matrix

| Your Priority | Recommended Model | Recommended Quant | Language Setting | Key Benefit |
| :--- | :--- | :---: | :---: | :--- |
| **Instant dictation & zero pause-hallucinations** | `parakeet-tdt-0.6b-v3` | `Q8_0` | `auto` or `pl` | Instant response, never loops on silence |
| **Best natural punctuation & formatted Polish** | `whisper-large-v3-turbo` | `Q8_0` | `auto` or `pl` | High grammatical polish, 3.5x faster than Large-v3 |
| **Highest enterprise transcription accuracy** | `cohere-transcribe-03-2026` | `Q5_K_M` | **`pl` (mandatory)** | Top score (92), maximum vocabulary coverage |
| **Direct speech-to-English translation (no LLM)** | `canary-1b-v2` | `Q5_K_M` | `pl` -> `en` | Native multilingual translation |
| **Live real-time streaming display** | `nemotron-3.5-asr-streaming-0.6b`| `Q8_0` | `auto` or `pl` | Words appear as you speak (80-320ms latency) |


---

## 8. Deep-Dive: Nemotron 3.5 Streaming vs Parakeet v3 vs Canary 1B v2

### 8.1. Nemotron Streaming 3.5 (`nvidia/nemotron-3.5-asr-streaming-0.6b`)
- **Architecture:** FastConformer-RNNT (chunked causal streaming, 600M parameters).
- **Polish Status:** Classified in NVIDIA tier 2 (*Broad-coverage*), whereas English, German, French, and Spanish are in tier 1 (*Production-ready*).
- **Empirical Polish WER:**
  - **FLEURS (`pl_pl`):** **21.53% WER**
  - **Multilingual LibriSpeech (MLS Polish):** **16.31% WER**
  - **Common Voice Polish:** **26.85% WER**
  - **VoxPopuli Polish:** **35.35% WER**
- **Evaluation & Verdict:** Because it uses causal attention (limited lookahead for real-time streaming), it cannot look ahead at the remainder of the sentence. In Polish, which is heavily inflected with 7 grammatical cases and rich verb conjugation, lack of right-context lookahead causes frequent morphological ending errors (~21.5% WER). Use it only if live visual feedback while speaking is mandatory; do not use it for high-accuracy dictation.

### 8.2. Parakeet TDT 0.6B v3 (`nvidia/parakeet-tdt-0.6b-v3`) & Why Handy Labels it "Legacy"
- **The "Legacy" Label Explained:** In Handy v0.8.x, models ran on an ONNX runtime (`transcribe-rs`) using the folder name `parakeet-tdt-0.6b-v3-int8`. In Handy v0.9.6+, the application migrated completely to `transcribe-cpp` (native GGUF format). Any old ONNX folder left on disk is classified as `RETIRED_ONNX_MODELS` ("Retired / Legacy"), prompting the user to delete it. **The model itself is fully modern and actively supported**: its GGUF replacement is `handy-computer/parakeet-tdt-0.6b-v3-gguf`.
- **Empirical Polish WER:**
  - **FLEURS (`pl_pl`):** **7.31% WER** (nearly 3x more accurate than Nemotron Streaming!)
  - **Multilingual LibriSpeech (MLS Polish):** **7.28% WER**
- **Evaluation & Verdict:** FastConformer-TDT (Token-and-Duration Transducer) decodes tokens and durations simultaneously. It runs 5x-10x faster than Whisper Large, completely eliminates silence hallucination loops, and handles Polish inflections with low error rates. The best daily dictation engine for Polish.

### 8.3. Canary 1B v2 (`nvidia/canary-1b-v2`)
- **Architecture:** Conformer Encoder-Decoder with Transformer decoder (1.0B parameters), trained on 1.7M hours of multilingual speech (*Granary* corpus).
- **Empirical Polish WER:**
  - **FLEURS (`pl_pl`):** **6.64% WER** (the lowest error rate among all three NVIDIA models on FLEURS).
  - **Multilingual LibriSpeech (MLS Polish):** **8.77% WER**.
- **Special Capabilities:** Full multi-task model supporting bidirectional speech translation (**Polish <-> English**) natively (`translate: true`), automatic punctuation, and capitalization.
- **Evaluation & Verdict:** Best choice if you want maximum Polish accuracy from an NVIDIA architecture or direct speech-to-English translation without a secondary LLM step. Speed score is 81 (sub-second dictation response).


---

## 9. Best Models for English Speech Recognition (Lowest WER / LibriSpeech / MLS)

In English ASR, clean benchmarks like **LibriSpeech test-clean** are virtually saturated (clustering near 1.2% - 1.5% WER). The frontier of evaluation has moved to the **Hugging Face Open ASR Leaderboard**, which averages performance across noisy, conversational, and acoustic datasets (AMI, Earnings-22, GigaSpeech, TED-LIUM, VoxPopuli).

### 9.1. English Benchmark Comparison

| Model | Architecture | Parameters | LibriSpeech Clean | LibriSpeech Other | Open ASR Mean WER | Handy Speed / Acc | Best Used For |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **IBM Granite Speech 4.1 2B** | Conformer + LLM Backbone | 2.3B | **1.28%** | **2.45%** | **4.90% - 5.33%** (#1 SOTA) | 37 / 92 | Absolute lowest real-world error rate |
| **Cohere Transcribe (03-2026)** | Dedicated Audio Conformer | 2.0B | **1.25%** | **2.50%** | **5.40%** | 63 / 92 | Enterprise accuracy without LLM bloat |
| **NVIDIA Parakeet TDT 1.1B** | FastConformer-TDT | 1.1B | **1.39%** | **2.80%** | ~5.20% (MLS: 4.8%) | 76 / 91 | Maximum throughput with near-SOTA WER |
| **NVIDIA Parakeet Unified EN 0.6B** | FastConformer-RNNT | 0.6B | **1.63%** | **3.11%** | ~6.10% | **79 / 90** | **Handy #1 Recommended:** instant dictation |
| **NVIDIA Parakeet TDT 0.6B v2** | FastConformer-TDT | 0.6B | **1.55%** | **3.05%** | ~5.80% | **85 / 89** | Pure English desktop offline dictation |
| **Canary-Qwen 2.5B** | FastConformer + Qwen LLM | 2.5B | 1.61% | 3.10% | ~5.50% | 40 / 90 | Rich semantic context & complex vocab |
| **OpenAI Whisper Large v3** | Autoregressive Enc-Dec | 1.5B | 1.50% | 3.00% | 5.85% (MLS: 5.2%) | 23 / 89 | Rich literary formatting, but sluggish |
| **OpenAI Whisper Large v3 Turbo** | Autoregressive (4 dec layers)| 809M | 1.80% | 3.50% | 6.40% (MLS: 5.5%) | 35 / 88 | Punctuation-rich Whisper at 3.5x speed |

### 9.2. English Recommendations for Handy Computer

1. **Daily Push-to-Talk Dictation (Instant & Hallucination-Free):**
   - **`Parakeet Unified EN 0.6B`** (`Q8_0`, ~731 MB): Ranked #1 in Handy for good reason. Latency is virtually imperceptible (<200ms), WER is ~1.6% clean / 3.1% noisy, and silence causes zero phantom text.
   - **Alternative:** **`Parakeet TDT 0.6B v2`** (`Q8_0`): Pure TDT token-and-duration decoding, speed score 85 (even faster than Unified EN).

2. **Absolute Highest Accuracy (Challenging Accents / Technical Vocabulary):**
   - **`Granite Speech 4.1 2B NAR`** (`granite-speech-4.1-2b-nar`, Q5_K_M, ~1.6 GB): Non-autoregressive variant of IBM Granite. Leads the Open ASR leaderboard with sub-5% average real-world error rate.
   - **`Cohere Transcribe (03-2026)`** (Q5_K_M, ~1.77 GB): Best standalone 2B ASR model, 1.25% LibriSpeech clean WER.
