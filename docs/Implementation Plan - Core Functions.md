# Implementation Plan - Core Functions

**Project:** Resume Doctor  
**Purpose:** Implement core functionality for form handling, file parsing, resume preview, and analysis submission  
**Phase:** Core Features (Phase A-C)  
**Date:** October 5, 2025

---

## Overview

This document outlines the implementation plan for adding **core functionality** to Resume Doctor's base layer components. This transforms the UI shell into a fully functional resume analysis tool.

### Components to Implement

1. **PromptConfigForm** - Form validation, template selection, job context handling
2. **ResumeDropzone** - File parsing (PDF/DOCX/MD), text processing, validation
3. **ParsedPreview** - Resume metadata display, text preview, editing capabilities
4. **Submit Action** - reCAPTCHA integration, Gemini API calls, streaming results

---

## Phase A: File Parsing Implementation

### A1: PDF Parsing with pdf.js

**Dependencies to add:**

```bash
npm install pdfjs-dist
npm install --save-dev @types/pdfjs-dist
```

**Create parser service (`src/lib/parsers/pdfParser.ts`):**

```typescript
import * as pdfjs from "pdfjs-dist";

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

export interface ParseResult {
  text: string;
  wordCount: number;
  pageCount: number;
  parseWarnings: string[];
}

export async function parsePDF(file: File): Promise<ParseResult> {
  const warnings: string[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    const pageCount = pdf.numPages;
    if (pageCount > 3) {
      warnings.push(
        `Resume has ${pageCount} pages. Consider keeping it to 2-3 pages for better results.`
      );
    }

    let fullText = "";

    // Parse first 3 pages only
    const maxPages = Math.min(pageCount, 3);
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ")
        .replace(/\s+/g, " ") // Normalize whitespace
        .replace(/(\w)-\s+(\w)/g, "$1$2") // Fix hyphenated line breaks
        .trim();

      fullText += pageText + "\n\n";
    }

    const cleanText = fullText.trim();
    const wordCount = cleanText
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

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

    return {
      text: cleanText,
      wordCount,
      pageCount: maxPages,
      parseWarnings: warnings,
    };
  } catch (error) {
    throw new Error(
      `Failed to parse PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
```

### A2: DOCX Parsing with mammoth

**Dependencies to add:**

```bash
npm install mammoth
npm install --save-dev @types/mammoth
```

**Create DOCX parser (`src/lib/parsers/docxParser.ts`):**

```typescript
import mammoth from "mammoth";
import type { ParseResult } from "./pdfParser";

