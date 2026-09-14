import {
  SUMMARY_FOCUS_OPTIONS,
  SUMMARY_FORMAT_OPTIONS,
  SUMMARY_LENGTH_OPTIONS,
  SUMMARY_TONE_OPTIONS,
} from "../types/ai.types";

export const validationMessages = {
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
    invalid_file: "File data must be a valid data URI.",
    max_size: "File size exceeds the maximum limit of 20MB.",
    mime_type: "The file should be PNG, JPEG, and PDF only.",
    same_mime_type: "Data URI mimeType does not match provided mimeType.",
  },
};
