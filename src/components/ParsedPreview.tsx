import { X, FileText, AlertTriangle } from "lucide-react";
import type { ParsedResume } from "../types";
import { formatWordCount, estimatePages } from "../lib/utils";

interface ParsedPreviewProps {
  parsedResume: ParsedResume | null;
  onClear: () => void;
}

/**
 * Display parsed resume metadata
 */
export default function ParsedPreview({
  parsedResume,
  onClear,
}: ParsedPreviewProps) {
  if (!parsedResume) return null;

  const pages = estimatePages(parsedResume.wordCount);

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Resume Loaded</h3>
        </div>
        <button
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Clear resume"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Source:</span>
          <span className="font-medium capitalize">
            {parsedResume.sourceType}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Word Count:</span>
          <span className="font-medium">
            {formatWordCount(parsedResume.wordCount)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Estimated Pages:</span>
          <span className="font-medium">
            ~{pages} page{pages > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {parsedResume.parseWarnings.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Parsing Warnings
              </p>
              {parsedResume.parseWarnings.map((warning, index) => (
                <p
                  key={index}
                  className="text-xs text-yellow-800 dark:text-yellow-200"
                >
                  • {warning}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-muted rounded-lg">
        <p className="text-xs text-muted-foreground">
          Preview: {parsedResume.text.slice(0, 150)}...
        </p>
      </div>
    </div>
  );
}
