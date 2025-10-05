# Implementation Plan - Analysis Flow & Integration

**Project:** Resume Doctor  
**Purpose:** Complete end-to-end analysis flow with Gemini API streaming, result handling, and cooldown system  
**Phase:** Final Integration (Phase D-F)  
**Date:** October 5, 2025

---

## Overview

This document outlines the final implementation phase for Resume Doctor, which connects all existing components into a fully functional resume analysis tool with real-time streaming results from Gemini API.

### What's Already Implemented ✅

- ✅ File parsing (PDF, DOCX, MD, TXT)
- ✅ Text input and editing
- ✅ Resume preview and metadata display
- ✅ Form configuration (PromptConfigForm)
- ✅ API key management with localStorage
- ✅ reCAPTCHA v3 integration
- ✅ Prompt template system with variable substitution
- ✅ Gemini API service with streaming
- ✅ State management (Zustand)

### What We'll Build 🚀

1. **Analysis submission hook** - Orchestrates the entire flow
2. **Real-time streaming UI** - Display results as they arrive
3. **Result actions** - Copy, download, open in new tab
4. **Cooldown system** - Prevent API abuse
5. **Error handling** - Comprehensive user feedback
6. **Integration & polish** - Connect everything together

---

## Phase A: Analysis Submission Hook

### A1: Create `useSubmitAnalysis` Hook (`src/hooks/useSubmitAnalysis.ts`)

**Purpose:** Central hook that orchestrates validation → reCAPTCHA → Gemini API → streaming results

**Implementation:**

```typescript
import { useState } from "react";
import { useAppState } from "../store/useAppState";
import { useSession } from "../store/useSession";
import { GeminiService } from "../lib/gemini";
import { buildPrompt } from "../lib/prompts";
import type { JobContextFormData } from "../types";

export function useSubmitAnalysis() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");

  const {
    parsedResume,
    formData,
    setAnalysisResult,
    setIsAnalyzing,
    setCooldownSeconds,
  } = useAppState();

  const { apiKey } = useSession();

  const submitAnalysis = async (recaptchaToken: string) => {
    // Reset error state
    setSubmitError("");
    setIsSubmitting(true);

    try {
      // Step 1: Validate all required data
      if (!parsedResume) {
        throw new Error("Please upload or paste your resume first");
      }

      if (!formData.analysisDepth || !formData.domain) {
        throw new Error("Please complete the analysis configuration");
      }

      if (!formData.targetRole || !formData.targetCompany) {
        throw new Error("Please enter target role and company");
      }

      if (!formData.experienceLevel) {
        throw new Error("Please select your experience level");
      }

      if (!apiKey) {
        throw new Error("Please enter your Gemini API key");
      }

      if (!recaptchaToken) {
        throw new Error("reCAPTCHA verification failed");
      }

      // Step 2: Build prompt from template
      const prompt = buildPrompt(formData.analysisDepth, formData.domain, {
        resumeText: parsedResume.text,
        targetRole: formData.targetRole,
        targetCompany: formData.targetCompany,
        experienceLevel: formData.experienceLevel,
        geographicFocus: formData.geographicFocus,
        specialFocus: formData.specialFocus,
        memo: formData.memo,
      });

      // Step 3: Initialize Gemini service
      const geminiService = new GeminiService(apiKey);

      // Step 4: Start streaming
      setIsAnalyzing(true);
      setAnalysisResult({
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      });

      let fullContent = "";

      // Step 5: Stream results
      for await (const chunk of geminiService.streamAnalysis(
        prompt.system,
        prompt.user
      )) {
        if (!chunk.isComplete) {
          fullContent += chunk.text;
          setAnalysisResult({
            content: fullContent,
            timestamp: new Date(),
            isStreaming: true,
          });
        } else {
          // Streaming complete
          setAnalysisResult({
            content: fullContent,
            timestamp: new Date(),
            isStreaming: false,
          });
        }
      }

      // Step 6: Start cooldown (60 seconds)
      setCooldownSeconds(60);
      const cooldownInterval = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setIsAnalyzing(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Analysis failed";
      setSubmitError(errorMessage);
      setIsAnalyzing(false);
      setAnalysisResult(null);
      console.error("Analysis submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitAnalysis,
    isSubmitting,
    submitError,
  };
}
```

**Key Features:**

- ✅ Comprehensive validation before API call
- ✅ Clear error messages for each failure point
- ✅ Real-time streaming with state updates
- ✅ Automatic 60-second cooldown after completion
- ✅ Proper cleanup and error handling

---

## Phase B: Enhanced Result Pane

### B1: Update ResultPane for Streaming (`src/components/ResultPane.tsx`)

**Current State:** Basic component with placeholder
**Target State:** Real-time markdown rendering with loading states

**Key Improvements:**

