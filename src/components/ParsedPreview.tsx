import {
  X,
  FileText,
  AlertTriangle,
  Edit3,
  Save,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import type { ParsedResume } from "../types";
import { formatWordCount } from "../lib/utils";
import { parseTextInput } from "../lib/parsers";
import { useAppState } from "../store/useAppState";

interface ParsedPreviewProps {
  parsedResume: ParsedResume | null;
  onClear: () => void;
}

/**
 * Display parsed resume metadata with editing capabilities
 */
export default function ParsedPreview({
  parsedResume,
  onClear,
}: ParsedPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const { setParsedResume } = useAppState();

  if (!parsedResume) return null;

  const handleStartEdit = () => {
    setEditedText(parsedResume.text);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    try {
      const result = parseTextInput(editedText);
      setParsedResume({
        ...parsedResume,
        ...result,
        source: "edited",
        fileName: parsedResume.fileName + " (edited)",
        fileSize: editedText.length,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save edits:", error);
      // Could add error handling here
    }
  };

  const handleCancelEdit = () => {
    setEditedText("");
    setIsEditing(false);
  };

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Resume Loaded</h3>
        </div>
        <div className="flex items-center gap-1">
          {!isEditing && (
            <button
              onClick={handleStartEdit}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              title="Edit text"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClear}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            title="Clear resume"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Source:</span>
          <span className="font-medium capitalize">{parsedResume.source}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">File:</span>
          <span className="font-medium text-xs">{parsedResume.fileName}</span>
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
            ~{parsedResume.pageCount} page
            {parsedResume.pageCount > 1 ? "s" : ""}
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

      {/* Text preview or editing */}
      <div className="mt-4">
        {isEditing ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Edit Resume Text:</label>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 transition-colors"
                >
                  <Save className="h-3 w-3" />
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1 px-3 py-1 border rounded text-xs hover:bg-muted transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Cancel
                </button>
              </div>
            </div>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full h-[200px] p-3 border rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Edit your resume text..."
            />
            <div className="text-xs text-muted-foreground">
              {editedText.length} characters • ~
              {Math.ceil(editedText.length / 500)} pages
            </div>
          </div>
        ) : (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Preview:</p>
            <p className="text-sm">
              {parsedResume.text.slice(0, 300)}
              {parsedResume.text.length > 300 && "..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
