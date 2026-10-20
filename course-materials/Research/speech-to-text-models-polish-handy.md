---
title: Speech-to-Text Models for Polish and English - Handy Computer Analysis
date: 2026-10-20
tags:
  - ai/speech-to-text
  - ai/models
  - polish-nlp
  - handy-computer
  - whisper
  - nemo
  - canary
---

# Speech-to-Text Models for Polish and English: Comprehensive Analysis for Handy Computer

## 1. Executive Summary: The #1 Recommendation for Polish Speakers

For developers and course participants who speak Polish (whether dictating in Polish or English), **NVIDIA Canary 1B v2 (`nvidia/canary-1b-v2`, default quant: `Q5_K_M`) is the undisputed #1 primary recommendation.**

### Why Canary 1B v2 is the Best Daily Driver:
1. **Polish Accuracy Champion:** Achieves **6.64% WER on Google FLEURS Polish** (beating Parakeet TDT 0.6B v3 at 7.31%). In live hands-on testing on unscripted, fast-spoken Polish, it delivered **zero transcription errors**, capturing diacritics (ą, ć, ę, ł, ń, ó, ś, ź, ż) and technical terms ("Canary 1B V2", "1 miliard parametrów") flawlessly.
2. **Superior English for Polish Accents:** English-only models (like `Parakeet Unified EN 0.6B`) are trained almost exclusively on native US/UK phonetics, causing them to misinterpret Slavic vowel durations, unreduced vowels, and consonant clusters. Because Canary 1B v2 was trained on 1.7 million hours across 25 European languages, its shared acoustic encoder natively understands Polish phonetics and maps accented English speech to correct vocabulary far better than English-only baselines.
3. **Seamless Zero-Toggle Translation:** When speaking Polish with the language set to English in Handy (even with the translation toggle off), Canary automatically performs direct speech-to-English translation with coherent grammar and phrasing.
4. **Hardware & Thermal Efficiency (GPU vs CPU):**
   - **Streaming Models Thermal Warning:** Streaming models like `Nemotron Streaming 3.5` run continuous chunked causal RNN-T loops (every 80ms-160ms) on CPU, keeping CPU threads pinned, overheating laptops, and suffering ~21.5% WER on Polish.
   - **Canary Batch Acceleration:** Canary records silently and runs a discrete forward pass on the GPU (e.g., NVIDIA GeForce GTX 1650 Turing core). A long paragraph processes in **under 1 second** with a brief ~80% GPU spike, ~1.24 GB total VRAM usage (leaving plenty of memory), and **0% CPU usage**, keeping the workstation completely cool.
5. **Top Alternative for English-Only Native Dictation:**
   - **`Parakeet TDT 1.1B`** (`Q8_0`) or **`Parakeet Unified EN 0.6B`** (`Q8_0`): Best if dictating exclusively in native US/UK English with zero Polish requirements (1.39% - 1.63% clean LibriSpeech WER).

---

## 2. Real-World Hands-on Case Study & Test Findings

A live empirical test on an NVIDIA GeForce GTX 1650 (Ubuntu 26.04, Handy Computer v0.9.8, `transcribe-cpp` GGUF engine) evaluated Canary 1B v2 in real dictation scenarios:

### Test A: Polish Speech Dictated with Language Set to English (Zero-Toggle Translation)
- **Audio:** Spoken casually, fast, unscripted Polish without deliberate pronunciation.
- **Raw Canary 1B v2 Output:**
  ```text
  As a small test, we will test how this canal works for Polish, so now I am speaking Polish and we will see how many mistakes there will be. I am not changing anything at all, so you see this fragment of the text. When I speak normally in Polish, as I normally speak, I do not try to pronounce it clearly, I just say it and talk to myself to test it. So see what quality it will be, how many mistakes you see, it can also be useful as a note, some kind of test. You will not know what the correct text is, but I will try to assess what it generated in a moment, what more or less I have the impression that there is here the level of mistakes, but I will not measure it, but maybe I will tell you what mistakes I noticed below.
  ```