export async function parseDOCX(file: File): Promise<ParseResult> {
  const warnings: string[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    if (result.messages.length > 0) {
      const errors = result.messages.filter((m) => m.type === "error");
      if (errors.length > 0) {
        warnings.push(
          "Some formatting may not have been preserved during parsing."
        );
      }
    }

    const cleanText = result.value
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/\n{3,}/g, "\n\n") // Limit consecutive newlines
      .trim();

    const wordCount = cleanText
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

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

    // Estimate pages (500 words per page)
    const estimatedPages = Math.ceil(wordCount / 500);
    if (estimatedPages > 3) {
      warnings.push(
        `Resume appears to be ${estimatedPages} pages. Consider keeping it to 2-3 pages.`
      );
    }

    return {
      text: cleanText,
      wordCount,
      pageCount: estimatedPages,
      parseWarnings: warnings,
    };
  } catch (error) {
    throw new Error(
      `Failed to parse DOCX: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
```

### A3: Markdown Parsing

**Dependencies to add:**

```bash
npm install unified remark-parse remark-stringify
npm install --save-dev @types/mdast
```

**Create Markdown parser (`src/lib/parsers/markdownParser.ts`):**

```typescript
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import type { ParseResult } from "./pdfParser";

export async function parseMarkdown(file: File): Promise<ParseResult> {
  const warnings: string[] = [];

  try {
    const text = await file.text();

    // Parse and re-stringify to clean up formatting
    const processor = unified().use(remarkParse).use(remarkStringify, {
      bullet: "-",
      fences: true,
      incrementListMarker: false,
    });

    const ast = processor.parse(text);
    const cleanText = processor.stringify(ast);

    const wordCount = cleanText
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

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

    // Estimate pages
    const estimatedPages = Math.ceil(wordCount / 500);
    if (estimatedPages > 3) {
      warnings.push(
        `Resume appears to be ${estimatedPages} pages. Consider keeping it to 2-3 pages.`
      );
    }

    return {
      text: cleanText,
      wordCount,
      pageCount: estimatedPages,
      parseWarnings: warnings,
    };
  } catch (error) {
    throw new Error(
      `Failed to parse Markdown: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
```

### A4: Master Parser Service (`src/lib/parsers/index.ts`)

```typescript
import { parsePDF } from "./pdfParser";
import { parseDOCX } from "./docxParser";
import { parseMarkdown } from "./markdownParser";
import type { ParseResult } from "./pdfParser";

export type { ParseResult };

export async function parseFile(file: File): Promise<ParseResult> {
  // Validate file size (1MB limit)
  const maxSize = 1 * 1024 * 1024; // 1MB
  if (file.size > maxSize) {
    throw new Error(
      "File size must be under 1MB. Please compress or trim your resume."
    );
  }

  // Detect file type and route to appropriate parser
  const extension = file.name.toLowerCase().split(".").pop();
  const mimeType = file.type.toLowerCase();

  try {
    if (mimeType === "application/pdf" || extension === "pdf") {
      return await parsePDF(file);
    }

    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      extension === "docx"
    ) {
      return await parseDOCX(file);
    }

    if (mimeType === "text/markdown" || extension === "md") {
      return await parseMarkdown(file);
    }

    // Fallback: try parsing as text
    if (mimeType.startsWith("text/") || extension === "txt") {
      const text = await file.text();
      const wordCount = text
        .split(/\s+/)
        .filter((word) => word.length > 0).length;

      return {
        text: text.trim(),
        wordCount,
        pageCount: Math.ceil(wordCount / 500),
        parseWarnings:
          wordCount < 100 ? ["Resume appears to be very short."] : [],
      };
    }

    throw new Error(
      `Unsupported file type: ${
        extension || mimeType
      }. Please use PDF, DOCX, Markdown, or plain text.`
    );
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to parse file. Please try a different format.");
  }
}

export function parseTextInput(text: string): ParseResult {
  const cleanText = text
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/\n{3,}/g, "\n\n") // Limit consecutive newlines
    .trim();

  const wordCount = cleanText
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const warnings: string[] = [];

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

  return {
    text: cleanText,
    wordCount,
    pageCount: Math.ceil(wordCount / 500),
    parseWarnings: warnings,
  };
}
```

---

## Phase B: Update Components with Core Logic

### B1: Enhanced ResumeDropzone (`src/components/ResumeDropzone.tsx`)

**Key additions to existing component:**

```typescript
// Add to imports
import { parseFile, parseTextInput } from "../lib/parsers";
import { useAppState } from "../store/useAppState";

// Add to component (replace existing handlers)
const { setParsedResume } = useAppState();
const [isProcessing, setIsProcessing] = useState(false);

const handleFileSelect = async (file: File) => {
  if (isProcessing) return;

  setError("");
  setIsProcessing(true);

  try {
    const result = await parseFile(file);
    setParsedResume({
      source: "file",
      fileName: file.name,
      fileSize: file.size,
      ...result,
    });
    setActiveTab("upload"); // Stay on upload tab after success
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to parse file");
  } finally {
    setIsProcessing(false);
  }
};

const handleTextSubmit = () => {
  if (!textValue.trim() || isProcessing) return;

  setError("");
  setIsProcessing(true);

  try {
    const result = parseTextInput(textValue);
    setParsedResume({
      source: "text",
      fileName: "Pasted Text",
      fileSize: textValue.length,
      ...result,
    });
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to process text");
  } finally {
    setIsProcessing(false);
  }
};

// Update button text to show processing state
{
  isProcessing ? "Processing..." : "Use This Text";
}
```

### B2: Enhanced ParsedPreview (`src/components/ParsedPreview.tsx`)

**Key additions:**

```typescript
// Add text editing capabilities
const [isEditing, setIsEditing] = useState(false);
const [editedText, setEditedText] = useState(parsedResume.text);
const { setParsedResume } = useAppState();

const handleSaveEdit = () => {
  const result = parseTextInput(editedText);
  setParsedResume({
    ...parsedResume,
    ...result,
    source: "edited",
  });
  setIsEditing(false);
};

