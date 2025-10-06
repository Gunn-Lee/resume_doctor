import { useState, useEffect, useRef } from "react";
import { Copy, Download, ExternalLink, Loader2, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AnalysisResult } from "../types";

/** Duration in milliseconds to show "Copied!" message */
const COPY_SUCCESS_DURATION = 2000;

/**
 * Props for the ResultPane component
 */
interface ResultPaneProps {
  /** The analysis result to display, or null if no results yet */
  result: AnalysisResult | null;
  /** Whether results are currently streaming in */
  isStreaming: boolean;
}

/**
 * Display analysis results with actions
 */
export default function ResultPane({ result, isStreaming }: ResultPaneProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as content streams
  useEffect(() => {
    if (isStreaming && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [result?.content, isStreaming]);

  const handleCopy = async () => {
    if (!result?.content) return;

    try {
      await navigator.clipboard.writeText(result.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), COPY_SUCCESS_DURATION);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDownload = () => {
    if (!result?.content) return;

    const blob = new Blob([result.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume-analysis-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenInNewTab = () => {
    if (!result?.content) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Resume Analysis Results</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
          }
          h1 { color: #333; }
          pre { white-space: pre-wrap; word-wrap: break-word; }
        </style>
      </head>
      <body>
        <h1>Resume Analysis Results</h1>
        <p><small>Generated: ${result.timestamp.toLocaleString()}</small></p>
        <hr />
        <pre>${result.content}</pre>
      </body>
      </html>
    `;

    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    }
  };

  // Empty state
  if (!result && !isStreaming) {
    return (
      <div
        className="border-2 border-dashed rounded-lg p-12 text-center lg:h-[600px] flex flex-col items-center justify-center"
        role="status"
        aria-label="No analysis results yet"
      >
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Results Yet</h3>
        <p className="text-sm text-muted-foreground">
          Upload your resume, configure the analysis, and click submit to get
          started.
        </p>
      </div>
    );
  }

  // Streaming state
  if (isStreaming && !result) {
    return (
      <div
        className="border rounded-lg p-8 lg:h-[600px]"
        role="status"
        aria-live="polite"
        aria-label="Analyzing resume"
      >
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-lg font-medium">Analyzing your resume...</p>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-2">
          This may take a moment
        </p>
      </div>
    );
  }

  // Results display
  return (
    <div className="h-full space-y-4">
      {/* Action Bar */}
      <div
        className="flex gap-2 justify-end"
        role="toolbar"
        aria-label="Analysis result actions"
      >
        <button
          onClick={handleCopy}
          className="px-3 py-2 border rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm"
          title="Copy to clipboard"
        >
          <Copy className="h-4 w-4" />
          {copySuccess ? "Copied!" : "Copy"}
        </button>
        <button
          onClick={handleDownload}
          className="px-3 py-2 border rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm"
          title="Download as text file"
        >
          <Download className="h-4 w-4" />
          Download
        </button>
        <button
          onClick={handleOpenInNewTab}
          className="px-3 py-2 border rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-sm"
          title="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" />
          Open
        </button>
      </div>

      {/* Results Content */}
      <div
        ref={contentRef}
        className="border rounded-lg p-6 bg-card lg:h-[600px] overflow-y-auto"
        role="article"
        aria-label="Resume analysis results"
      >
        {isStreaming && (
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Streaming results...</span>
          </div>
        )}

        <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-pre:bg-muted prose-pre:border">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {result?.content || ""}
          </ReactMarkdown>
        </div>

        {/* Auto-scroll anchor */}
        <div ref={bottomRef} />

        {result && !isStreaming && (
          <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
            Generated: {result.timestamp.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
