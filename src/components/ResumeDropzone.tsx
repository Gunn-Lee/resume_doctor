import {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { Upload, FileText, X, RefreshCw } from "lucide-react";
import { cn, formatFileSize } from "../lib/utils";
import type { ParsedResume } from "../types";

/**
 * Props for the ResumeDropzone component
 */
interface ResumeDropzoneProps {
  /** Callback when a file is selected */
  onFileSelect: (file: File) => void;
  /** The currently parsed resume data, or null if none */
  parsedResume: ParsedResume | null;
  /** Callback to clear the current resume */
  onClear: () => void;
}

/** Available tab types for the dropzone */
type TabType = "upload" | "paste";

/** Accepted file types for upload */
const ACCEPTED_FILE_TYPES = ".pdf,.docx,.doc,.md,.txt";
/** Maximum file size in bytes (1MB) */
const MAX_FILE_SIZE = 1024 * 1024;

/**
 * File upload and text input component with preview
 */
export default function ResumeDropzone({
  onFileSelect,
  parsedResume,
  onClear,
}: ResumeDropzoneProps) {
  const [activeTab, setActiveTab] = useState<TabType>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update text area when parsed resume changes
  useEffect(() => {
    if (parsedResume && parsedResume.text) {
      setTextValue(parsedResume.text);
      // Switch to paste tab to show the text
      if (parsedResume.source === "file") {
        setActiveTab("paste");
      }
    }
  }, [parsedResume]);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be under 1MB (${formatFileSize(
        file.size
      )} provided)`;
    }

    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/markdown",
      "text/plain",
    ];

    if (
      !validTypes.includes(file.type) &&
      !file.name.match(/\.(pdf|docx?|md|txt)$/i)
    ) {
      return "Please upload a PDF, DOCX, MD, or TXT file";
    }

    return null;
  };

  const handleFile = (file: File) => {
    setError("");
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    onFileSelect(file);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Tabs */}
      <div
        className="flex border-b"
        role="tablist"
        aria-label="Resume input method"
      >
        <button
          onClick={() => setActiveTab("upload")}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors relative",
            activeTab === "upload"
              ? "bg-primary text-primary-foreground"
              : "bg-background hover:bg-muted"
          )}
          role="tab"
          aria-selected={activeTab === "upload"}
          aria-controls="upload-panel"
        >
          <Upload className="inline-block mr-2 h-4 w-4" />
          Upload File
          {parsedResume && parsedResume.source === "file" && (
            <span className="absolute top-2 right-2 h-2 w-2 bg-green-500 rounded-full"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("paste")}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors relative",
            activeTab === "paste"
              ? "bg-primary text-primary-foreground"
              : "bg-background hover:bg-muted"
          )}
          role="tab"
          aria-selected={activeTab === "paste"}
          aria-controls="paste-panel"
        >
          <FileText className="inline-block mr-2 h-4 w-4" />
          Paste Text
          {parsedResume && textValue.length > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 bg-green-500 rounded-full"></span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="px-6 py-3">
        {activeTab === "upload" ? (
          <div
            className="flex flex-col h-[300px]"
            role="tabpanel"
            id="upload-panel"
            aria-labelledby="upload-tab"
          >
            {parsedResume && parsedResume.source === "file" ? (
              /* Show uploaded file info */
              <div className="flex flex-col flex-1 border-2 border-primary rounded-lg p-6 bg-primary/5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-medium text-lg">Uploaded File</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {parsedResume.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Size: {formatFileSize(parsedResume.fileSize)} • Words:{" "}
                      {parsedResume.wordCount} • Pages: {parsedResume.pageCount}
                    </p>
                  </div>
                  <button
                    onClick={onClear}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <X className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>

                {/* Warnings if any */}
                {parsedResume.parseWarnings.length > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs font-medium text-yellow-800 mb-1">
                      Parsing Notes:
                    </p>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {parsedResume.parseWarnings.map((warning, idx) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Spacer to push button to bottom */}
                <div className="flex-1"></div>

                {/* Replace file button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <RefreshCw className="h-4 w-4" />
                  Replace File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            ) : (
              /* Show upload dropzone */
              <>
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "flex-1 border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer flex flex-col items-center justify-center",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Drag and drop your resume here
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse files
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports: PDF, DOCX, MD, TXT (max 1MB)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </>
            )}
          </div>
        ) : (
          <div
            className="h-[300px] flex flex-col"
            role="tabpanel"
            id="paste-panel"
            aria-labelledby="paste-tab"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {textValue.length} characters
              </span>
              {parsedResume && textValue.length > 0 && (
                <button
                  onClick={() => {
                    setTextValue("");
                    onClear();
                  }}
                  className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
            <textarea
              name="resumeText"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Paste your resume text here..."
              className="w-full flex-1 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-muted-foreground">
                {parsedResume ? "Text can be edited" : "Minimum 200 characters"}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