// Add to component JSX
{
  isEditing ? (
    <div className="space-y-3">
      <textarea
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        className="w-full h-[200px] p-3 border rounded-lg resize-none"
        placeholder="Edit your resume text..."
      />
      <div className="flex gap-2">
        <button onClick={handleSaveEdit} className="btn-primary">
          Save Changes
        </button>
        <button onClick={() => setIsEditing(false)} className="btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  ) : (
    <div className="space-y-3">
      <button
        onClick={() => setIsEditing(true)}
        className="btn-secondary text-sm"
      >
        Edit Text
      </button>
      <div className="max-h-[150px] overflow-y-auto text-sm text-muted-foreground bg-muted p-3 rounded">
        {parsedResume.text.substring(0, 500)}
        {parsedResume.text.length > 500 && "..."}
      </div>
    </div>
  );
}
```

### B3: Enhanced PromptConfigForm Validation

**Update form schema (`src/utils/validation.ts`):**

```typescript
export const JobContextSchema = z.object({
  analysisDepth: z.enum(["compact", "full"]),
  domain: z.enum(["universal", "technical", "nonTechnical"]),
  targetRole: z.string().min(2, "Role is required"),
  targetCompany: z.string().min(2, "Company is required"),
  experienceLevel: z.enum(["Entry", "Mid", "Senior"]),
  geographicFocus: z.string().optional(),
  specialFocus: z.string().optional(),
  memo: z.string().max(1000, "Memo must be under 1000 characters").optional(),
});

// Separate schema for submit validation
export const SubmitSchema = z.object({
  jobContext: JobContextSchema,
  resumeText: z.string().min(200, "Resume must be at least 200 characters"),
  geminiApiKey: z
    .string()
    .regex(
      /^AI[a-zA-Z0-9_-]+/,
      "Please enter a valid Gemini API key (starts with 'AI')"
    ),
  recaptchaToken: z
    .string()
    .min(1, "Please complete the security verification"),
});
```

---

## Phase C: reCAPTCHA Integration

### C1: Setup reCAPTCHA v3

**Add to `index.html`:**

```html
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
```

**Environment variables (`.env.example`):**

```bash
VITE_RECAPTCHA_SITE_KEY=your_site_key_here
```

### C2: reCAPTCHA Service (`src/lib/recaptcha.ts`)

```typescript
const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

declare global {
  interface Window {
    grecaptcha: {
      ready(callback: () => void): void;
      execute(siteKey: string, options: { action: string }): Promise<string>;
    };
  }
}

export function initRecaptcha(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!SITE_KEY) {
      reject(new Error("reCAPTCHA site key not configured"));
      return;
    }

    if (typeof window.grecaptcha !== "undefined") {
      resolve();
      return;
    }

    // Wait for script to load
    const checkRecaptcha = setInterval(() => {
      if (typeof window.grecaptcha !== "undefined") {
        clearInterval(checkRecaptcha);
        resolve();
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkRecaptcha);
      reject(new Error("reCAPTCHA failed to load"));
    }, 10000);
  });
}

export async function getRecaptchaToken(
  action: string = "submit"
): Promise<string> {
  if (!SITE_KEY) {
    throw new Error("reCAPTCHA not configured");
  }

  return new Promise((resolve, reject) => {
    window.grecaptcha.ready(async () => {
      try {
        const token = await window.grecaptcha.execute(SITE_KEY, { action });
        resolve(token);
      } catch (error) {
        reject(new Error("reCAPTCHA verification failed"));
      }
    });
  });
}

export async function verifyRecaptchaToken(token: string): Promise<boolean> {
  // Client-side verification (basic check only)
  // In production, you'd verify server-side, but for client-only app:

  try {
    // Just verify token format and not expired
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);

    // Check if token is not expired (tokens are valid for 2 minutes)
    return payload.exp > now;
  } catch {
    return false;
  }
}
```

---

## Phase D: Gemini API Integration

### D1: Enhanced Gemini Service (`src/lib/gemini.ts`)

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface StreamChunk {
  text: string;
  isComplete: boolean;
}

export class GeminiService {
  private client: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        maxOutputTokens: 4096,
      },
    });
  }

  async *streamAnalysis(
    systemPrompt: string,
    userPrompt: string
  ): AsyncGenerator<StreamChunk> {
    try {
      const chat = this.model.startChat({
        systemInstruction: systemPrompt,
      });

      const result = await chat.sendMessageStream(userPrompt);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield { text, isComplete: false };
        }
      }

      yield { text: "", isComplete: true };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("API_KEY_INVALID")) {
          throw new Error("Invalid API key. Please check your Gemini API key.");
        }
        if (error.message.includes("QUOTA_EXCEEDED")) {
          throw new Error(
            "API quota exceeded. Please try again later or check your billing."
          );
        }
        if (error.message.includes("RATE_LIMIT_EXCEEDED")) {
          throw new Error(
            "Rate limit exceeded. Please wait a moment and try again."
          );
        }
      }
      throw new Error(
        `Analysis failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
