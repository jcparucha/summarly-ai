import { GEMINI_MODELS } from "../config/ai.config";
import { appMessages } from "../lang/app";
import { getGeminiClient } from "../libraries/gemini";
import { SummaryOptions } from "../types/ai.types";
import {
  generateSummaryPrompt,
  SYSTEM_INSTRUCTION,
} from "../utils/prompt-builder.util";

type FileData = {
  data: string;
  mimeType: "image/png" | "image/jpeg" | "image/jpg" | "application/json";
};

export async function generateSummary({
  text,
  file,
  options,
}: {
  text: string | undefined;
  file: FileData | undefined;
  options: SummaryOptions;
}): Promise<string> {
  const { prompt, inlineData } = _createSummarizePrompt(text, file, options);

  const parts: object[] = [{ text: prompt }];
  if (Object.keys(inlineData).length > 0) {
    parts.push({ inlineData: { ...inlineData } });
  }

  const geminiAI = getGeminiClient();
  let fallbackErrors: string[] = [];

  // try all models
  for (const modelName of GEMINI_MODELS) {
    try {
      console.log(`${appMessages.info.summary_attempt}: ${modelName}`);

      const response = await geminiAI.models.generateContent({
        model: modelName,
        contents: parts,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.2, // Lower temperature is better for concise & accurate summarization
        },
      });

      // Once we have response from one of the models, break the loop by returning the response
      if (response && response.text) {
        console.log(`${appMessages.info.summary_success}: ${modelName}`);
        return response.text;
      }
    } catch (err: any) {
      const errMsg = err.message || JSON.stringify(err);
      console.warn(`[API] Model ${modelName} failed with error:`, errMsg);
      fallbackErrors.push(`${modelName}: ${errMsg}`);
    }
  }

  throw new Error(
    `All Gemini models failed. Errors:\n- ${fallbackErrors.join("\n- ")}`,
  );
}

export function _createSummarizePrompt(
  text: string | undefined,
  file: FileData | undefined,
  options: SummaryOptions,
): { prompt: string; inlineData: FileData | object } {
  const summaryPrompt = generateSummaryPrompt(options);
  let prompt = summaryPrompt;

  const inlineData = file
    ? {
        // Strip base64 headers if present (e.g. "data:application/pdf;base64,")
        data: file.data.split(",")[1],
        mimeType: file.mimeType,
      }
    : {};

  // add this prompt only if has text and no file
  if (text) {
    prompt = `Here is the source content to summarize:
    ---
    ${text}
    ---
    \n\n
    ${prompt}`;
  }

  return { prompt, inlineData };
}
