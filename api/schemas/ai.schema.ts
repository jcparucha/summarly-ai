import * as z from "zod";
import {
  SUMMARY_FOCUS_OPTIONS,
  SUMMARY_FORMAT_OPTIONS,
  SUMMARY_LENGTH_OPTIONS,
  SUMMARY_TONE_OPTIONS,
} from "../types/ai.types";
import { validationMessages } from "../lang/validation";

const MAX_FILE_LIMIT = 20 * 1024 * 1024; // 20mb

const {
  summary: { required: summaryRequired, ...fileErrors },
} = validationMessages;

const FileSchema = z
  .object({
    data: z.string().refine((val) => val.startsWith("data:"), {
      message: fileErrors.invalid_file,
    }),
    mimeType: z.enum(
      ["image/png", "image/jpeg", "image/jpg", "application/pdf"],
      { message: fileErrors.mime_type },
    ),
  })
  .refine(
    // validate data and mimeType should be the same
    ({ data, mimeType }) => {
      const match = data.match(/^data:(.*?);base64,/);
      return !match || match[1] === mimeType;
    },
    { message: fileErrors.same_mime_type },
  )
  .refine(
    // validate file size
    ({ data }) => {
      const base64Data = data.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      return buffer.byteLength <= MAX_FILE_LIMIT;
    },
    { message: fileErrors.max_size },
  );

export const SummarizeSchema = z
  .object({
    text: z.string().min(3).optional(),
    file: FileSchema.optional(),
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
  .refine(({ file, text }) => file !== undefined || text !== undefined, {
    error: summaryRequired.text_file,
    path: ["text"],
  });