```

### D2: Prompt Template System (`src/lib/prompts.ts`)

```typescript
export interface PromptTemplate {
  system: string;
  user: string;
}

export interface PromptVariables {
  resumeText: string;
  targetRole: string;
  targetCompany: string;
  experienceLevel: string;
  geographicFocus?: string;
  specialFocus?: string;
  memo?: string;
}

// Load your existing prompt templates
export const PROMPT_TEMPLATES: Record<
  string,
  Record<string, PromptTemplate>
> = {
  compact: {
    universal: {
      system: "You are a professional resume advisor...", // Your existing compact universal template
      user: `Please analyze this resume for the role of {{targetRole}} at {{targetCompany}}...`,
    },
    technical: {
      system: "You are a technical resume advisor...", // Your existing compact technical template
      user: `Please analyze this technical resume...`,
    },
    nonTechnical: {
      system: "You are a career advisor...", // Your existing compact non-technical template
      user: `Please analyze this resume...`,
    },
  },
  full: {
    universal: {
      system: "You are a comprehensive resume advisor...", // Your existing full universal template
      user: `Please provide a detailed analysis...`,
    },
    technical: {
      system: "You are a senior technical recruiter...", // Your existing full technical template
      user: `Please provide comprehensive technical feedback...`,
    },
    nonTechnical: {
      system: "You are an experienced career counselor...", // Your existing full non-technical template
      user: `Please provide detailed career advice...`,
    },
  },
};

export function buildPrompt(
  analysisDepth: "compact" | "full",
  domain: "universal" | "technical" | "nonTechnical",
  variables: PromptVariables
): PromptTemplate {
  const template = PROMPT_TEMPLATES[analysisDepth][domain];

  if (!template) {
    throw new Error(`Template not found for ${analysisDepth}/${domain}`);
  }

  // Replace template variables
  const system = template.system.replace(
    /\{\{(\w+)\}\}/g,
    (match, key) => variables[key as keyof PromptVariables] || match
  );

  const user = template.user.replace(
    /\{\{(\w+)\}\}/g,
    (match, key) => variables[key as keyof PromptVariables] || match
  );

  return { system, user };
}
```

---

## Phase E: Submit Action Implementation

### E1: Master Submit Handler (`src/hooks/useSubmitAnalysis.ts`)

```typescript
import { useState } from "react";
import { useAppState } from "../store/useAppState";
import { useSession } from "../store/useSession";
import { getRecaptchaToken } from "../lib/recaptcha";
import { GeminiService } from "../lib/gemini";
import { buildPrompt } from "../lib/prompts";
import { SubmitSchema } from "../utils/validation";

