import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  UploadCloud,
  FileText,
  X,
  Copy,
  Check,
  FileDown,
  ClipboardPaste,
  Trash2,
  History,
  BookOpen,
  Info,
  Sliders,
  Eye,
  Code,
  Share2,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ListRestart,
  AlertTriangle,
  Sun,
  Moon,
} from "lucide-react";
import Markdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { SummaryOptions, SummaryHistoryItem, FileData } from "./types";

export default function App() {
  const [sourceText, setSourceText] = useState("");
  const [inputMode, setInputMode] = useState<"text" | "file">("text");
  const [uploadedFile, setUploadedFile] = useState<FileData | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [summaryResult, setSummaryResult] = useState<string>("");
  const [outputTab, setOutputTab] = useState<"formatted" | "markdown">("formatted");
  const [copiedType, setCopiedType] = useState<"markdown" | "plain" | null>(null);
  const [history, setHistory] = useState<SummaryHistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const cached = localStorage.getItem("summarly_theme");
    return cached === "light" ? "light" : "dark";
  });

  useEffect(() => {
    localStorage.setItem("summarly_theme", theme);
  }, [theme]);

  // Track remaining uploaded texts/files before Gemini limit
  const [remainingUploads, setRemainingUploads] = useState<number>(() => {
    const cached = localStorage.getItem("summarly_remaining_uploads");
    return cached !== null ? parseInt(cached, 10) : 15;
  });

  const resetQuota = () => {
    setRemainingUploads(15);
    localStorage.setItem("summarly_remaining_uploads", "15");
    setErrorMessage(null);
  };

  // Summarization customization states
  const [options, setOptions] = useState<SummaryOptions>({
    format: "key_points_per_topic",
    length: "concise",
    focus: "general",
    tone: "professional",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load and save local state summaries history
  useEffect(() => {
    const cached = localStorage.getItem("summary_history_logs");
    if (cached) {
      try {
        setHistory(JSON.parse(cached));
      } catch (err) {
        console.error("Failed to parse history storage logs", err);
      }
    }
  }, []);

  const saveHistoryToLocalStorage = (updatedHistory: SummaryHistoryItem[]) => {
    setHistory(updatedHistory);
    localStorage.setItem("summary_history_logs", JSON.stringify(updatedHistory));
  };

  // Clipboard Paste Helper
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSourceText(text);
        setErrorMessage(null);
      }
    } catch (err) {
      // Fallback if browser security blocks direct paste
      setErrorMessage("Could not read from clipboard directly due to browser iframe security. Please hit paste (Ctrl+V or Cmd+V) manually in the editor.");
      setTimeout(() => setErrorMessage(null), 6000);
    }
  };

  // Helper to calculate file bytes representation
  const formatBytes = (bytes: number, decimals = 1) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  // Handle Drop Event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    const isPDF = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    const isText =
      file.type.startsWith("text/") ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".csv") ||
      file.name.endsWith(".json");

    if (!isPDF && !isImage && !isText) {
      setErrorMessage("Unsupported file type. Please upload a PDF, PNG/JPEG image, or Text file (.txt, .md, .csv, .json).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("File exceeds the 15MB limit. Please provide a lighter document.");
      return;
    }

    setErrorMessage(null);
    setStatusMessage("Reading file metadata...");

    const reader = new FileReader();

    reader.onload = () => {
      setUploadedFile({
        name: file.name,
        size: formatBytes(file.size),
        type: file.type || "application/octet-stream",
        mimeType: file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "text/plain"),
        data: reader.result as string,
      });

      // If it is a readable text document, load it into the source text area as well for clarity!
      if (isText) {
        const textReader = new FileReader();
        textReader.onload = () => {
          setSourceText(textReader.result as string);
        };
        textReader.readAsText(file);
      }
    };

    reader.onerror = () => {
      setErrorMessage("Error reading the chosen file.");
    };

    reader.readAsDataURL(file);
  };

  // Trigger file selection manually
  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Reset file selection
  const clearSelectedFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Build client-side strip markdown utility for formatting plain copies
  const stripMarkdown = (md: string): string => {
    return md
      .replace(/^#+\s+/gm, "") // Strip headers
      .replace(/\*{1,3}(.*?)\*{1,3}/g, "$1") // Strip bold and italics
      .replace(/_{1,3}(.*?)_{1,3}/g, "$1") // Strip alternative italic/bold delimiters
      .replace(/`{3}[\s\S]*?`{3}/g, "") // Remove multi-line code blocks entirely
      .replace(/`([^`\n]+)`/g, "$1") // Extract inline code snippets
      .replace(/^\s*[-*+]\s+/gm, "• ") // Transform bullets to clean round nodes
      .replace(/^\s*>\s+/gm, "") // Remove blockquote pointers
      .replace(/\n{3,}/g, "\n\n") // Collapse blank lines
      .trim();
  };

  // Copy to clipboard with confirmation callback states
  const handleCopyToClipboard = (type: "markdown" | "plain") => {
    const textToCopy = type === "markdown" ? summaryResult : stripMarkdown(summaryResult);
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedType(type === "markdown" ? "markdown" : "plain");
      setTimeout(() => setCopiedType(null), 2000);
    });
  };

  // Download the summary locally as text or md files
  const handleDownloadFile = () => {
    if (!summaryResult) return;
    const title = extractTitle(summaryResult) || "summary";
    const cleanFileName = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".md";
    const blob = new Blob([summaryResult], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = cleanFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const extractTitle = (mdText: string): string => {
    const lines = mdText.split("\n");
    for (const line of lines) {
      if (line.startsWith("## ")) {
        return line.replace("## ", "").trim();
      }
      if (line.startsWith("# ")) {
        return line.replace("# ", "").trim();
      }
    }
    return "Summary Report";
  };

  // Submit trigger to backend express service
  const handleSummarizeSubmit = async () => {
    if (remainingUploads <= 0) {
      setErrorMessage("Your Gemini Flash allowance is completely exhausted. Please click Reset to restore your allowance!");
      return;
    }

    if (!sourceText.trim() && !uploadedFile) {
      setErrorMessage("Please input copied text or upload a document to proceed.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage("Establishing connection to Gemini 3.5 Flash...");

    try {
      // Step simulator for enhanced loading aesthetics
      const stateTimers = [
        setTimeout(() => setStatusMessage("Uploading raw assets to ingestion server..."), 1000),
        setTimeout(() => setStatusMessage("Analyzing document vocabulary and topics..."), 2200),
        setTimeout(() => setStatusMessage("Generating structured markdown notes..."), 4000),
      ];

      const payload = {
        text: sourceText.trim() ? sourceText : undefined,
        file: uploadedFile ? { data: uploadedFile.data, mimeType: uploadedFile.mimeType } : undefined,
        options: options,
      };

      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Clear the fake loading sequence logs
      stateTimers.forEach(clearTimeout);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.summary) {
        throw new Error("No summary content returned from server.");
      }

      setSummaryResult(data.summary);
      setOutputTab("formatted");

      // Decrement dynamic Gemini Flash quota allowance remaining
      setRemainingUploads((prev) => {
        const nextVal = Math.max(0, prev - 1);
        localStorage.setItem("summarly_remaining_uploads", nextVal.toString());
        return nextVal;
      });

      // Save to recent logs history
      const title = extractTitle(data.summary);
      const newHistoryItem: SummaryHistoryItem = {
        id: crypto.randomUUID(),
        title: title,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " - " + new Date().toLocaleDateString([], { month: "short", day: "numeric" }),
        sourceType: uploadedFile ? "file" : "text",
        sourceName: uploadedFile?.name,
        sourceSize: uploadedFile?.size,
        summary: data.summary,
        originalText: sourceText,
        options: { ...options },
      };

      const updatedHistory = [newHistoryItem, ...history.slice(0, 49)]; // Limit to past 50 items
      saveHistoryToLocalStorage(updatedHistory);
      setSelectedHistoryId(newHistoryItem.id);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An error occurred while summoning Gemini to summarize.");
    } finally {
      setIsLoading(false);
      setStatusMessage("");
    }
  };

  // Load selected summary history detail
  const loadHistoryItem = (item: SummaryHistoryItem) => {
    setSummaryResult(item.summary);
    setSourceText(item.originalText || "");
    setOptions(item.options);
    setSelectedHistoryId(item.id);
    setOutputTab("formatted");
    if (item.sourceType === "file" && item.sourceName) {
      setUploadedFile({
        name: item.sourceName,
        size: item.sourceSize || "",
        type: "",
        mimeType: "",
        data: "",
      });
      setInputMode("file");
    } else {
      setUploadedFile(null);
      setInputMode("text");
    }
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((h) => h.id !== id);
    saveHistoryToLocalStorage(updated);
    if (selectedHistoryId === id) {
      setSelectedHistoryId(null);
      setSummaryResult("");
    }
  };

  const clearAllHistory = () => {
    if (window.confirm("Are you sure you want to purge all past summary logs?")) {
      saveHistoryToLocalStorage([]);
      setSelectedHistoryId(null);
      setSummaryResult("");
    }
  };

  const filteredHistory = history.filter((h) =>
    h.title.toLowerCase().includes(historySearch.toLowerCase()) ||
    (h.sourceName && h.sourceName.toLowerCase().includes(historySearch.toLowerCase()))
  );

  // Statistics counters
  const charCount = sourceText.length;
  const wordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0;
  const compressedRatio =
    summaryResult && sourceText
      ? Math.max(0, Math.round(100 - (summaryResult.length / sourceText.length) * 100))
      : 0;

  // Dynamic alert styles and descriptions for Gemini Flash operation limits
  let quotaBgColor = theme === "light" ? "bg-emerald-50" : "bg-emerald-950/10";
  let quotaBorderColor = theme === "light" ? "border-emerald-200/80" : "border-emerald-500/20";
  let quotaTextColor = theme === "light" ? "text-emerald-800" : "text-emerald-400/90";
  let quotaDotColor = "bg-emerald-500";
  let quotaStatusText = "Stable Status: High bandwidth available.";

  if (remainingUploads <= 3) {
    quotaBgColor = theme === "light" ? "bg-rose-50" : "bg-rose-950/10";
    quotaBorderColor = theme === "light" ? "border-rose-200/80" : "border-rose-500/20";
    quotaTextColor = theme === "light" ? "text-rose-800" : "text-rose-400";
    quotaDotColor = theme === "light" ? "bg-rose-500" : "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]";
    quotaStatusText = remainingUploads === 0
      ? "Allowance completely exhausted! Restorer required."
      : "Warning: Almost close to Gemini Flash upload limit!";
  } else if (remainingUploads <= 10) {
    quotaBgColor = theme === "light" ? "bg-amber-50" : "bg-amber-950/10";
    quotaBorderColor = theme === "light" ? "border-amber-200/80" : "border-amber-500/20";
    quotaTextColor = theme === "light" ? "text-amber-800" : "text-amber-400";
    quotaDotColor = theme === "light" ? "bg-amber-500" : "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]";
    quotaStatusText = "Approaching moderate capacity levels.";
  } else {
    quotaStatusText = `Success: Plenty of uploads left before rate limits.`;
  }

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-200 relative overflow-x-hidden ${
      theme === "light"
        ? "bg-[#f8fafc] text-slate-900 theme-light selection:bg-cyan-100 selection:text-cyan-900"
        : "bg-[#05060a] text-slate-100 theme-dark selection:bg-cyan-500/20 selection:text-cyan-200"
    }`}>
      {/* Upper Navigation Rail */}
      <header className={`sticky top-0 z-40 backdrop-blur-md px-6 md:px-8 py-4 md:py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm transition-colors duration-200 ${
        theme === "light" ? "bg-white/70 border-b border-slate-200/80" : "bg-white/[0.02] border-b border-white/5"
      }`}>
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)] shrink-0">
              <Sparkles className="w-5 h-5 text-white animate-pulse" id="header_spark_icon" />
            </div>
            <div>
              <h1 className={`text-lg font-bold tracking-tight flex items-center gap-1.5 transition-colors ${
                theme === "light" ? "text-slate-900" : "text-white"
              }`}>
                Summarly <span className="text-cyan-500 font-medium">AI</span>
              </h1>
              <p className={`text-xs font-medium transition-colors ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                Powering premium text & file digestion via Gemini Flash
              </p>
            </div>
          </div>

          {/* Light/Dark Toggle Button for Mobile Only */}
          <div className="block md:hidden">
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center ${
                theme === "light"
                  ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                  : "bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.06] hover:text-white"
              }`}
              title={`Switch to ${theme === "light" ? "Dark Mode" : "Light Mode"}`}
            >
              {theme === "light" ? <Moon className="w-4 h-4 text-cyan-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          {/* Gemini 3.5 Flash Active Badge (on mobile it's on bottom left, or full width row, nice pill) */}
          <div className={`flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border shadow-sm transition-all w-full md:w-auto ${
            theme === "light"
              ? "bg-cyan-50 text-cyan-700 border-cyan-200/80"
              : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${theme === "light" ? "bg-cyan-500" : "bg-cyan-400"}`}></span>
            Gemini 3.5 Flash Active
          </div>

          {/* Light/Dark Toggle Button for Desktop Only */}
          <div className="hidden md:block">
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center ${
                theme === "light"
                  ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                  : "bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.06] hover:text-white"
              }`}
              title={`Switch to ${theme === "light" ? "Dark Mode" : "Light Mode"}`}
            >
              {theme === "light" ? <Moon className="w-4 h-4 text-cyan-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="absolute top-1/4 -right-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="grid grid-cols-12 gap-4 sm:gap-6 md:gap-8 relative z-10">
          
          {/* Recent History Floating Slider Drawer with backdrop overlay */}
          <AnimatePresence>
            {isSidebarOpen && (
              <>
                {/* Backdrop cover overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="fixed inset-0 bg-slate-900/25 dark:bg-black/60 backdrop-blur-[1.5px] z-40 cursor-pointer"
                />

                {/* Main Drawer Card */}
                <motion.div
                  initial={{ opacity: 0, x: "100%" }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 220 }}
                  className={`fixed top-24 right-4 sm:right-6 lg:right-8 bottom-6 sm:bottom-8 w-80 sm:w-96 z-50 flex flex-col gap-4 p-5 rounded-2xl border shadow-2xl backdrop-blur-md ${
                    theme === "light"
                      ? "bg-white/95 border-slate-200/90 text-slate-800 shadow-slate-200/50"
                      : "bg-[#090b11]/95 border-white/10 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className={`flex items-center gap-1.5 font-semibold transition-colors min-w-0 ${
                      theme === "light" ? "text-slate-700" : "text-slate-300"
                    }`}>
                      <History className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs md:text-sm truncate font-bold">Recent Summaries</span>
                      <span className={`text-[10px] border px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                        theme === "light" ? "bg-slate-100 border-slate-200 text-slate-700" : "bg-white/[0.06] border-white/5 text-slate-300"
                      }`}>{history.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {history.length > 0 && (
                        <button
                          onClick={clearAllHistory}
                          className="text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 transition-colors duration-150 cursor-pointer flex-shrink-0 text-[10px]"
                          title="Purge logs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline font-bold">Clear</span>
                        </button>
                      )}
                      {/* Close button inside sidebar */}
                      <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Collapse recent summaries"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* History Search */}
                  <input
                    type="text"
                    placeholder="Search recent summaries..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className={`w-full text-xs px-3 py-2.5 rounded-lg border transition-all duration-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 shadow-sm ${
                      theme === "light"
                        ? "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
                        : "bg-white/[0.03] border-white/10 text-slate-200 placeholder:text-slate-500"
                    }`}
                    maxLength={60}
                  />

                  {/* List log drawer */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    <AnimatePresence initial={false}>
                      {filteredHistory.length > 0 ? (
                        filteredHistory.map((item) => {
                          const isSelected = selectedHistoryId === item.id;
                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -50 }}
                              className={`group relative p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                                isSelected
                                  ? theme === "light"
                                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-900 shadow-sm"
                                    : "bg-cyan-500/10 border-cyan-500/30 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                                  : theme === "light"
                                  ? "bg-white border-slate-200 text-slate-700 hover:border-cyan-500/30 hover:bg-slate-50/80"
                                  : "bg-white/[0.01] border-white/5 text-slate-300 hover:border-cyan-500/30 hover:bg-white/[0.03]"
                              }`}
                              onClick={() => loadHistoryItem(item)}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className={`text-xs font-semibold line-clamp-1 group-hover:text-cyan-500 transition-colors ${
                                  isSelected 
                                    ? theme === "light" ? "text-cyan-900" : "text-cyan-300" 
                                    : theme === "light" ? "text-slate-800" : "text-slate-300"
                                }`}>
                                  {item.title}
                                </span>
                                <button
                                  onClick={(e) => deleteHistoryItem(item.id, e)}
                                  className="text-slate-400 hover:text-rose-500 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 focus:opacity-100"
                                  title="Delete log item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className={`flex items-center gap-1.5 mt-2.5 text-[10px] transition-colors ${
                                theme === "light" ? "text-slate-400 group-hover:text-slate-500" : "text-slate-500 group-hover:text-slate-400"
                              }`}>
                                <FileText className={`w-3 h-3 ${isSelected ? "text-cyan-500" : "text-indigo-500/80"}`} />
                                <span>{item.sourceType === "file" ? "File OCR" : "Copypasta"}</span>
                                <span>•</span>
                                <span>{item.timestamp}</span>
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        <div className={`border border-dashed rounded-xl p-5 text-center text-xs mt-2 transition-colors ${
                          theme === "light" ? "bg-slate-50 border-slate-200 text-slate-400" : "bg-white/[0.01] border-white/5 text-slate-500"
                        }`}>
                          <History className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                          <span>No summaries compiled yet. History persists locally.</span>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* LEFT MAIN COMPILER DIVISION (5 columns source + options) */}
          <div className="col-span-12 md:col-span-5 order-1 flex flex-col gap-6 transition-all duration-300">
            


            {/* INGESTION TYPE TOGGLE */}
            <div className={`p-1.5 rounded-xl border shadow-inner flex flex-col sm:flex-row md:flex-col lg:flex-row gap-1.5 transition-colors ${
              theme === "light" ? "bg-slate-200/50 border-slate-200/80" : "bg-white/[0.02] border-white/5"
            }`}>
              <button
                onClick={() => {
                  setInputMode("text");
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 sm:py-3 md:py-2.5 lg:py-3 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer text-center ${
                  inputMode === "text"
                    ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-[0_4px_15px_rgba(8,145,178,0.25)]"
                    : theme === "light"
                    ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200"
                }`}
              >
                Text Copypasta
              </button>
              <button
                onClick={() => {
                  setInputMode("file");
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 sm:py-3 md:py-2.5 lg:py-3 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer text-center ${
                  inputMode === "file"
                    ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-[0_4px_15px_rgba(8,145,178,0.25)]"
                    : theme === "light"
                    ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200"
                }`}
              >
                File Upload (PDF, Text, JPEG)
              </button>
            </div>

            {/* DATA INPUT AREA */}
            <div className={`rounded-2xl border shadow-lg overflow-hidden transition-colors ${
              theme === "light"
                ? "bg-white border-slate-200 shadow-slate-100/50"
                : "bg-[#080a0f] border-white/10 shadow-black/30"
            }`}>
              <div className={`border-b px-4 py-3 flex items-center justify-between text-xs font-bold transition-colors ${
                theme === "light"
                  ? "border-slate-100 bg-slate-50/50 text-slate-500"
                  : "border-white/5 bg-white/[0.01] text-slate-400"
              }`}>
                <span>{inputMode === "text" ? "SOURCE MATERIAL TEXT" : "SOURCE RECORD FILE"}</span>
                {inputMode === "text" && sourceText.trim() && (
                  <button
                    onClick={() => setSourceText("")}
                    className="text-slate-500 hover:text-rose-500 text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Clear source
                  </button>
                )}
              </div>

              {inputMode === "text" ? (
                /* Plain copied text mode editor */
                <div className="p-4 flex flex-col gap-3">
                  <div className="relative">
                    <textarea
                      placeholder="Paste long-form text, articles, instructions, logs, meeting transcripts, or code snippets to summarize here..."
                      value={sourceText}
                      onChange={(e) => {
                        setSourceText(e.target.value);
                        setErrorMessage(null);
                      }}
                      className={`w-full h-64 text-sm bg-transparent border-0 focus:ring-0 resize-none outline-none custom-scrollbar transition-colors ${
                        theme === "light" ? "placeholder:text-slate-400 text-slate-800" : "placeholder:text-slate-600 text-slate-200"
                      }`}
                    />

                    {sourceText.length === 0 && (
                      <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2 transition-colors ${
                        theme === "light" ? "text-slate-400" : "text-slate-600"
                      }`}>
                        <BookOpen className={`w-10 h-10 ${theme === "light" ? "text-slate-300" : "text-slate-700"}`} />
                        <span className="text-xs font-semibold">Copy-paste bucket is empty</span>
                      </div>
                    )}
                  </div>

                  {/* Clipboard action bar */}
                  <div className={`flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between md:flex-col md:items-stretch lg:flex-row lg:items-center lg:justify-between border-t pt-3 transition-colors ${
                    theme === "light" ? "border-slate-100" : "border-white/5"
                  }`}>
                    <button
                      onClick={handlePasteFromClipboard}
                      className={`px-3 py-1.5 border text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors duration-150 cursor-pointer ${
                        theme === "light"
                          ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                          : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-200"
                      }`}
                      title="Quick paste helper"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Paste clipboard info</span>
                    </button>
                    
                    <div className={`flex items-center justify-center sm:justify-end md:justify-center lg:justify-end gap-3 text-[10px] font-medium uppercase tracking-widest font-mono transition-colors ${
                      theme === "light" ? "text-slate-400" : "text-slate-500"
                    }`}>
                      <span>{charCount} chars</span>
                      <span>•</span>
                      <span>{wordCount} words</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Drag & Drop File Upload module */
                <div className="p-5 flex flex-col items-center justify-center">
                  {!uploadedFile ? (
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`w-full border-2 border-dashed rounded-xl p-8 transition-all duration-200 flex flex-col items-center text-center gap-3 ${
                        isDragActive
                          ? theme === "light"
                            ? "border-cyan-500 bg-cyan-50/50"
                            : "border-cyan-500 bg-cyan-950/20"
                          : theme === "light"
                          ? "border-slate-200 hover:border-cyan-500 bg-slate-50/50 hover:bg-slate-50"
                          : "border-white/10 hover:border-cyan-500/40 bg-white/[0.01]"
                      }`}
                    >
                      <div className={`p-3.5 rounded-full shadow-inner border transition-colors ${
                        theme === "light"
                          ? "bg-cyan-50 text-cyan-650 border-cyan-100"
                          : "bg-cyan-950 text-cyan-400 border-cyan-500/20"
                      }`}>
                        <UploadCloud className="w-8 h-8 animate-pulse" />
                      </div>
                      <div>
                        <button
                          onClick={onButtonClick}
                          className={`text-sm font-bold transition-colors cursor-pointer ${
                            theme === "light" ? "text-cyan-600 hover:text-cyan-705" : "text-cyan-400 hover:text-cyan-300"
                          }`}
                        >
                          Choose a record file
                        </button>
                        <p className={`text-xs mt-1 transition-colors ${theme === "light" ? "text-slate-400" : "text-slate-500"}`}>or drag & drop your document here</p>
                      </div>
                      <span className={`text-[9px] tracking-wider uppercase font-bold transition-colors ${
                        theme === "light" ? "text-slate-400" : "text-slate-600"
                      }`}>
                        SUPPORTED: PDF, TXT, MD, PNG, JPG, CSV, JSON (Limit 15MB)
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.json,.csv"
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`w-full border rounded-xl p-4 flex items-center justify-between shadow-sm transition-colors ${
                        theme === "light"
                          ? "bg-slate-50/50 border-slate-200 text-slate-800"
                          : "bg-white/[0.02] border-white/10 text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2.5 rounded-lg flex-shrink-0 border transition-colors ${
                          theme === "light"
                            ? "bg-cyan-50 text-cyan-600 border-cyan-200"
                            : "bg-cyan-950 text-cyan-400 border-cyan-500/10"
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate transition-colors ${theme === "light" ? "text-slate-800" : "text-slate-200"}`}>{uploadedFile.name}</p>
                          <p className={`text-[10px] font-medium transition-colors ${theme === "light" ? "text-slate-400" : "text-slate-500"}`}>
                            {uploadedFile.size} • {uploadedFile.mimeType}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={clearSelectedFile}
                        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  {uploadedFile && (
                    <div className={`w-full mt-4 rounded-lg p-3 border text-[11px] flex items-start gap-2 transition-colors ${
                      theme === "light"
                        ? "bg-cyan-50/50 border-cyan-200 text-cyan-800"
                        : "bg-cyan-950/10 border-cyan-500/10 text-cyan-400/80"
                    }`}>
                      <Info className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${theme === "light" ? "text-cyan-600" : "text-cyan-400"}`} />
                      <span>
                        PDF files and images (PNG, JPEG) will be analyzed recursively via Gemini OCR. For text files, the text content has been loaded parallelly to the system memory.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Gemini Flash Upload Allowance State Indicator */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center md:flex-col md:items-stretch lg:flex-row lg:items-center justify-between gap-3 text-xs transition-all duration-300 shadow-md ${quotaBorderColor} ${quotaBgColor} ${
              theme === "light" ? "shadow-slate-100/40" : "shadow-black/25"
            }`}>
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${quotaDotColor} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${quotaDotColor}`}></span>
                </span>
                <div>
                  <p className={`font-semibold ${theme === "light" ? "text-slate-800" : "text-slate-200"}`}>Allowance Capacity Status</p>
                  <p className={`text-[10px] mt-0.5 font-medium ${quotaTextColor}`}>{quotaStatusText}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto md:self-stretch md:justify-between lg:self-auto">
                <span className={`font-mono px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
                  theme === "light"
                    ? "bg-slate-100 border-slate-200 text-slate-700"
                    : "bg-black/40 border-white/5 text-slate-300"
                }`}>
                  {remainingUploads} / 15 remaining
                </span>
                {remainingUploads < 15 && (
                  <button
                    onClick={resetQuota}
                    className={`text-[10px] font-extrabold px-2.5 py-1 border rounded-lg transition-colors uppercase cursor-pointer tracking-wider ${
                      theme === "light"
                        ? "bg-white border-slate-200 text-cyan-600 hover:bg-slate-50 hover:text-cyan-700"
                        : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-cyan-400 hover:text-cyan-300"
                    }`}
                    title="Restore remaining uploads capacity to full"
                  >
                    Reset Quota
                  </button>
                )}
              </div>
            </div>

            {/* Privacy Disclaimer and Usage Warning (Gemini Free tier) */}
            <div className={`rounded-2xl p-4 flex gap-3 shadow-md ${
              theme === "light"
                ? "bg-amber-50/70 border border-amber-200/80 text-amber-950 shadow-slate-100/40"
                : "bg-amber-950/10 border border-amber-500/20 text-slate-300 shadow-black/35"
            }`}>
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className={`font-bold mb-0.5 ${theme === "light" ? "text-amber-900" : "text-amber-400"}`}>Usage & Privacy Notice</p>
                <p className={`font-medium text-[11px] ${theme === "light" ? "text-amber-800" : "text-slate-400"}`}>
                  This service is built on the <strong className={`${theme === "light" ? "text-amber-900" : "text-amber-400"} font-bold`}>Gemini Free Tier API</strong>. Please do not upload, paste, or process any highly sensitive documents, credentials, personally identifiable details, or proprietary corporate data.
                </p>
              </div>
            </div>

            {/* ACTION STYLE CONTROLS PANEL */}
            <div className={`rounded-2xl border shadow-lg p-5 flex flex-col gap-4 transition-colors ${
              theme === "light"
                ? "bg-white border-slate-200 shadow-slate-100/50"
                : "bg-[#080a0f] border-white/10 shadow-black/30"
            }`}>
              <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider border-b pb-2 transition-colors ${
                theme === "light" ? "text-slate-500 border-slate-100" : "text-slate-400 border-white/5"
              }`}>
                <Sliders className="w-4 h-4 text-cyan-500 font-semibold" id="sliders_icon" />
                <span>Summarization Controls</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Format layout choice */}
                <div className="flex flex-col gap-1.5">
                  <label className={`text-[11px] font-bold transition-colors ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>Summary Format</label>
                  <select
                    value={options.format}
                    onChange={(e) => setOptions({ ...options, format: e.target.value as any })}
                    className={`text-xs border rounded-lg pl-2 pr-7 py-2 md:pl-3 md:pr-8 md:py-2.5 font-medium focus:outline-none focus:border-cyan-500/55 transition-all cursor-pointer ${
                      theme === "light"
                        ? "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                        : "bg-white/[0.03] border-white/10 text-slate-200 hover:bg-white/[0.05]"
                    }`}
                  >
                    <option value="key_points_per_topic" className={`${theme === "light" ? "bg-white text-slate-800" : "bg-[#0a0f18] text-slate-200"}`}>Key Points per Topic</option>
                    <option value="executive_summary" className={`${theme === "light" ? "bg-white text-slate-800" : "bg-[#0a0f18] text-slate-200"}`}>Executive Summary</option>
                    <option value="bullets" className={`${theme === "light" ? "bg-white text-slate-800" : "bg-[#0a0f18] text-slate-200"}`}>Clean Dense Bullets</option>
                    <option value="eli5" className={`${theme === "light" ? "bg-white text-slate-800" : "bg-[#0a0f18] text-slate-200"}`}>ELI5 (Explain Like 5)</option>
                  </select>
                </div>

                {/* Length Choice */}
                <div className="flex flex-col gap-1.5">
                  <label className={`text-[11px] font-bold transition-colors ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>Target Length</label>
                  <select
                    value={options.length}
                    onChange={(e) => setOptions({ ...options, length: e.target.value as any })}
                    className={`text-xs border rounded-lg pl-2 pr-7 py-2 md:pl-3 md:pr-8 md:py-2.5 font-medium focus:outline-none focus:border-cyan-500/55 transition-all cursor-pointer ${
                      theme === "light"
                        ? "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                        : "bg-white/[0.03] border-white/10 text-slate-200 hover:bg-white/[0.05]"
                    }`}
                  >
                    <option value="short" className={`${theme === "light" ? "bg-white text-slate-800" : "bg-[#0a0f18] text-slate-200"}`}>Short & Sweet</option>
                    <option value="concise" className={`${theme === "light" ? "bg-white text-slate-800" : "bg-[#0a0f18] text-slate-200"}`}>Concise and Balanced</option>
                    <option value="detailed" className={`${theme === "light" ? "bg-white text-slate-800" : "bg-[#0a0f18] text-slate-200"}`}>In-depth Detail</option>
                  </select>
                </div>

                {/* Focus choice */}
                <div className="flex flex-col gap-1.5">
                  <label className={`text-[11px] font-bold transition-colors ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>Content Focus</label>
                  <select
                    value={options.focus}
                    onChange={(e) => setOptions({ ...options, focus: e.target.value as any })}
                    className={`text-xs border rounded-lg pl-2 pr-7 py-2 md:pl-3 md:pr-8 md:py-2.5 font-medium focus:outline-none focus:border-cyan-500/55 transition-all cursor-pointer ${
                      theme === "light"
                        ? "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                        : "bg-white/[0.03] border-white/10 text-slate-200 hover:bg-white/[0.05]"
                    }`}
                  >
                    <option value="general" className={`${theme === "light" ? "bg-white text-slate-800" : "bg-[#0a0f18] text-slate-200"}`}>General Overview</option>
                    <option value="action_items" className={`${theme === "light" ? "bg-white text-slate-800" : "bg-[#0a0f18] text-slate-200"}`}>Action Items & Deliverables</option>
                    <option value="key_decisions" className={`${theme === "light" ? "bg-white text-slate-800" : "bg-[#0a0f18] text-slate-200"}`}>Key Consensus / Decisions</option>
                    <option value="technical" className={`${theme === "light" ? "bg-white text-slate-800" : "bg-[#0a0f18] text-slate-200"}`}>Technical Specs / Metrics</option>
                  </select>
                </div>

                {/* Tone choice */}
                <div className="flex flex-col gap-1.5">
                  <label className={`text-[11px] font-bold transition-colors ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>Executive Tone</label>
                  <select
                    value={options.tone}
                    onChange={(e) => setOptions({ ...options, tone: e.target.value as any })}
                    className={`text-xs border rounded-lg pl-2 pr-7 py-2 md:pl-3 md:pr-8 md:py-2.5 font-medium focus:outline-none focus:border-cyan-500/55 transition-all cursor-pointer ${
                      theme === "light"
                        ? "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                        : "bg-white/[0.03] border-white/10 text-slate-200 hover:bg-white/[0.05]"
                    }`}
                  >
                    <option value="professional" className={`${theme === "light" ? "bg-white text-slate-800" : "bg-[#0a0f18] text-slate-200"}`}>Professional</option>
                    <option value="insightful" className={`${theme === "light" ? "bg-white text-slate-800" : "bg-[#0a0f18] text-slate-200"}`}>Insightful / Analytical</option>
                    <option value="casual" className={`${theme === "light" ? "bg-white text-slate-800" : "bg-[#0a0f18] text-slate-200"}`}>Casual / Friendly</option>
                    <option value="academic" className={`${theme === "light" ? "bg-white text-slate-800" : "bg-[#0a0f18] text-slate-200"}`}>Academic / Rigorous</option>
                    <option value="simplified" className={`${theme === "light" ? "bg-white text-slate-800" : "bg-[#0a0f18] text-slate-200"}`}>Simplified / Clear</option>
                  </select>
                </div>
              </div>
            </div>

            {/* COMPOSER SUBMIT BUTTON */}
            <button
              onClick={handleSummarizeSubmit}
              disabled={isLoading || (!sourceText.trim() && !uploadedFile)}
              className={`w-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:scale-[1.01] hover:from-cyan-500 hover:to-blue-600 text-white font-bold text-sm py-4 rounded-xl shadow-lg cursor-pointer transition-all duration-250 flex items-center justify-center gap-2 transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${
                theme === "light"
                  ? "shadow-[0_4px_20px_rgba(8,145,178,0.15)] hover:shadow-[0_4px_25px_rgba(8,145,178,0.25)]"
                  : "shadow-[0_4px_25px_rgba(8,145,178,0.25)] hover:shadow-[0_4px_30px_rgba(8,145,178,0.4)]"
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-cyan-200" />
                  <span className="font-semibold tracking-wide text-cyan-50">AI summarization in progress...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-cyan-100" />
                  <span className="font-bold uppercase tracking-wider">Generate Summary Report</span>
                </>
              )}
            </button>

            {/* STATUS DIALOG BOX & EXCEPTION LOGS */}
            <AnimatePresence>
              {isLoading && statusMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`border rounded-xl p-3.5 flex items-center gap-3 text-xs shadow-sm transition-colors ${
                    theme === "light"
                      ? "bg-cyan-50 border-cyan-200 text-cyan-800"
                      : "bg-cyan-950/20 border-cyan-500/20 text-cyan-300"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full animate-bounce ${theme === "light" ? "bg-cyan-600" : "bg-cyan-400"}`}></div>
                  <span className="font-semibold animate-pulse">{statusMessage}</span>
                </motion.div>
              )}

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`border rounded-xl p-3.5 flex items-start gap-2.5 text-xs shadow-sm transition-colors ${
                    theme === "light"
                      ? "bg-rose-50 border-rose-200 text-rose-850"
                      : "bg-rose-950/20 border-rose-500/20 text-rose-300"
                  }`}
                >
                  <Info className={`w-4 h-4 mt-0.5 flex-shrink-0 ${theme === "light" ? "text-rose-600" : "text-rose-400"}`} />
                  <div className="font-medium leading-relaxed">{errorMessage}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* MIDDLE SUMMARIZED OUTPUT BLOCK (collapsible layout details) */}
          <div className="col-span-12 md:col-span-7 order-2 flex flex-col gap-4 transition-all duration-300">
                 {/* Header Tabs */}
            {summaryResult ? (
              <div className={`flex flex-row items-center justify-between gap-3 border-b pb-3 transition-colors ${
                theme === "light" ? "border-slate-200" : "border-white/5"
              }`}>
                <div className={`flex p-1 rounded-xl border transition-colors ${
                  theme === "light" ? "bg-slate-200/50 border-slate-300/60" : "bg-white/[0.02] border-white/5"
                }`}>
                  <button
                    onClick={() => setOutputTab("formatted")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      outputTab === "formatted"
                        ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-sm"
                        : theme === "light"
                        ? "text-slate-600 hover:text-slate-900"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Formatted</span>
                  </button>
                  <button
                    onClick={() => setOutputTab("markdown")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      outputTab === "markdown"
                        ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-sm"
                        : theme === "light"
                        ? "text-slate-600 hover:text-slate-900"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Markdown</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
                  {/* Toggle Sidebar Icon Button */}
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`p-2 border rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      isSidebarOpen
                        ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400 font-extrabold shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                        : theme === "light"
                        ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-cyan-600"
                        : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.07] hover:text-cyan-400"
                    }`}
                    title={isSidebarOpen ? "Collapse Recent Summaries" : "Expand Recent Summaries"}
                  >
                    <History className={`w-3.5 h-3.5 ${isSidebarOpen ? "animate-pulse text-cyan-400" : ""}`} />
                    <span className="text-[10px] font-bold">
                      <span className="hidden xl:inline">History </span>({history.length})
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className={`flex flex-row items-center justify-between gap-3 border-b pb-3 transition-colors ${
                theme === "light" ? "border-slate-200" : "border-white/5"
              }`}>
                <div className={`text-xs font-bold uppercase tracking-widest font-mono transition-colors ${
                  theme === "light" ? "text-slate-400" : "text-slate-500"
                }`}>
                  Summarization Output Workspace
                </div>
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={`p-2 border rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSidebarOpen
                      ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400 font-extrabold shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                      : theme === "light"
                      ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-cyan-600"
                      : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.07] hover:text-cyan-400"
                  }`}
                  title={isSidebarOpen ? "Collapse Recent Summaries" : "Expand Recent Summaries"}
                >
                  <History className={`w-3.5 h-3.5 ${isSidebarOpen ? "animate-pulse text-cyan-400" : ""}`} />
                  <span className="text-[10px] font-bold">
                    <span className="hidden xl:inline">History </span>({history.length})
                  </span>
                </button>
              </div>
            )}

            {/* Work Content Displays */}
            <div className={`rounded-2xl border flex-1 flex flex-col overflow-hidden min-h-[450px] transition-colors ${
              theme === "light"
                ? "bg-white border-slate-200 shadow-lg shadow-slate-100/50"
                : "bg-[#080a0f] border-white/10 shadow-lg shadow-black/35"
            }`}>
              {summaryResult ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* COMPRESS QUALITY STATS INSIGHTS */}
                  <div className={`border-b px-4 py-3 flex flex-row items-center justify-between text-[11px] font-medium transition-colors ${
                    theme === "light"
                      ? "bg-slate-50/50 border-slate-100 text-slate-500"
                      : "bg-[#0c0f16] border-white/5 text-slate-400"
                  }`}>
                    {sourceText ? (
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Executive Digest efficiency:</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-400 uppercase tracking-wider text-[10px] font-bold font-mono">
                        Summary Result
                      </div>
                    )}

                    {sourceText && (
                      <div className={`font-bold border px-2.5 py-0.5 rounded-full transition-colors shrink-0 ${
                        theme === "light"
                          ? "text-cyan-700 bg-cyan-50 border-cyan-200"
                          : "text-cyan-400 bg-cyan-950/40 border-cyan-500/20"
                      }`}>
                        {compressedRatio}% Condensed
                      </div>
                    )}
                  </div>

                  {/* TOOLBAR ACTION CONTROLS */}
                  <div className={`border-b px-4 py-2 flex flex-row items-center justify-end transition-colors ${
                    theme === "light"
                      ? "bg-slate-50/20 border-slate-100/50"
                      : "bg-white/[0.01] border-white/5"
                  }`}>
                    <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
                      <button
                        onClick={() => handleCopyToClipboard("markdown")}
                        className={`px-2.5 py-1.5 border rounded-lg text-[10px] font-bold shadow-sm transition-colors flex items-center gap-1 cursor-pointer ${
                          theme === "light"
                            ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-cyan-600"
                            : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.07] hover:text-cyan-400"
                        }`}
                        title="Copy Raw Markdown code"
                      >
                        {copiedType === "markdown" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>MD</span>
                      </button>
                      <button
                        onClick={() => handleCopyToClipboard("plain")}
                        className={`px-2.5 py-1.5 border rounded-lg text-[10px] font-bold shadow-sm transition-colors flex items-center gap-1 cursor-pointer ${
                          theme === "light"
                            ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-cyan-600"
                            : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.07] hover:text-cyan-400"
                        }`}
                        title="Copy clean normalized text"
                      >
                        {copiedType === "plain" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>Text</span>
                      </button>
                      <button
                        onClick={handleDownloadFile}
                        className={`p-1.5 border rounded-lg shadow-sm transition-colors cursor-pointer ${
                          theme === "light"
                            ? "bg-white border-slate-200 text-cyan-600 hover:bg-slate-50 hover:text-cyan-700"
                            : "bg-white/[0.03] border-white/10 text-cyan-400 hover:bg-cyan-950/20"
                        }`}
                        title="Download summary report (.md)"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Render content panels */}
                  <div className={`flex-1 overflow-y-auto p-6 custom-scrollbar transition-colors ${
                    theme === "light" ? "text-slate-800" : "text-slate-300"
                  }`}>
                    {outputTab === "formatted" ? (
                      <div className="markdown-body">
                        <Markdown>{summaryResult}</Markdown>
                      </div>
                    ) : (
                      <pre className={`text-xs font-mono h-full w-full p-4 rounded-xl overflow-x-auto select-all whitespace-pre-wrap leading-relaxed border transition-colors ${
                        theme === "light"
                          ? "bg-slate-50 text-slate-850 border-slate-200"
                          : "bg-[#04060a] text-slate-300 border-white/5"
                      }`}>
                        <code>{summaryResult}</code>
                      </pre>
                    )}
                  </div>
                </div>
              ) : (
                /* Pure Empty State Dashboard Screen */
                <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center bg-radial transition-all ${
                  theme === "light"
                    ? "from-cyan-50/50 to-transparent"
                    : "from-cyan-950/5 to-transparent"
                }`}>
                  <div className={`border p-4 rounded-2xl shadow-inner mb-4 relative transition-colors ${
                    theme === "light"
                      ? "bg-white border-slate-200 text-slate-500"
                      : "bg-white/[0.01] border-white/5 text-slate-400"
                  }`}>
                    <Sparkles className="w-10 h-10 text-cyan-500 absolute -top-1 -right-1 animate-pulse" />
                    <BookOpen className={`w-10 h-10 transition-colors ${theme === "light" ? "text-cyan-600/70" : "text-cyan-500/70"}`} />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold transition-colors ${theme === "light" ? "text-slate-800" : "text-white"}`}>No summary assembled yet</h3>
                    <p className={`text-xs max-w-xs mx-auto mt-2 leading-relaxed transition-colors ${theme === "light" ? "text-slate-500" : "text-slate-500"}`}>
                      Enter copied materials, write direct briefings, or drag-and-drop structural documents to synthesize instantaneous summaries with Gemini Flash.
                    </p>
                  </div>

                  {/* Prompt Quick Starter Cards */}
                  <div className="grid grid-cols-1 gap-2.5 mt-8 w-full max-w-sm">
                    <div className={`border p-3 rounded-xl text-left text-[11px] transition-all flex items-center justify-between cursor-pointer group shadow-sm ${
                      theme === "light"
                        ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-950"
                        : "bg-white/[0.01] hover:bg-white/[0.03] border-white/5 text-slate-500 hover:text-white"
                    }`}
                         onClick={() => {
                           setInputMode("text");
                           setSourceText("Project Atlas Executive Status briefing: Quarter 2 roadmap objectives are verified. Core server migrations are compiled with 98% compatibility rating. Database replication states represent a minor bottleneck due to high container latency in local subnets. Action: deploy localized proxy cache nodes before June 15th to address database queries speeds.");
                         }}>
                      <div>
                        <span className={`font-bold block transition-colors ${theme === "light" ? "text-slate-700 group-hover:text-cyan-700" : "text-slate-300 group-hover:text-cyan-45 transition-colors"}`}>Try a Text Sample</span>
                        <span className={`block line-clamp-1 mt-0.5 transition-colors ${theme === "light" ? "text-slate-450" : "text-slate-500"}`}>Project Atlas Executive Status briefing...</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 group-hover:translate-x-0.5 transition-all ${theme === "light" ? "text-slate-400 group-hover:text-cyan-600" : "text-slate-500 group-hover:text-cyan-405"}`} />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
          
        </div>
      </main>

      <footer className={`mt-16 border-t py-8 text-center text-xs font-semibold transition-colors ${
        theme === "light" ? "border-slate-200 text-slate-400" : "border-white/5 text-slate-600"
      }`}>
        <p>© 2026 Summarly AI. Crafted securely via Google Gemini 3.5 Flash server-side integration.</p>
      </footer>
    </div>
  );
}
