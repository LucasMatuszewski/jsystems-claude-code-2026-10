import { expect, test } from "@playwright/test";

/**
 * C-01 (ADR-002 D-AI5): the configured vision and LLM models expose the
 * capabilities the app relies on. Runs against the real OpenRouter models API.
 */
const MODELS_URL = "https://openrouter.ai/api/v1/models";

type ModelEntry = {
  id: string;
  architecture?: { input_modalities?: string[] };
  supported_parameters?: string[];
};

test.describe("C-01 model capabilities", () => {
  test("configured vision and LLM models support required capabilities", async () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const visionModelId = process.env.VISION_MODEL || process.env.LLM_MODEL;
    const llmModelId = process.env.LLM_MODEL;
    expect(apiKey, "OPENROUTER_API_KEY must be set").toBeTruthy();
    expect(visionModelId, "VISION_MODEL or LLM_MODEL must be set").toBeTruthy();
    expect(llmModelId, "LLM_MODEL must be set").toBeTruthy();

    const response = await fetch(MODELS_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(response.status, "OpenRouter models endpoint status").toBe(200);
    const payload = (await response.json()) as { data: ModelEntry[] };
    const models = payload.data;

    const vision = models.find((model) => model.id === visionModelId);
    const llm = models.find((model) => model.id === llmModelId);
    expect(vision, `vision model ${visionModelId} listed`).toBeDefined();
    expect(llm, `LLM model ${llmModelId} listed`).toBeDefined();

    const visionModalities = vision?.architecture?.input_modalities ?? [];
    const visionParameters = vision?.supported_parameters ?? [];
    const llmParameters = llm?.supported_parameters ?? [];

    const summary = {
      llm: { id: llmModelId, supported_parameters: llmParameters },
      vision: {
        id: visionModelId,
        input_modalities: visionModalities,
        supported_parameters: visionParameters,
      },
    };
    console.log(JSON.stringify(summary, null, 2));
    await test.info().attach("c-01-model-capabilities.json", {
      body: JSON.stringify(summary, null, 2),
      contentType: "application/json",
    });

    expect(visionModalities, "vision model accepts images").toContain("image");
    expect(
      visionParameters,
      "vision model supports structured outputs"
    ).toContain("structured_outputs");
    expect(llmParameters, "LLM supports tools").toContain("tools");
    expect(llmParameters, "LLM supports tool_choice").toContain("tool_choice");
  });
});
