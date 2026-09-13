export enum SummaryFocus {
  ACTION_ITEMS = "action_items",
  GENERAL = "general",
  KEY_DECISIONS = "key_decisions",
  TECHNICAL = "technical",
}

export enum SummaryFormat {
  BULLETS = "bullets",
  ELI5 = "ELI5", // explain like Im 5
  EXECUTIVE_SUMMARY = "executive_summary",
  KEY_POINTS = "key_points_per_topic",
}

export enum SummaryLength {
  CONCISE = "concise",
  DETAIL = "detailed",
  SHORT = "short",
}

export enum SummaryTone {
  ACADEMIC = "academic",
  CASUAL = "casual",
  INSIGHTFUL = "insightful",
  PROFESSIONAL = "professional",
  SIMPLIFIED = "simplified",
}

export interface SummaryOptions {
  format: SummaryFormat;
  length: SummaryLength;
  focus: SummaryFocus;
  tone: SummaryTone;
}

export const SUMMARY_FOCUS_OPTIONS = [
  SummaryFocus.ACTION_ITEMS,
  SummaryFocus.GENERAL,
  SummaryFocus.KEY_DECISIONS,
  SummaryFocus.TECHNICAL,
] as const;

export const SUMMARY_FORMAT_OPTIONS = [
  SummaryFormat.BULLETS,
  SummaryFormat.ELI5,
  SummaryFormat.EXECUTIVE_SUMMARY,
  SummaryFormat.KEY_POINTS,
] as const;

export const SUMMARY_LENGTH_OPTIONS = [
  SummaryLength.CONCISE,
  SummaryLength.DETAIL,
  SummaryLength.SHORT,
] as const;

export const SUMMARY_TONE_OPTIONS = [
  SummaryTone.ACADEMIC,
  SummaryTone.CASUAL,
  SummaryTone.INSIGHTFUL,
  SummaryTone.PROFESSIONAL,
  SummaryTone.SIMPLIFIED,
] as const;
