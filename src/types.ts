export interface SummaryOptions {
  format: "key_points_per_topic" | "executive_summary" | "bullets" | "eli5";
  length: "short" | "concise" | "detailed";
  focus: "general" | "action_items" | "key_decisions" | "technical";
  tone: "professional" | "academic" | "casual" | "insightful" | "simplified";
}

export interface SummaryHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  sourceType: "text" | "file";
  sourceName?: string;
  sourceSize?: string;
  summary: string;
  originalText?: string;
  options: SummaryOptions;
}

export interface FileData {
  name: string;
  size: string;
  type: string;
  mimeType: string;
  data: string; // Base64 representation
}
