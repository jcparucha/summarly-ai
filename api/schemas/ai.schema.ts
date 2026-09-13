import * as z from "zod";
import {
  SUMMARY_FOCUS_OPTIONS,
  SUMMARY_FORMAT_OPTIONS,
  SUMMARY_LENGTH_OPTIONS,
  SUMMARY_TONE_OPTIONS,
} from "../types/ai.types";
import { errorMessages } from "../lang/validation";

const {
  summary: { required: summaryRequired },
} = errorMessages;

export const SummarizeSchema = z
  .object({
    text: z.string().min(3).optional(),
    file: z
      .object({
        data: z.string(),
        mimeType: z.mime([
          "image/png",
          "image/jpeg",
          "image/jpg",
          "application/json",
        ]),
      })
      .optional(),
    options: z.object({
      focus: z.enum(SUMMARY_FOCUS_OPTIONS, {
        error: summaryRequired.options.focus,
      }),
      format: z.enum(SUMMARY_FORMAT_OPTIONS, {
        error: summaryRequired.options.format,
      }),
      length: z.enum(SUMMARY_LENGTH_OPTIONS, {
        error: summaryRequired.options.length,
      }),
      tone: z.enum(SUMMARY_TONE_OPTIONS, {
        error: summaryRequired.options.tone,
      }),
    }),
  })
  .refine(
    // (val) => {
    ({ file, text }) => file !== undefined || text !== undefined,
    {
      error: "Either text or file must be provided.",
      path: ["text"],
    },
  );
