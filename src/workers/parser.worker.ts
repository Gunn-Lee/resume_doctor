/**
 * Web Worker for file parsing
 * Will be implemented in future phase
 *
 * Supports: PDF, DOCX, Markdown
 */

interface ParseMessage {
  type: "parse";
  file: File;
}

interface ParseResult {
  success: boolean;
  text?: string;
  wordCount?: number;
  parseWarnings?: string[];
  error?: string;
}

self.addEventListener("message", (event: MessageEvent<ParseMessage>) => {
  const { file } = event.data;

  // Placeholder - will implement PDF/DOCX/MD parsing
  const result: ParseResult = {
    success: false,
    error: `File parsing not yet implemented - future phase (${file.name}, ${file.type})`,
  };

  self.postMessage(result);
});

// Export empty object to make TypeScript happy
export {};