export function useSubmitAnalysis() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const {
    parsedResume,
    formData,
    setAnalysisResult,
    setIsAnalyzing,
    setCooldownSeconds,
  } = useAppState();

  const { apiKey } = useSession();

  const submitAnalysis = async () => {
    if (isSubmitting || !parsedResume || !formData) return;

    setIsSubmitting(true);
    setError("");

    try {
      // 1. Get reCAPTCHA token
      const recaptchaToken = await getRecaptchaToken("resume_analysis");

      // 2. Validate all data
      const submitData = {
        jobContext: formData,
        resumeText: parsedResume.text,
        geminiApiKey: apiKey,
        recaptchaToken,
      };

      const validation = SubmitSchema.safeParse(submitData);
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      // 3. Build prompt from templates
      const prompt = buildPrompt(formData.analysisDepth, formData.domain, {
        resumeText: parsedResume.text,
        targetRole: formData.targetRole,
        targetCompany: formData.targetCompany,
        experienceLevel: formData.experienceLevel,
        geographicFocus: formData.geographicFocus,
        specialFocus: formData.specialFocus,
        memo: formData.memo,
      });

      // 4. Start cooldown
      setCooldownSeconds(10);

      // 5. Initialize Gemini service
      const gemini = new GeminiService(apiKey);

      // 6. Start streaming analysis
      setIsAnalyzing(true);
      setAnalysisResult(""); // Clear previous results

      let fullResult = "";

      for await (const chunk of gemini.streamAnalysis(
        prompt.system,
        prompt.user
      )) {
        if (chunk.isComplete) {
          setIsAnalyzing(false);
          break;
        }

        fullResult += chunk.text;
        setAnalysisResult(fullResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setIsAnalyzing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitAnalysis,
    isSubmitting,
    error,
  };
}
```

### E2: Update SubmitBar Component

**Key additions to existing SubmitBar:**

```typescript
// Add to imports
import { useSubmitAnalysis } from "../hooks/useSubmitAnalysis";
import { initRecaptcha } from "../lib/recaptcha";

// Add to component
const { submitAnalysis, isSubmitting, error } = useSubmitAnalysis();

// Initialize reCAPTCHA on mount
useEffect(() => {
  initRecaptcha().catch(console.error);
}, []);

// Replace onSubmit handler
const handleSubmit = async () => {
  if (isSubmitting || cooldownSeconds > 0) return;
  await submitAnalysis();
};

// Update submit button
<button
  onClick={handleSubmit}
  disabled={isDisabled || isSubmitting || cooldownSeconds > 0}
  className="btn-primary w-full"
>
  {isSubmitting
    ? "Analyzing..."
    : cooldownSeconds > 0
    ? `Submit (${cooldownSeconds}s)`
    : "Analyze Resume"}
</button>;

{
  error && <div className="text-sm text-destructive mt-2">{error}</div>;
}
```

---

## Phase F: Testing & Validation

### F1: Test Cases

**File Parsing:**

- [ ] PDF parsing works with 1-3 page resumes
- [ ] DOCX parsing preserves text content
- [ ] Markdown parsing handles formatting
- [ ] File size validation (1MB limit)
- [ ] Error handling for corrupted files

**Form Validation:**

- [ ] Required fields are validated
- [ ] API key format validation
- [ ] Character limits enforced
- [ ] Form state persists during session

**Submit Flow:**

- [ ] reCAPTCHA token generation
- [ ] API key validation
- [ ] Streaming results display
- [ ] Error handling for API failures
- [ ] Cooldown timer works correctly

**Resume Processing:**

- [ ] Word count calculation
- [ ] Parse warnings display
- [ ] Text editing functionality
- [ ] Long resume handling (>1000 words)

### F2: Error Scenarios

**File Upload Errors:**

- Unsupported file types → Clear error message
- Files over 1MB → Size limit warning
- Corrupted/password-protected files → Parse error
- Empty files → Content validation error

**API Errors:**

- Invalid API key → Clear instructions
- Rate limiting → Retry guidance
- Network errors → Connection troubleshooting
- Quota exceeded → Billing guidance

**Validation Errors:**

- Missing required fields → Field-specific errors
- Invalid input formats → Format examples
- Resume too short/long → Content guidance

---

## Implementation Checklist

### Setup & Dependencies

- [ ] Install PDF.js, mammoth, unified packages
- [ ] Add reCAPTCHA script to index.html
- [ ] Configure environment variables
- [ ] Update TypeScript types

### File Parsing

- [ ] Create PDF parser with pdf.js
- [ ] Create DOCX parser with mammoth
- [ ] Create Markdown parser with unified
- [ ] Create master parser service
- [ ] Add file validation logic

### Component Updates

- [ ] Enhance ResumeDropzone with parsing
- [ ] Add editing to ParsedPreview
- [ ] Update form validation schemas
- [ ] Add error handling throughout

### API Integration

- [ ] Create reCAPTCHA service
- [ ] Enhanced Gemini service with streaming
- [ ] Prompt template system
- [ ] Master submit handler
- [ ] Update SubmitBar component

### Testing

- [ ] Test all file formats
- [ ] Test form validation
- [ ] Test API integration
- [ ] Test error scenarios
- [ ] Test on mobile devices

---

## Estimated Timeline

- **File Parsing Setup:** 2-3 hours
- **Component Enhancements:** 2-3 hours
- **reCAPTCHA Integration:** 1-2 hours
- **Gemini API Integration:** 2-3 hours
- **Submit Flow Implementation:** 2-3 hours
- **Testing & Bug Fixes:** 3-4 hours
- **Documentation Updates:** 1 hour

**Total:** ~13-19 hours

---

## Success Criteria

✅ **File Upload:** Users can upload PDF/DOCX/MD files and paste text  
✅ **Parsing:** Files are parsed to clean text with metadata  
✅ **Form Validation:** All inputs are validated with clear error messages  
✅ **Bot Protection:** reCAPTCHA v3 prevents automated abuse  
✅ **API Integration:** Gemini API calls work with streaming results  
✅ **Error Handling:** All failure modes show helpful error messages  
✅ **Performance:** Large files and long responses don't block UI

---

_This document will be updated as implementation progresses._
