import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { Upload, FileText } from "lucide-react";
import { cn, formatFileSize } from "../lib/utils";

interface ResumeDropzoneProps {
  onFileSelect: (file: File) => void;
  onTextInput: (text: string) => void;
}

type TabType = "upload" | "paste";

const ACCEPTED_FILE_TYPES = ".pdf,.docx,.doc,.md,.txt";
const MAX_FILE_SIZE = 1024 * 1024; // 1MB

/**
 * File upload and text input component
 */
export default function ResumeDropzone({
  onFileSelect,
  onTextInput,
}: ResumeDropzoneProps) {
  const [activeTab, setActiveTab] = useState<TabType>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleTextSubmit = () => {
    if (textValue.trim().length === 0) {
      setError("Please enter some text");
      return;
    }

    if (textValue.length < 200) {
      setError("Resume text must be at least 200 characters");
      return;
    }

    setError("");
    onTextInput(textValue);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("upload")}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors",
            activeTab === "upload"
              ? "bg-primary text-primary-foreground"
              : "bg-background hover:bg-muted"
          )}
        >
          <Upload className="inline-block mr-2 h-4 w-4" />
          Upload File
        </button>
        <button
          onClick={() => setActiveTab("paste")}
          className={cn(
            "flex-1 px-4 py-3 text-sm font-medium transition-colors",
            activeTab === "paste"
              ? "bg-primary text-primary-foreground"
              : "bg-background hover:bg-muted"
          )}
        >
          <FileText className="inline-block mr-2 h-4 w-4" />
          Paste Text
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "upload" ? (
          <div className="h-[300px]">
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer",
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
          </div>
        ) : (
          <div className="h-[300px] flex flex-col">
            <textarea
              name="resumeText"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Paste your resume text here..."
              className="w-full flex-1 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                {textValue.length} characters
              </span>
              <button
                onClick={handleTextSubmit}
                disabled={textValue.length === 0}
                className={cn(
                  "px-6 py-2 rounded-lg font-medium transition-colors",
                  textValue.length > 0
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                Use This Text
              </button>
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
