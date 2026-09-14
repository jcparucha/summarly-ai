import { Request, Response } from "express";
import { handleSummarizePrompt } from "../services/ai.service";
import { getAI } from "../libraries/gemini";
import { SYSTEM_INSTRUCTION } from "../utils/prompt-builder.util";
import { appMessages } from "../lang/app";
import { GEMINI_MODELS } from "../config/ai.config";

const ping = (req: Request, res: Response) => {
  res.json({ message: "PONG" });
};

const summarize = async (req: Request, res: Response) => {
  const { text, file, options } = req.body;

  const { prompt, inlineData } = handleSummarizePrompt(text, file, options);

  const parts: object[] = [{ text: prompt }];

  if (Object.keys(inlineData).length > 0) {
    parts.push({ inlineData: { ...inlineData } });
  }

  try {
    const geminiAI = getAI();

    let response = null;
    let fallbackErrors: string[] = [];

    for (const modelName of GEMINI_MODELS) {
      try {
        console.log(`${appMessages.info.summary_attempt}: ${modelName}`);

        response = await geminiAI.models.generateContent({
          model: modelName,
          contents: parts,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.2, // Lower temperature is better for concise & accurate summarization
          },
        });

        // Once we have response, break the loop
        if (response && response.text) {
          console.log(`${appMessages.info.summary_success}: ${modelName}`);
          break;
        }
      } catch (err: any) {
        const errMsg = err.message || JSON.stringify(err);
        console.warn(`[API] Model ${modelName} failed with error:`, errMsg);
        fallbackErrors.push(`${modelName}: ${errMsg}`);
      }
    }

    if (!response || !response.text) {
      throw new Error(
        `All Gemini models failed. Errors:\n- ${fallbackErrors.join("\n- ")}`,
      );
    }

    res.json({ summary: response.text });
  } catch (error: any) {
    console.error("Gemini Summarization Error:", error);

    // Detect if this error or any underlying fallback model error is a 429 / Resource Exhausted / Rate limit error
    const errText = error.message || JSON.stringify(error) || "";

    const isRateLimited =
      error.status === 429 ||
      error.statusCode === 429 ||
      /429|RESOURCE_EXHAUSTED|quota|too many requests/i.test(errText);

    const statusCode = isRateLimited ? 429 : 500;

    res.status(statusCode).json({
      status: statusCode,
      error: error.message || appMessages.error.summary_failed,
    });
  }
};

export { ping, summarize };