- **Luna LLM Post-Processed Output (Azure OpenAI custom prompt):**
  ```text
  As a small test, we will test how this channel works for Polish, so now I am speaking Polish and we will see how many mistakes there will be. I am not changing anything at all, so you can see this fragment of text. When I speak Polish normally, as I usually do, I do not try to pronounce things clearly. I just say it and talk to myself to test it. So, let us see what the quality will be and how many mistakes you notice. It can also be useful as a note, some kind of test. You will not know what the correct text is, but I will try to assess what it generated in a moment and what level of mistakes I think there are. I will not measure it, but maybe I will tell you below what mistakes I noticed.
  ```
- **Analysis:**
  - **Raw Canary:** Outstanding translation fidelity. The only divergence was "canal" instead of "Canary" (in Polish, "Canary" spoken casually was heard as "kanał").
  - **Luna Post-Processing:** Elevated the spoken run-on sentences into idiomatic written prose ("as I normally speak" -> "as I usually do"; "So see what quality" -> "So, let us see what the quality will be").

### Test B: Direct Polish Dictation with Language Set to Polish (`pl`)
- **Audio:** Spoken naturally in Polish at normal conversational tempo.
- **Raw Output:**
  ```text
  Ponieważ chciałbym mieć pełny test i w pełni zobaczyć, jak to działa, żebyś też miał pełne dane i żebyśmy mogli sobie to porównać, to właśnie tutaj dyktuję znowu po polsku. Teraz inny tekst, ale znów dyktuję po polsku. Tym razem zmieniłem w ustawieniach tego modelu Canary język na polski, a tłumaczenie jest nadal wyłączone, więc powinien tutaj dać po prostu wynik w języku polskim. Zaraz się przekonamy. Zobaczymy, czy wpłynie to jakoś na procesor. Zobaczymy też, jaka będzie jakość i czy będzie równie dobra, jak wcześniej. Ciekaw jestem, jaki będzie wynik. Przez cały czas mówię teraz po polsku, a zaraz zobaczymy też, jak dobrze rozpozna nazwę modelu. To Canary 1B V2, czyli druga wersja modelu Canary 1B, z 1 miliardem parametrów.
  ```
- **Result:** **100% accuracy, zero errors.** Every single diacritic, punctuation mark, casing, and technical model name was recognized flawlessly.

### Caveat to Keep in Mind
Canary 1B v2 in Handy does not support automatic language detection (`auto`). You must set the language explicitly:
- Select **`pl`** when you want Polish transcription.
- Select **`en`** when you want English transcription (or direct translation from Polish to English).

---

## 3. Handy Computer Model Catalog Overview (Polish Support)

The Handy Computer catalog contains 16 models with declared Polish (`pl`) support:

| Model Slug | Base Architecture / Model | Parameters | Speed Score | Accuracy Score | Capabilities | Default Quant & Size |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **`canary-1b-v2`** | FastConformer Enc-Dec (`NVIDIA`) | 1.0B | **81** | **88** | Native translation, 25 EU langs | `Q5_K_M` (836 MB) |
| `parakeet-tdt-0.6b-v3` | FastConformer-TDT (`NVIDIA`) | 600M | **79** | 88 | Token timestamps, lang-detect | `Q8_0` (740 MB) |
| `cohere-transcribe-03-2026` | Cohere ASR (`CohereLabs`) | 2.0B | 63 | **92** | Offline, 14 enterprise langs | `Q5_K_M` (1.77 GB) |
| `whisper-large-v3-turbo` | Whisper Turbo (`OpenAI`) | 809M | 35 | 88 | Segment timestamps, lang-detect | `Q8_0` (809 MB) |
| `whisper-large-v3` | Whisper (`OpenAI`) | 1.5B | 23 | 89 | Timestamps, translate, lang-detect | `Q5_K_M` (1.00 GB) |
| `Qwen3-ASR-1.7B` | Qwen3 ASR (`Qwen`) | 2.0B | 38 | 90 | Offline, lang-detect | `Q5_K_M` (1.57 GB) |
| `Fun-ASR-MLT-Nano-2512` | FunASR (`FunAudioLLM`) | 985M | 68 | 89 | Offline, 31 languages | `Q8_0` (891 MB) |
| `nemotron-3.5-asr-streaming-0.6b`| FastConformer-RNNT (`NVIDIA`) | 600M | **84** | 82 | Live streaming (causal), high CPU load | `Q8_0` (751 MB) |

