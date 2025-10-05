import { parsePDF } from "./pdfParser";
import { parseDOCX } from "./docxParser";
import { parseMarkdown } from "./markdownParser";
import type { ParseResult } from "./pdfParser";

export type { ParseResult };

/**
 * Parse uploaded file based on type detection
 * Supports PDF, DOCX, Markdown, and plain text files
 */
export async function parseFile(file: File): Promise<ParseResult> {
  // Validate file size (1MB limit to prevent large uploads)
  const maxSize = 1 * 1024 * 1024; // 1MB
  if (file.size > maxSize) {
    throw new Error(
      "File size must be under 1MB. Please compress or trim your resume."
    );
  }

  // Validate file size minimum (prevent empty files)
  if (file.size < 100) {
    throw new Error(
      "File appears to be empty or too small to contain a resume."
    );
  }

  // Detect file type using both MIME type and extension
  const extension = file.name.toLowerCase().split(".").pop() || "";
  const mimeType = file.type.toLowerCase();

  try {
    // PDF files
    if (mimeType === "application/pdf" || extension === "pdf") {
      return await parsePDF(file);
    }

    // DOCX files (Word documents)
    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      extension === "docx"
    ) {
      return await parseDOCX(file);
    }

    // DOC files (legacy Word) - not fully supported, but we can try
    if (mimeType === "application/msword" || extension === "doc") {
      throw new Error(
        "Legacy .doc files are not supported. Please save as .docx or export as PDF."
      );
    }

    // Markdown files
    if (
      mimeType === "text/markdown" ||
      extension === "md" ||
      extension === "markdown"
    ) {
      return await parseMarkdown(file);
    }

    // Plain text files
    if (
      mimeType.startsWith("text/") ||
      extension === "txt" ||
      mimeType === "" // Sometimes plain text files have no MIME type
    ) {
      return parseTextFile(file);
    }

    // Unsupported file type
    const supportedFormats = "PDF, DOCX, Markdown (.md), or plain text (.txt)";
    throw new Error(
      `Unsupported file type: "${
        extension || mimeType
      }". Please use ${supportedFormats}.`
    );
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to parse file. Please try a different format.");
  }
}

/**
 * Parse plain text file
 */
async function parseTextFile(file: File): Promise<ParseResult> {
  try {
    const text = await file.text();
    return parseTextInput(text);
  } catch (error) {
    throw new Error(
      "Failed to read text file. Please ensure the file is not corrupted."
    );
  }
}

/**
 * Parse pasted text input
 * Used for both text files and direct text paste
 */
export function parseTextInput(text: string): ParseResult {
  const warnings: string[] = [];

  // Clean and normalize the text
  const cleanText = text
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/\n{3,}/g, "\n\n") // Limit consecutive newlines
    .replace(/[""]/g, '"') // Normalize smart quotes
    .replace(/['']/g, "'") // Normalize smart apostrophes
    .replace(/[–—]/g, "-") // Normalize dashes
    .replace(/•/g, "•") // Normalize bullet points
    .trim();

  // Calculate word count
  const words = cleanText.split(/\s+/).filter((word) => word.length > 0);
  const wordCount = words.length;

  // Content validation and warnings
  if (wordCount < 200) {
    warnings.push(
      "Resume text is quite short. Consider adding more details for better analysis."
    );
  }

  if (wordCount > 1200) {
    warnings.push(
      `Resume is ${wordCount} words. Consider trimming to under 1000 words for optimal analysis.`
    );
  }

  // Estimate page count (roughly 500 words per page)
  const pageCount = Math.ceil(wordCount / 500);

  if (pageCount > 3) {
    warnings.push(
      `Resume appears to be ${pageCount} pages. Consider keeping it to 2-3 pages.`
    );
  }

  // Check for common formatting issues
  if (cleanText.includes("\\n") || cleanText.includes("\\t")) {
    warnings.push(
      "Text contains escape characters. Consider cleaning up the formatting."
    );
  }

  // Check for potential encoding issues
  if (cleanText.includes("�")) {
    warnings.push(
      "Text may contain encoding issues. Consider re-copying or using a different source."
    );
  }

  return {
    text: cleanText,
    wordCount,
    pageCount,
    parseWarnings: warnings,
  };
}

/**
 * Validate file before parsing (quick checks)
 */
export function validateFile(file: File): { isValid: boolean; error?: string } {
  // Check file size
  const maxSize = 1 * 1024 * 1024; // 1MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "File size must be under 1MB",
    };
  }

  if (file.size < 100) {
    return {
      isValid: false,
      error: "File appears to be empty",
    };
  }

  // Check file type
  const extension = file.name.toLowerCase().split(".").pop() || "";
  const allowedExtensions = ["pdf", "docx", "md", "markdown", "txt"];
  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/markdown",
    "text/plain",
  ];

  const hasValidExtension = allowedExtensions.includes(extension);
  const hasValidMimeType = allowedMimeTypes.includes(file.type.toLowerCase());

  // Allow files with valid extension even if MIME type is missing/incorrect
  if (!hasValidExtension && !hasValidMimeType) {
    return {
      isValid: false,
      error: `Unsupported file type. Please use PDF, DOCX, Markdown, or plain text.`,
    };
  }

  return { isValid: true };
}
