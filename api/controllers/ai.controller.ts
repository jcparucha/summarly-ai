import { Request, Response } from "express";
import { generateSummary } from "../services/ai.service.js";
import { appMessages } from "../lang/app.js";
import { getErrorStatusCode } from "../utils/error-handler.util.js";

const ping = (req: Request, res: Response) => {
  res.json({ message: "PONG" });
};

const summarize = async (req: Request, res: Response) => {
  try {
    const summary = await generateSummary(req.body);
    res.json({ summary });
  } catch (error: any) {
    console.error("Gemini Summarization Error:", error);

    const statusCode = getErrorStatusCode(error);

    res.status(statusCode).json({
      status: statusCode,
      error: error.message || appMessages.error.summary_failed,
    });
  }
};

export { ping, summarize };
