import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Increase limits for processing larger files/documents
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Lazy-initialize Gemini SDK to prevent server crash if key is loaded blank during boot verification checks
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined on the server.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Server-side API endpoint for Summarization
app.post("/api/summarize", async (req, res) => {
  try {
    const { text, file, options } = req.body;

    const summaryFormat = options?.format || "key_points_per_topic";
    const summaryLength = options?.length || "concise";
    const summaryFocus = options?.focus || "general";
    const tone = options?.tone || "professional";

    if (!text && !file) {
      res.status(400).json({ error: "Please provide either text or a file to summarize." });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error: "GEMINI_API_KEY environment variable is not defined on the server.",
      });
      return;
    }

    const parts: any[] = [];

    // Add file inline part if provided
    if (file && file.data && file.mimeType) {
      // Strip base64 headers if present (e.g. "data:application/pdf;base64,")
      let base64Data = file.data;
      if (base64Data.includes(",")) {
        base64Data = base64Data.split(",")[1];
      }
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: file.mimeType,
        },
      });
    }

    // Build the user prompt
    let promptText = "";
    if (text) {
      promptText += `Here is the source content to summarize:\n---\n${text}\n---\n\n`;
    }

    promptText += "Please synthesize and summarize the provided content based on the following custom requirements:";
    promptText += `\n1. **Format/Structure**: ${
      summaryFormat === "key_points_per_topic"
        ? "Organized topics using headings (##, ###) with detailed key bullet points."
        : summaryFormat === "executive_summary"
        ? "An executive summary with paragraphs, followed by a bulleted impact list."
        : summaryFormat === "bullets"
        ? "A dense, high-impact bulleted list grouped under a single heading."
        : "Explain like I'm 5 (simplified concepts, clear examples, minimal jargon)."
    }`;
    promptText += `\n2. **Target Length**: ${
      summaryLength === "short"
        ? "Ultra-concise (1-2 sentences overview, 3-5 high-level bullets)."
        : summaryLength === "detailed"
        ? "Comprehensive deep-dive (detailed explanations, comprehensive breakdown, tables or quotes where applicable)."
        : "Standard balanced overview (3-4 dense topics with moderate bullet density)."
    }`;
    promptText += `\n3. **Content Focus**: ${
      summaryFocus === "action_items"
        ? "Extract clear, actionable next steps, owners, timelines, or requirements mentioned."
        : summaryFocus === "key_decisions"
        ? "Focus strictly on major conclusions, votes, final positions, and consensus highlights."
        : summaryFocus === "technical"
        ? "Prioritize architecture, formulas, algorithms, hard metrics, parameters, and code snippets."
        : "General balanced perspective of all core sub-topics and ideas."
    }`;
    promptText += `\n4. **Summary Tone**: ${tone}`;

    promptText += `\n\n**Mandatory Instructions**:`;
    promptText += `\n- Start the summary with a concise, descriptive title prefixed by a Level 2 Markdown Header (##). Do NOT use Level 1 Header (#).`;
    promptText += `\n- Utilize custom formatted Markdown styles dynamically: headers (##, ###), nested bullets, bolding for emphasis, italics for sub-context, and inline code blocks (\`code\`) for technical details, definitions, variables, or variables.`;
    promptText += `\n- Ensure perfect structural formatting. Make it scannable, engaging, and professional.`;

    parts.push({ text: promptText });

    const systemInstruction = `You are a world-class visual information architect and executive writer.
Your job is to read complex inputs (which could be plaintext, tables, technical files, raw document transcripts, or scanned pages/diagrams) and distill them into highly structured, incredibly readable, visually premium Summaries.
Always organize the layout logically with sub-headings, rich formatting (bold, italic, code-blocks), and structured bullet points.
Never output a plain paragraph wall of text.
Make extensive use of bold words to anchor readability.`;

    // Execute server-side Gemini call with highly robust fallback cascade to handle model overloading or demand spikes
    const modelsToTry = [
      "gemini-3.5-flash",
      "gemini-flash-latest",
      "gemini-3.1-flash-lite"
    ];

    let response = null;
    let fallbackErrors: string[] = [];

    for (const modelName of modelsToTry) {
      try {
        console.log(`[API] Attempting summarization using model: ${modelName}`);
        response = await getGenAI().models.generateContent({
          model: modelName,
          contents: parts,
          config: {
            systemInstruction,
            temperature: 0.2, // Lower temperature is better for concise & accurate summarization
          },
        });
        if (response && response.text) {
          console.log(`[API] Summarization succeeded with model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        const errMsg = err.message || JSON.stringify(err);
        console.warn(`[API] Model ${modelName} failed with error:`, errMsg);
        fallbackErrors.push(`${modelName}: ${errMsg}`);
      }
    }

    if (!response || !response.text) {
      throw new Error(`All Gemini models failed. Errors:\n- ${fallbackErrors.join("\n- ")}`);
    }

    const summaryResult = response.text;
    res.json({ summary: summaryResult });
  } catch (error: any) {
    console.error("Gemini Summarization Error:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred during summarization." });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

// EXPORT the app instance for Vercel's platform
export default app;
