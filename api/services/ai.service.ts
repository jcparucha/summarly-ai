import { SummaryOptions } from "../types/ai.types";
import { generateSummaryPrompt } from "../utils/prompt-builder.util";

type FileData = {
  data: string;
  mimeType: "image/png" | "image/jpeg" | "image/jpg" | "application/json";
};

export function handleSummarizePrompt(
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
