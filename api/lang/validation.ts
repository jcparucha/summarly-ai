import {
  SUMMARY_FOCUS_OPTIONS,
  SUMMARY_FORMAT_OPTIONS,
  SUMMARY_LENGTH_OPTIONS,
  SUMMARY_TONE_OPTIONS,
} from "../types/ai.types";

export const errorMessages = {
  general: {
    required: {
      gemini_key:
        "GEMINI_API_KEY environment variable is not defined on the server.",
    },
  },
  summary: {
    required: {
      text_file: "Either text or file must be provided.",
      options: {
        focus: `The Options.focus should either be: ${SUMMARY_FOCUS_OPTIONS.join(", ")}.`,
        format: `The Options.format should either be: ${SUMMARY_FORMAT_OPTIONS.join(", ")}.`,
        length: `The Options.length should either be: ${SUMMARY_LENGTH_OPTIONS.join(", ")}.`,
        tone: `The Options.tone should either be: ${SUMMARY_TONE_OPTIONS.join(", ")}.`,
      },
    },
  },
};
