import mammoth from "mammoth";
import type { ParseResult } from "./pdfParser";

/**
 * Parse DOCX file and extract text content
 * Uses mammoth to preserve formatting and structure
 */
export async function parseDOCX(file: File): Promise<ParseResult> {
  const warnings: string[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();

    // Extract raw text (preserves basic structure)
    const result = await mammoth.extractRawText({ arrayBuffer });

    // Check for parsing messages/warnings from mammoth
    if (result.messages.length > 0) {
      const errors = result.messages.filter((m) => m.type === "error");
      const warnings_count = result.messages.filter(
        (m) => m.type === "warning"
      ).length;

      if (errors.length > 0) {
        warnings.push(
          "Some formatting may not have been preserved during parsing."
        );
      }

      if (warnings_count > 5) {
        warnings.push(
          "Document contains complex formatting that may affect text extraction."
        );
      }
    }

    // Clean and normalize the extracted text
    const cleanText = result.value
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/\n{3,}/g, "\n\n") // Limit consecutive newlines
      .replace(/\u00A0/g, " ") // Replace non-breaking spaces
      .trim();

    // Calculate word count
    const words = cleanText.split(/\s+/).filter((word) => word.length > 0);
    const wordCount = words.length;

    // Content validation
    if (wordCount > 1200) {
      warnings.push(
        `Resume is ${wordCount} words. Consider trimming to under 1000 words for optimal analysis.`
      );
    }

    if (wordCount < 100) {
      warnings.push(
        "Resume appears to be very short. Ensure all content was included."
      );
    }

    // Estimate page count (roughly 500 words per page)
    const estimatedPages = Math.ceil(wordCount / 500);

    if (estimatedPages > 3) {
      warnings.push(
        `Resume appears to be ${estimatedPages} pages. Consider keeping it to 2-3 pages.`
      );
    }

    // Check for potential issues
    if (cleanText.length < 200 && file.size > 50000) {
      warnings.push(
        "Document may contain mostly images or tables. Consider a text-heavy format."
      );
    }

    return {
      text: cleanText,
      wordCount,
      pageCount: estimatedPages,
      parseWarnings: warnings,
    };
  } catch (error) {
    console.error("DOCX parsing error:", error);

    if (error instanceof Error) {
      if (error.message.includes("zip")) {
        throw new Error(
          "Invalid DOCX file. The file may be corrupted or not a valid Word document."
        );
      }
      if (error.message.includes("encrypted")) {
        throw new Error(
          "Password-protected documents are not supported. Please provide an unprotected version."
        );
      }
      throw new Error(`Failed to parse DOCX: ${error.message}`);
    }

    throw new Error(
      "Failed to parse DOCX file. Please try a different format."
    );
  }
}
