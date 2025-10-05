import * as pdfjs from "pdfjs-dist";

// Configure worker path for client-side processing
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

export interface ParseResult {
  text: string;
  wordCount: number;
  pageCount: number;
  parseWarnings: string[];
}

/**
 * Parse PDF file and extract text content
 * Handles multi-page documents with smart content extraction
 */
export async function parsePDF(file: File): Promise<ParseResult> {
  const warnings: string[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    const pageCount = pdf.numPages;

    // Warn if resume is too long
    if (pageCount > 3) {
      warnings.push(
        `Resume has ${pageCount} pages. Consider keeping it to 2-3 pages for better results.`
      );
    }

    let fullText = "";

    // Parse first 3 pages only (reasonable resume length)
    const maxPages = Math.min(pageCount, 3);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Extract text items and join them
      const pageText = textContent.items
        .filter((item: any) => item.str && typeof item.str === "string")
        .map((item: any) => item.str)
        .join(" ")
        .replace(/\s+/g, " ") // Normalize whitespace
        .replace(/(\w)-\s+(\w)/g, "$1$2") // Fix hyphenated line breaks common in PDFs
        .trim();

      if (pageText) {
        fullText += pageText + "\n\n";
      }
    }

    const cleanText = fullText.trim();

    // Calculate word count
    const words = cleanText.split(/\s+/).filter((word) => word.length > 0);
    const wordCount = words.length;

    // Content validation warnings
    if (wordCount > 1200) {
      warnings.push(
        `Resume is ${wordCount} words. Consider trimming to under 1000 words for optimal analysis.`
      );
    }

    if (wordCount < 100) {
      warnings.push(
        "Resume appears to be very short. Ensure all content was parsed correctly."
      );
    }

    // Check for potential parsing issues
    if (cleanText.length < file.size / 100) {
      warnings.push(
        "PDF may contain mostly images or complex formatting. Consider using a text-based format."
      );
    }

    return {
      text: cleanText,
      wordCount,
      pageCount: maxPages,
      parseWarnings: warnings,
    };
  } catch (error) {
    console.error("PDF parsing error:", error);

    // Provide helpful error messages based on common issues
    if (error instanceof Error) {
      if (error.message.includes("Invalid PDF")) {
        throw new Error(
          "Invalid PDF file. Please ensure the file is not corrupted."
        );
      }
      if (error.message.includes("password")) {
        throw new Error(
          "Password-protected PDFs are not supported. Please provide an unprotected version."
        );
      }
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }

    throw new Error(
      "Failed to parse PDF. Please try a different file or format."
    );
  }
}
