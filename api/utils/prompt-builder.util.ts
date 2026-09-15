import {
  SummaryFocus,
  SummaryFormat,
  SummaryLength,
  SummaryOptions,
  SummaryTone,
} from "../types/ai.types";

const OPTIONS_FOCUS_PROMPT: Record<SummaryFocus, string> = {
  [SummaryFocus.ACTION_ITEMS]:
    "Extract clear, actionable next steps, owners, timelines, or requirements mentioned.",
  [SummaryFocus.GENERAL]:
    "General balanced perspective of all core sub-topics and ideas.",
  [SummaryFocus.KEY_DECISIONS]:
    "Focus strictly on major conclusions, votes, final positions, and consensus highlights.",
  [SummaryFocus.TECHNICAL]:
    "Prioritize architecture, formulas, algorithms, hard metrics, parameters, and code snippets.",
};

const OPTIONS_FORMAT_PROMPT: Record<SummaryFormat, string> = {
  [SummaryFormat.BULLETS]:
    "A dense, high-impact bulleted list grouped under a single heading.",
  [SummaryFormat.ELI5]:
    "Explain like I'm 5 (simplified concepts, clear examples, minimal jargon).",
  [SummaryFormat.EXECUTIVE_SUMMARY]:
    "An executive summary with paragraphs, followed by a bulleted impact list.",
  [SummaryFormat.KEY_POINTS]:
    "Organized topics using headings (##, ###) with detailed key bullet points.",
};

const OPTIONS_LENGTH_PROMPT: Record<SummaryLength, string> = {
  [SummaryLength.CONCISE]:
    "Standard balanced overview (3-4 dense topics with moderate bullet density).",
  [SummaryLength.DETAIL]:
    "Comprehensive deep-dive (detailed explanations, comprehensive breakdown, or quotes where applicable).",
  [SummaryLength.SHORT]:
    "Ultra-concise (1-2 sentences overview, 3-5 high-level bullets).",
};

const OPTIONS_TONE_PROMPT: Record<SummaryTone, string> = {
  [SummaryTone.ACADEMIC]: SummaryTone.ACADEMIC,
  [SummaryTone.CASUAL]: SummaryTone.CASUAL,
  [SummaryTone.INSIGHTFUL]: SummaryTone.INSIGHTFUL,
  [SummaryTone.PROFESSIONAL]: SummaryTone.PROFESSIONAL,
  [SummaryTone.SIMPLIFIED]: SummaryTone.SIMPLIFIED,
};

const MANDATORY_INSTRUCTIONS = `\n**Mandatory Instructions**:
  - Start the summary with a concise, descriptive title prefixed by a Level 2 Markdown Header (##). Do NOT use Level 1 Header (#).
  - Utilize custom formatted Markdown styles dynamically: headers (##, ###), nested bullets, bolding for emphasis, italics for sub-context, and inline code blocks (\`code\`) for technical details, definitions, variables.
  - **STRICTLY EXCLUDE ALL TABLES**: Do not use Markdown table syntax, tables, or grid layouts in the summary output. If numerical or tabular comparison is required, convert and format them using nested bullet points or structured text.
  - Ensure perfect structural formatting. Make it scannable, engaging, and professional.
  `;

export const SYSTEM_INSTRUCTION = `You are a world-class visual information architect and executive writer.
  - Your job is to read complex inputs (which could be plaintext, tables, technical files, raw document transcripts, or scanned pages/diagrams) and distill them into highly structured, incredibly readable, visually premium Summaries.
  - Always organize the layout logically with sub-headings, rich formatting (bold, italic, code-blocks), and structured bullet points.
  - Never output a plain paragraph wall of text.
  - Never generate any Markdown tables or table schemas. If you need to make comparative tables or show statistics, convert and display them strictly as elegant bullet points or key-value segments.
  - Make extensive use of bold words to anchor readability.
  `;

export function generateSummaryPrompt(options: SummaryOptions): string {
  const optionsPrompt = `Please synthesize and summarize the provided content based on the following custom requirements:
  1. **Format/Structure**: ${OPTIONS_FORMAT_PROMPT[options.format]}
  2. **Target Length**: ${OPTIONS_LENGTH_PROMPT[options.length]}
  3. **Content Focus**: ${OPTIONS_FOCUS_PROMPT[options.focus]}
  4. **Summary Tone**: ${OPTIONS_TONE_PROMPT[options.tone]}
  `;

  return optionsPrompt + MANDATORY_INSTRUCTIONS;
}