```typescript
import { useEffect, useRef } from "react";
import { Copy, Download, ExternalLink, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { AnalysisResult } from "../types";

interface ResultPaneProps {
  result: AnalysisResult | null;
  isStreaming: boolean;
}

export default function ResultPane({ result, isStreaming }: ResultPaneProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as content streams
  useEffect(() => {
    if (isStreaming && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [result?.content, isStreaming]);

  const handleCopy = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
      // Show success toast
    }
  };

  const handleDownload = () => {
    if (!result?.content) return;

    const blob = new Blob([result.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume-analysis-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenInNewTab = () => {
    if (!result?.content) return;

    const blob = new Blob(
      [
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Resume Analysis</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
    }
    pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <div id="content"></div>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script>
    document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(
      result.content
    )});
  </script>
</body>
</html>`,
      ],
      { type: "text/html" }
    );
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  if (!result) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">No analysis yet</p>
          <p className="text-sm">
            Complete the form above and click "Analyze Resume"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Action Bar */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          {isStreaming && (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Streaming results...
              </span>
            </>
          )}
          {!isStreaming && (
            <span className="text-sm text-muted-foreground">
              Analysis completed at {result.timestamp.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            disabled={isStreaming}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            title="Copy to clipboard"
          >
            <Copy className="h-4 w-4" />
            Copy
          </button>
          <button
            onClick={handleDownload}
            disabled={isStreaming}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            title="Download as Markdown"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          <button
            onClick={handleOpenInNewTab}
            disabled={isStreaming}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
            Open
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 prose prose-slate max-w-none">
        <ReactMarkdown>{result.content}</ReactMarkdown>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
```

**Dependencies to Install:**

```bash
npm install react-markdown
```

**Key Features:**

- ✅ Auto-scroll during streaming
- ✅ Markdown rendering with syntax highlighting
- ✅ Copy to clipboard functionality
- ✅ Download as .md file with timestamp
- ✅ Open in new tab with proper formatting
- ✅ Loading states and disabled buttons during streaming

---

## Phase C: Cooldown System Enhancement

### C1: Update Zustand Store (`src/store/useAppState.ts`)

**Add cooldown state management:**

```typescript
interface AppState {
  // ... existing state
  cooldownSeconds: number;
  cooldownInterval: NodeJS.Timeout | null;

  // ... existing actions
  setCooldownSeconds: (seconds: number) => void;
  startCooldown: () => void;
  clearCooldown: () => void;
}

export const useAppState = create<AppState>((set, get) => ({
  // ... existing state
  cooldownSeconds: 0,
  cooldownInterval: null,

  // ... existing actions

  setCooldownSeconds: (cooldownSeconds) => set({ cooldownSeconds }),

  startCooldown: () => {
    // Clear any existing interval
    const existing = get().cooldownInterval;
    if (existing) clearInterval(existing);

    set({ cooldownSeconds: 60 });

    const interval = setInterval(() => {
      const current = get().cooldownSeconds;
      if (current <= 1) {
        get().clearCooldown();
      } else {
        set({ cooldownSeconds: current - 1 });
      }
    }, 1000);

    set({ cooldownInterval: interval });
  },

  clearCooldown: () => {
    const interval = get().cooldownInterval;
    if (interval) {
      clearInterval(interval);
      set({ cooldownInterval: null, cooldownSeconds: 0 });
    }
  },
}));
```

**Key Features:**

- ✅ Centralized cooldown management
- ✅ Automatic cleanup on completion
- ✅ Proper interval management (no memory leaks)

---

## Phase D: Main Page Integration

### D1: Update Main.tsx (`src/pages/Main.tsx`)

**Wire everything together:**

```typescript
import { useState } from "react";
import ResumeDropzone from "../components/ResumeDropzone";
import PromptConfigForm from "../components/PromptConfigForm";
import SubmitBar from "../components/SubmitBar";
import ResultPane from "../components/ResultPane";
import { useAppState } from "../store/useAppState";
import { useSubmitAnalysis } from "../hooks/useSubmitAnalysis";
import { parseFile, parseTextInput } from "../lib/parsers";
import type { ParsedResume } from "../types";

export default function Main() {
  const {
    parsedResume,
    analysisResult,
    isAnalyzing,
    cooldownSeconds,
    formData,
  } = useAppState();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");

  const { submitAnalysis, isSubmitting, submitError } = useSubmitAnalysis();

  // ... existing file/text handlers

  const handleFormSubmit = (data: Partial<JobContextFormData>) => {
    useAppState.getState().setFormData(data);
  };

  const handleSubmit = async (recaptchaToken: string) => {
    await submitAnalysis(recaptchaToken);
  };

  // Check if form is complete
  const isFormComplete = Boolean(
    formData.analysisDepth &&
      formData.domain &&
      formData.targetRole &&
      formData.targetCompany &&
      formData.experienceLevel
  );

  const isSubmitDisabled =
    !parsedResume || !isFormComplete || isAnalyzing || isSubmitting;

  return (
    <div className="flex flex-col flex-1">
      <div className="grid grid-cols-2 gap-8 h-[100vh]">
        {/* Left Column */}
        <div>
          <div>
            <h2 className="text-xl font-semibold mb-4">
              1. Configure Analysis
            </h2>
            <PromptConfigForm onSubmit={handleFormSubmit} />
          </div>
        </div>

        {/* Right Column */}
        <div>
          <div>
            <h2 className="text-xl font-semibold mb-4">
              2. Upload Your Resume
            </h2>
            <ResumeDropzone
              onFileSelect={handleFileSelect}
              onTextInput={handleTextInput}
              parsedResume={parsedResume}
              onClear={handleClearResume}
            />

            {/* Processing/Error indicators */}
            {isProcessing && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  Processing your resume...
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {submitError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">3. Submit</h2>
            <SubmitBar
              onSubmit={handleSubmit}
              cooldownSeconds={cooldownSeconds}
              isDisabled={isSubmitDisabled}
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="w-full h-[88vh]">
        <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
        <ResultPane result={analysisResult} isStreaming={isAnalyzing} />
      </div>
    </div>
  );
}
```

**Key Features:**

- ✅ Proper state synchronization
- ✅ Form validation before submit
- ✅ Clear error boundaries
- ✅ Loading state management

---

## Phase E: Validation Schema Updates

### E1: Update Zod Schemas (`src/utils/validation.ts`)

**Add comprehensive validation:**

```typescript
import { z } from "zod";

// Resume validation
export const ResumeSchema = z.object({
  text: z.string().min(200, "Resume must be at least 200 characters"),
  wordCount: z
    .number()
    .min(100, "Resume is too short")
    .max(2000, "Resume is too long"),
  pageCount: z.number().min(1).max(5),
  parseWarnings: z.array(z.string()),
  source: z.enum(["text", "file", "edited"]),
  fileName: z.string(),
  fileSize: z.number().max(1024 * 1024, "File must be under 1MB"),
});

// Form data validation
export const JobContextFormSchema = z.object({
  analysisDepth: z.enum(["compact", "full"]),
  domain: z.enum(["universal", "technical", "nonTechnical"]),
  targetRole: z.string().min(2, "Role must be at least 2 characters"),
  targetCompany: z.string().min(2, "Company must be at least 2 characters"),
  experienceLevel: z.enum(["Entry", "Mid", "Senior"]),
  geographicFocus: z.string().optional(),
  specialFocus: z.string().optional(),
  memo: z.string().max(500, "Memo must be under 500 characters").optional(),
});

// API key validation
export const ApiKeySchema = z.string().min(30, "API key appears invalid");

// reCAPTCHA token validation
export const RecaptchaTokenSchema = z
  .string()
  .min(100, "Invalid reCAPTCHA token");

// Complete submission validation
export const SubmissionSchema = z.object({
  resume: ResumeSchema,
  formData: JobContextFormSchema,
  apiKey: ApiKeySchema,
  recaptchaToken: RecaptchaTokenSchema,
});

// Export validation functions
export function validateSubmission(data: unknown) {
  return SubmissionSchema.safeParse(data);
}

export function validateResume(data: unknown) {
  return ResumeSchema.safeParse(data);
}

export function validateFormData(data: unknown) {
  return JobContextFormSchema.safeParse(data);
}
```

---

## Phase F: Error Handling & Polish

### F1: Add Error Boundary Component

**Create `src/components/ErrorBoundary.tsx`:**

```typescript
import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-red-900 mb-2">
                  Something went wrong
                </h2>
                <p className="text-sm text-red-700 mb-4">
                  {this.state.error?.message || "An unexpected error occurred"}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### F2: Wrap App in Error Boundary (`src/main.tsx`)

```typescript
import { ErrorBoundary } from "./components/ErrorBoundary";

// ... existing imports

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  </StrictMode>
);
```

---

## Phase G: Testing Checklist

### G1: Functionality Tests

**Resume Upload:**

- [ ] Upload PDF file < 1MB
- [ ] Upload DOCX file < 1MB
- [ ] Upload Markdown file
- [ ] Upload text file
- [ ] Paste text (> 200 chars)
- [ ] Edit pasted text
- [ ] Clear resume
- [ ] Replace file
- [ ] Error: File > 1MB
- [ ] Error: Unsupported format
- [ ] Error: Text < 200 chars

**Form Configuration:**

- [ ] Select all analysis options
- [ ] Submit without completing form (should show error)
- [ ] Optional fields work correctly
- [ ] Form persists in state

**API Key:**

- [ ] Enter valid API key
- [ ] Remember key checkbox works
- [ ] Key persists in localStorage
- [ ] Clear key button works
- [ ] Show/hide password toggle

**reCAPTCHA:**

- [ ] reCAPTCHA script loads
- [ ] Token generated on submit
- [ ] Error handling for failed verification
- [ ] Works on localhost

**Analysis Submission:**

- [ ] Validation catches missing data
- [ ] Prompt builds correctly
- [ ] Gemini API streams results
- [ ] Results display in real-time
- [ ] Auto-scroll works during streaming
- [ ] Markdown renders correctly
- [ ] Cooldown starts after completion
- [ ] Error handling for API failures

**Result Actions:**

- [ ] Copy to clipboard works
- [ ] Download .md file works
- [ ] Open in new tab works
- [ ] Actions disabled during streaming

**Cooldown:**

- [ ] 60-second countdown displays
- [ ] Submit button disabled during cooldown
- [ ] Cooldown resets on refresh
- [ ] Clear messaging for users

### G2: Error Scenarios

- [ ] Network offline during submission
- [ ] Invalid API key
- [ ] API quota exceeded
- [ ] API rate limit hit
- [ ] reCAPTCHA fails
- [ ] Malformed resume data
- [ ] Empty prompt template
- [ ] Browser storage disabled

### G3: Browser Compatibility

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

### G4: Performance

- [ ] Large files (near 1MB) parse quickly
- [ ] Streaming updates don't lag
- [ ] No memory leaks during long sessions
- [ ] Cooldown interval cleans up properly

---

## Implementation Order

### Recommended Sequence:

1. **Day 1**: Phase A (Analysis Hook)

   - Create `useSubmitAnalysis` hook
   - Test with mock data
   - Verify state management

2. **Day 2**: Phase B (Result Pane)

   - Install react-markdown
   - Update ResultPane component
   - Test streaming UI

3. **Day 3**: Phase C-D (Cooldown & Integration)

   - Update Zustand store
   - Wire Main.tsx
   - Test end-to-end flow

4. **Day 4**: Phase E (Validation & Polish)

   - Update Zod schemas
   - Add error boundary
   - UI polish and animations

5. **Day 5**: Phase F-G (Testing)
   - Run through test checklist
   - Fix bugs
   - Documentation updates

---

## Success Criteria

### Must Have ✅

- [ ] Complete upload → configure → submit → results flow
- [ ] Real-time streaming from Gemini API
- [ ] Proper error handling at all stages
- [ ] 60-second cooldown enforcement
- [ ] Copy/download/open result actions
- [ ] Form validation before submission
- [ ] reCAPTCHA verification

### Should Have 🎯

- [ ] Auto-scroll during streaming
- [ ] Loading states and transitions
- [ ] Clear error messages
- [ ] Markdown rendering
- [ ] Mobile-responsive

### Nice to Have 🌟

- [ ] Streaming progress indicator
- [ ] Retry failed requests
- [ ] Export to PDF
- [ ] Dark mode support
- [ ] Animation polish

---

## Dependencies to Install

```bash
npm install react-markdown
npm install remark-gfm  # GitHub Flavored Markdown support
```

---

## Known Limitations & Future Enhancements

### Current Limitations:

- Client-side only (no backend validation)
- Basic reCAPTCHA verification
- No analysis history
- No user accounts
- Single session only

### Future Enhancements:

- [ ] Save analysis history
- [ ] Compare multiple versions
- [ ] Export to PDF with styling
- [ ] Share analysis via link
- [ ] Google OAuth integration
- [ ] Server-side reCAPTCHA verification
- [ ] Analytics dashboard
- [ ] Multi-language support

---

## Troubleshooting Guide

### Common Issues:

**Streaming doesn't work:**

- Check API key is valid
- Verify network connection
- Check browser console for errors
- Ensure Gemini service is properly initialized

**Cooldown doesn't start:**

- Check Zustand store state
- Verify `startCooldown()` is called
- Check for interval cleanup issues

**Results don't display:**

- Check `analysisResult` state
- Verify markdown rendering
- Check for React errors in console

**Form validation fails:**

- Check all required fields
- Verify Zod schema matches types
- Check console for validation errors

---

## Completion Checklist

- [ ] All phases A-G implemented
- [ ] All functionality tests pass
- [ ] All error scenarios handled
- [ ] Browser compatibility verified
- [ ] Documentation updated
- [ ] README updated with new features
- [ ] `.env.example` is current
- [ ] No console errors or warnings
- [ ] Performance is acceptable
- [ ] Code is clean and commented

---

## Post-Implementation Tasks

1. **Update README.md** with final feature list
2. **Create CHANGELOG.md** documenting this release
3. **Update screenshots** in documentation
4. **Tag release** as v1.0.0
5. **Test deployment** to production environment
6. **Monitor** initial usage for issues

---

**Estimated Completion Time:** 8-12 hours of focused development

**Status:** Ready to implement 🚀