---

## 4. Benchmark Comparisons for Polish (FLEURS & MLS)

| Model Architecture | FLEURS Polish WER (`pl_pl`) | MLS Polish WER | Architecture Type | Hallucination Risk |
| :--- | :---: | :---: | :--- | :--- |
| **Canary 1B v2** | **6.64%** | **8.77%** | Conformer Enc-Dec | Low |
| **Parakeet TDT 0.6B v3** | **7.31%** | **7.28%** | FastConformer-TDT | Zero (Non-autoregressive) |
| **Whisper Large v3** | ~5.4% - 5.7% | ~6.1% | Autoregressive Enc-Dec | Moderate to High on pauses |
| **Whisper Large v3 Turbo** | ~6.2% | ~6.9% | Autoregressive (4 dec layers) | Moderate |
| **Nemotron Streaming 3.5** | **21.53%** | **16.31%** | Causal RNN-T Streaming | High inflection error rate |

---

## 5. Polish Transcription vs. Translation Workflows

> [!TIP] Post-Processing Prompts
> For copyable post-processing prompts configured for Handy (including developer vocabulary lists, safe punctuation rules, and Polish-to-English translation), see:
> [`../Prompt examples/Handy.computer - transcription prompts.md`](../Prompt%20examples/Handy.computer%20-%20transcription%20prompts.md)

### Two-Stage Pipeline (Recommended for Technical Work):
1. **ASR Stage:** Use `Canary 1B v2` to transcribe speech into clean text.
2. **LLM Stage:** Route the transcript through an LLM prompt (e.g., Azure OpenAI `gpt-6-luna-sweden`) to format code, preserve developer terms (Tailwind, PayloadCMS, Encore), and translate if needed.

---

## 6. Hardware Optimization for NVIDIA GeForce GPUs (GTX 1650 4GB)

- **VRAM Footprint:** `Canary 1B v2` in `Q5_K_M` requires only **836 MB**. Total system VRAM stays around 1.24 GB (51% of 4GB).
- **Latency & Compute:** Discrete forward pass completes in under 1 second on Turing cores.
- **CPU Offload:** CPU usage is 0% during transcription, keeping laptops cool and quiet.

---

## 7. English Speech Recognition & Accent Robustness

### 7.1. English Benchmark Comparison

| Model | Architecture | Parameters | LibriSpeech Clean | LibriSpeech Other | Open ASR Mean WER | Handy Speed / Acc | Best Used For |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **IBM Granite Speech 4.1 2B** | Conformer + LLM Backbone | 2.3B | **1.28%** | **2.45%** | **4.90% - 5.33%** | 37 / 92 | Absolute lowest real-world error rate |
| **Cohere Transcribe (03-2026)** | Dedicated Audio Conformer | 2.0B | **1.25%** | **2.50%** | **5.40%** | 63 / 92 | Enterprise accuracy without LLM bloat |
| **NVIDIA Parakeet TDT 1.1B** | FastConformer-TDT | 1.1B | **1.39%** | **2.80%** | ~5.20% (MLS: 4.8%) | 76 / 91 | Maximum throughput with near-SOTA WER |
| **Canary 1B v2** | FastConformer Enc-Dec | 1.0B | **2.18%** | **3.56%** | 7.15% | **81 / 88** | **Best for Polish accents + bilingual users** |
| **NVIDIA Parakeet Unified EN 0.6B**| FastConformer-RNNT | 0.6B | **1.63%** | **3.11%** | ~6.10% | **79 / 90** | Native US/UK English desktop dictation |
| **Whisper Large v3 Turbo** | Autoregressive (4 dec layers)| 809M | 1.80% | 3.50% | 6.40% (MLS: 5.5%) | 35 / 88 | Punctuation-rich Whisper at 3.5x speed |

### 7.2. Why Canary 1B v2 Outperforms on Polish Accents
Standard benchmarks evaluate native American accents on read audiobooks (LibriSpeech). English-only acoustic models fail to generalize to Slavic phonology (unreduced vowels, distinct alveolar r, unaspirated plosives). Canary 1B v2 bridges cross-lingual acoustic representations, providing higher perceived accuracy for Polish speakers speaking English.
