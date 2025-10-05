import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import type { ParseResult } from "./pdfParser";

/**
 * Parse Markdown file and normalize formatting
 * Uses unified/remark for consistent markdown processing
 */
export async function parseMarkdown(file: File): Promise<ParseResult> {
  const warnings: string[] = [];

  try {
    const text = await file.text();

    // Parse and re-stringify to clean up formatting
    const processor = unified().use(remarkParse).use(remarkStringify);

    const ast = processor.parse(text);
    const cleanText = processor.stringify(ast).toString();

    // Calculate word count (excluding markdown syntax)
    const plainText = cleanText
      .replace(/#{1,6}\s+/g, "") // Remove heading markers
      .replace(/\*{1,2}(.*?)\*{1,2}/g, "$1") // Remove emphasis markers
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Convert links to just text
      .replace(/`(.*?)`/g, "$1") // Remove code markers
      .replace(/^[-*+]\s+/gm, "") // Remove list markers
      .replace(/^\d+\.\s+/gm, "") // Remove numbered list markers
      .replace(/\n+/g, " ") // Convert newlines to spaces for word count
      .trim();

    const words = plainText.split(/\s+/).filter((word) => word.length > 0);
    const wordCount = words.length;

    // Content validation
    if (wordCount > 1200) {
      warnings.push(
        `Resume is ${wordCount} words. Consider trimming to under 1000 words for optimal analysis.`
      );
    }

    if (wordCount < 100) {
      warnings.push(
        "Resume appears to be very short. Consider adding more details."
      );
    }

    // Estimate page count
    const estimatedPages = Math.ceil(wordCount / 500);

    if (estimatedPages > 3) {
      warnings.push(
        `Resume appears to be ${estimatedPages} pages. Consider keeping it to 2-3 pages.`
      );
    }

    // Check for markdown-specific issues
    const linkCount = (text.match(/\[.*?\]\(.*?\)/g) || []).length;
    if (linkCount > 10) {
      warnings.push(
        "Resume contains many links. Ensure they are relevant and accessible."
      );
    }

    const codeBlockCount = (text.match(/```[\s\S]*?```/g) || []).length;
    if (codeBlockCount > 3) {
      warnings.push(
        "Resume contains multiple code blocks. Consider condensing technical examples."
      );
    }

    return {
      text: cleanText,
      wordCount,
      pageCount: estimatedPages,
      parseWarnings: warnings,
    };
  } catch (error) {
    console.error("Markdown parsing error:", error);

    if (error instanceof Error) {
      throw new Error(`Failed to parse Markdown: ${error.message}`);
    }

    throw new Error(
      "Failed to parse Markdown file. Please check the file format."
    );
  }
}
