# Implementation Plan - Base Layer

**Project:** Resume Doctor  
**Purpose:** Client-only resume analysis tool using Gemini AI  
**Phase:** Base Layer (Infrastructure & UI Shell)  
**Date:** October 3, 2025

---

## Overview

This document outlines the implementation plan for the **base layer** of Resume Doctor—a fully client-side application that allows users to analyze their resumes using Google's Gemini AI. The base layer establishes the foundational structure, configuration, routing, state management, and UI components **without implementing the core business logic** (file parsing, prompt assembly, Gemini integration).

### What's Included in Base Layer

- ✅ Project setup and configuration
- ✅ Component structure with TypeScript interfaces
- ✅ State management (Zustand stores)
- ✅ Basic page structure
- ✅ Form components with validation schema
- ✅ Layout and styling (Tailwind CSS)
- ✅ File structure for future implementation

### What's NOT Included (Future Implementation)

- ❌ Google Identity Services authentication (will be added later)
- ❌ Actual file parsing logic (PDF/DOCX/MD)
- ❌ Gemini API integration
- ❌ Prompt template hydration
- ❌ Web Worker implementation
- ❌ Streaming response handling
- ❌ Cooldown enforcement logic

---

## Phase 1: Project Setup & Configuration

### 1.1 Initialize Project

**Files to Create:**

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite bundler configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `.gitignore` - Git ignore rules
- `index.html` - Root HTML file

**Dependencies:**

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^6.26.0",
    "react-hook-form": "^7.52.0",
    "zod": "^3.23.0",
    "@hookform/resolvers": "^3.9.0",
    "zustand": "^4.5.0",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.4.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

**Note:** AI-related dependencies (`@google/generative-ai`, `pdfjs-dist`, `mammoth`, `comlink`) will be added in future phases.

**Why React 19?**

- Better async/streaming support (perfect for Gemini streaming responses)
- Improved form handling with Actions
- Better error boundaries and error handling
- `use()` hook for cleaner async data handling
- Stable release (December 2024) - no reason to use older versions

---

## Phase 2: Type Definitions & Interfaces

### 2.1 Global Types (`src/types/index.ts`)

Define core TypeScript interfaces and types:

```typescript
// Analysis configuration types
export type AnalysisDepth = "compact" | "full";
export type Domain = "universal" | "technical" | "nonTechnical";
export type ExperienceLevel = "Entry" | "Mid" | "Senior";

// Resume data types
export interface ParsedResume {
  text: string;
  wordCount: number;
  parseWarnings: string[];
  sourceType: "text" | "pdf" | "docx" | "markdown";
}

// Job context form data
export interface JobContextFormData {
  analysisDepth: AnalysisDepth;
  domain: Domain;
  targetRole: string;
  targetCompany: string;
  experienceLevel: ExperienceLevel;
  geographicFocus?: string;
  specialFocus?: string;
  memo?: string;
}

// Analysis result types
export interface AnalysisResult {
  content: string;
  timestamp: Date;
  isStreaming: boolean;
}
```

**Note:** User/authentication types will be added when implementing Google login in a future phase.

### 2.2 Validation Schemas (`src/utils/validation.ts`)

Create Zod schemas (without implementing validation logic):

```typescript
import { z } from "zod";

export const JobContextSchema = z.object({
  analysisDepth: z.enum(["compact", "full"]),
  domain: z.enum(["universal", "technical", "nonTechnical"]),
  targetRole: z.string().min(2, "Role must be at least 2 characters"),
  targetCompany: z.string().min(2, "Company must be at least 2 characters"),
  experienceLevel: z.enum(["Entry", "Mid", "Senior"]),
  geographicFocus: z.string().optional(),
  specialFocus: z.string().optional(),
  memo: z.string().max(1000, "Memo must be under 1000 characters").optional(),
});

export const ResumeTextSchema = z
  .string()
  .min(200, "Resume must be at least 200 characters")
  .max(6000, "Resume must be under 6000 characters");

export const ApiKeySchema = z
  .string()
  .regex(/^AI/, "API key must start with 'AI'")
  .min(20, "Invalid API key format");

export type JobContextFormValues = z.infer<typeof JobContextSchema>;
```

---

## Phase 3: State Management (Zustand)

### 3.1 Session Store (`src/store/useSession.ts`)

Manages API key (authentication will be added later):

```typescript
import { create } from "zustand";

interface SessionState {
  apiKey: string;
  rememberApiKey: boolean;

  // Actions (stubs for now)
  setApiKey: (key: string) => void;
  setRememberApiKey: (remember: boolean) => void;
  clearApiKey: () => void;
  reset: () => void;
}

export const useSession = create<SessionState>((set) => ({
  apiKey: "",
  rememberApiKey: false,

  setApiKey: (apiKey) => set({ apiKey }),
  setRememberApiKey: (rememberApiKey) => set({ rememberApiKey }),
  clearApiKey: () => set({ apiKey: "" }),
  reset: () => set({ apiKey: "", rememberApiKey: false }),
}));
```

**Note:** User authentication fields will be added when implementing Google login.### 3.2 Application State Store (`src/store/useAppState.ts`)

Manages resume data, form inputs, and analysis results:

```typescript
import { create } from "zustand";
import { ParsedResume, JobContextFormData, AnalysisResult } from "../types";

interface AppState {
  parsedResume: ParsedResume | null;
  formData: Partial<JobContextFormData>;
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
  cooldownSeconds: number;

  // Actions (stubs for now)
  setParsedResume: (resume: ParsedResume | null) => void;
  setFormData: (data: Partial<JobContextFormData>) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setCooldownSeconds: (seconds: number) => void;
  resetState: () => void;
}

export const useAppState = create<AppState>((set) => ({
  parsedResume: null,
  formData: {},
  analysisResult: null,
  isAnalyzing: false,
  cooldownSeconds: 0,

  setParsedResume: (parsedResume) => set({ parsedResume }),
  setFormData: (formData) => set({ formData }),
  setAnalysisResult: (analysisResult) => set({ analysisResult }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setCooldownSeconds: (cooldownSeconds) => set({ cooldownSeconds }),
  resetState: () =>
    set({
      parsedResume: null,
      formData: {},
      analysisResult: null,
      isAnalyzing: false,
      cooldownSeconds: 0,
    }),
}));
```

---

## Phase 4: Component Structure

### 4.1 Layout Components

#### `src/app/AppShell.tsx`

Main application shell with header and toast container:

```typescript
interface AppShellProps {
  children: React.ReactNode;
}

// Structure:
// - Header with logo and user profile dropdown
// - Main content area
// - Toast/notification container (future)
```

#### `src/app/Router.tsx`

Application routing setup:

```typescript
// Routes:
// - "/" -> Main page (single page app for now)
// - Future: Add routing when authentication is implemented
```

### 4.2 Page Components

#### `src/pages/Main.tsx`

Main application page (two-column layout):

```typescript
// Structure:
// - Header with app title
// - Left column: Input section
//   - ResumeDropzone
//   - ParsedPreview (shows word count)
//   - PromptConfigForm
//   - SubmitBar (API key + submit button)
// - Right column: Output section
//   - ResultPane (analysis results)
```

**Note:** Login page will be added when implementing authentication.

### 4.3 Feature Components

#### `src/components/ResumeDropzone.tsx`

File upload and text input component:

```typescript
interface ResumeDropzoneProps {
  onFileSelect: (file: File) => void;
  onTextInput: (text: string) => void;
}

// Structure:
// - Tab switcher: "Upload File" | "Paste Text"
// - File upload: drag-and-drop zone + file picker
// - Text input: textarea with character counter
// - File validation: size (<1MB), type (PDF/DOCX/MD)
```

#### `src/components/ParsedPreview.tsx`

Displays parsed resume metadata:

```typescript
interface ParsedPreviewProps {
  parsedResume: ParsedResume | null;
  onClear: () => void;
}

// Structure:
// - Show word count, estimated pages
// - Display parse warnings (if any)
// - Clear button
// - Collapse/expand preview
```

#### `src/components/PromptConfigForm.tsx`

Job context configuration form:

```typescript
interface PromptConfigFormProps {
  onSubmit: (data: JobContextFormData) => void;
  defaultValues?: Partial<JobContextFormData>;
}

// Structure:
// - Analysis Depth dropdown (Compact/Full)
// - Domain dropdown (Universal/Technical/Non-Technical)
// - Target Role input
// - Target Company input
// - Experience Level dropdown
// - Geographic Focus input (optional)
// - Special Focus textarea (optional)
// - Memo textarea (optional)
// - Uses react-hook-form + zod validation
```

#### `src/components/SubmitBar.tsx`

API key input and submit button:

```typescript
interface SubmitBarProps {
  onSubmit: () => void;
  cooldownSeconds: number;
  isDisabled: boolean;
}

// Structure:
// - API key input (password field with show/hide toggle)
// - "Remember key" checkbox
// - Submit button with cooldown timer
// - Clear key button
```

#### `src/components/ResultPane.tsx`

Displays analysis results:

```typescript
interface ResultPaneProps {
  result: AnalysisResult | null;
  isStreaming: boolean;
}

// Structure:
// - Empty state (before analysis)
// - Streaming indicator
// - Markdown-rendered content
// - Copy to clipboard button
// - Download as TXT button
// - "Open in new tab" button
```

---

## Phase 5: Utility Functions & Placeholders

### 5.1 Lib Directory (Stubs)

#### `src/lib/gemini.ts`

Gemini API integration (placeholder):

```typescript
export interface GeminiClientConfig {
  apiKey: string;
}

// Placeholder function - will implement later
export async function* streamResumeAnalysis(config: {
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
}): AsyncGenerator<string, void, unknown> {
  throw new Error("Not implemented - future phase");
}
```

#### `src/lib/prompts.ts`

Prompt templates (placeholder):

```typescript
import { AnalysisDepth, Domain } from "../types";

export interface PromptTemplate {
  version: string;
  systemInstruction: string;
  userPromptTemplate: string;
}

// Placeholder - will load from JSON later
export function getPromptTemplate(
  depth: AnalysisDepth,
  domain: Domain
): PromptTemplate {
  return {
    version: "1.0.0",
    systemInstruction: "TODO: Load from templates",
    userPromptTemplate: "TODO: Load from templates",
  };
}
```

#### `src/lib/buildPrompt.ts`

Prompt assembly (placeholder):

```typescript
import { JobContextFormData, ParsedResume } from "../types";
import { PromptTemplate } from "./prompts";

// Placeholder - will implement later
export function buildPrompt(
  template: PromptTemplate,
  formData: JobContextFormData,
  resume: ParsedResume
): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt: "TODO: Implement prompt building",
    userPrompt: "TODO: Implement prompt building",
  };
}
```

### 5.2 Utils Directory

#### `src/utils/cooldown.ts`

Cooldown timer helper:

```typescript
// Placeholder - will implement timer logic later
export function startCooldown(
  seconds: number,
  onTick: (remaining: number) => void
): () => void {
  throw new Error("Not implemented - future phase");
}
```

#### `src/utils/storage.ts`

LocalStorage helpers:

```typescript
const STORAGE_KEYS = {
  API_KEY: "resume_doctor_api_key",
  FORM_DATA: "resume_doctor_form_data",
} as const;

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to save to storage:", error);
  }
}

export function loadFromStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error("Failed to load from storage:", error);
    return null;
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to remove from storage:", error);
  }
}

export const StorageKeys = STORAGE_KEYS;
```

### 5.3 Worker Directory (Placeholder)

#### `src/workers/parser.worker.ts`

Web Worker for file parsing:

```typescript
// Placeholder - will implement PDF/DOCX/MD parsing later
self.addEventListener("message", (event) => {
  const { file } = event.data;

  // TODO: Implement parsing logic
  self.postMessage({
    error: "Not implemented - future phase",
  });
});
```

---

## Phase 6: Styling & UI Polish

### 6.1 Global Styles (`src/index.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Color variables for light theme */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 6.2 Component Utilities (`src/lib/utils.ts`)

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWordCount(count: number): string {
  return count.toLocaleString();
}

export function estimatePages(wordCount: number): number {
  return Math.ceil(wordCount / 500);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
```

---

## Phase 7: Entry Points

### 7.1 Main Entry (`src/main.tsx`)

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 7.2 App Component (`src/App.tsx`)

```typescript
import { BrowserRouter } from "react-router-dom";
import Router from "./app/Router";

function App() {
  return (
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  );
}

export default App;
```

---

## Phase 8: Environment & Configuration

### 8.1 Environment Variables (`.env.example`)

```bash
# Application Configuration
VITE_APP_NAME=Resume Doctor
VITE_APP_VERSION=0.1.0

# Feature Flags
VITE_ENABLE_ANALYTICS=false
```

**Note:** Google Client ID will be added when implementing authentication.

### 8.2 Vite Configuration (`vite.config.ts`)

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          state: ["zustand"],
          form: ["react-hook-form", "zod", "@hookform/resolvers"],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

---

## File Structure Summary

```
resume_doctor/
├── docs/
│   ├── Dev Document.md
│   ├── Implementation Plan - Base Layer.md  [NEW]
│   └── prompts/
│       └── [existing prompt templates]
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── AppShell.tsx
│   │   └── Router.tsx
│   ├── components/
│   │   ├── ResumeDropzone.tsx
│   │   ├── ParsedPreview.tsx
│   │   ├── PromptConfigForm.tsx
│   │   ├── SubmitBar.tsx
│   │   └── ResultPane.tsx
│   ├── lib/
│   │   ├── gemini.ts              [STUB]
│   │   ├── prompts.ts             [STUB]
│   │   ├── buildPrompt.ts         [STUB]
│   │   └── utils.ts
│   ├── pages/
│   │   └── Main.tsx
│   ├── store/
│   │   ├── useSession.ts
│   │   └── useAppState.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── cooldown.ts            [STUB]
│   │   └── storage.ts
│   ├── workers/
│   │   └── parser.worker.ts       [STUB]
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Implementation Checklist

### Setup Phase

- [ ] Initialize Vite + React + TypeScript project
- [ ] Install dependencies (React, Zustand, react-hook-form, Zod, Tailwind)
- [ ] Configure Tailwind CSS and PostCSS
- [ ] Set up TypeScript configuration
- [ ] Create `.env.example` file

### Type System

- [ ] Create `src/types/index.ts` with all interfaces
- [ ] Create `src/utils/validation.ts` with Zod schemas

### State Management

- [ ] Implement `src/store/useSession.ts`
- [ ] Implement `src/store/useAppState.ts`
- [ ] Add localStorage persistence for API key (when remembered)
- [ ] Add localStorage persistence for form data (autosave)

### Layout & Routing

- [ ] Create `src/app/AppShell.tsx` with header and layout
- [ ] Create `src/app/Router.tsx` with basic routing

### Pages

- [ ] Create `src/pages/Main.tsx` with two-column layout

### Components (Structure Only)

- [ ] Create `src/components/ResumeDropzone.tsx` (file picker + textarea)
- [ ] Create `src/components/ParsedPreview.tsx` (metadata display)
- [ ] Create `src/components/PromptConfigForm.tsx` (form with validation)
- [ ] Create `src/components/SubmitBar.tsx` (API key + submit button)
- [ ] Create `src/components/ResultPane.tsx` (empty state + placeholder)

### Utilities

- [ ] Create `src/lib/utils.ts` (cn, formatters)
- [ ] Create `src/utils/storage.ts` (localStorage helpers)
- [ ] Create stub files for future implementation

### Entry Points

- [ ] Create `src/main.tsx`
- [ ] Create `src/App.tsx`
- [ ] Create `index.html`

### Styling

- [ ] Set up global styles in `src/index.css`
- [ ] Style Main page layout
- [ ] Style all components with Tailwind

### Documentation

- [ ] Create comprehensive README.md
- [ ] Document component props and interfaces
- [ ] Add JSDoc comments to utility functions
- [ ] Document state management patterns

---

## Success Criteria

The base layer is complete when:

1. ✅ Application compiles without errors
2. ✅ All TypeScript interfaces are defined
3. ✅ Zustand stores are created with proper types
4. ✅ All components render with proper structure (no functionality)
5. ✅ Basic routing works
6. ✅ Forms validate input using Zod schemas
7. ✅ UI is responsive and styled with Tailwind
8. ✅ File upload UI accepts files (doesn't parse them)
9. ✅ LocalStorage helpers work for saving/loading
10. ✅ Project is well-documented with README

---

## Next Steps (Future Phases)

After completing the base layer, implement in this order:

### Phase A: File Parsing

- Integrate `pdfjs-dist` for PDF parsing
- Integrate `mammoth` for DOCX parsing
- Integrate `unified` + `remark-parse` for Markdown
- Implement Web Worker for parsing
- Add error handling and warnings

### Phase B: Prompt System

- Load prompt templates from JSON
- Implement prompt hydration logic
- Add dynamic field injection
- Handle template versioning

### Phase C: Gemini Integration

- Integrate `@google/generative-ai` SDK
- Implement streaming response handler
- Add error handling (401, 429, 5xx)
- Implement retry logic with exponential backoff

### Phase D: Authentication (Future Addition)

- Integrate Google Identity Services
- Implement token handling
- Add user profile display
- Implement logout flow
- Add Login page component

### Phase E: Polish & Edge Cases

- Implement cooldown timer
- Add file size validation (1MB limit)
- Add word count limits (1000/1200)
- Implement autosave
- Add accessibility improvements
- Add loading states and transitions

---

## Notes for Developers

### Coding Standards

- Use TypeScript strict mode
- Follow React best practices (hooks, functional components)
- Use Tailwind for styling (no custom CSS unless necessary)
- Validate all inputs with Zod
- Handle errors gracefully with try-catch
- Add proper TypeScript types for all props and state

### Performance Considerations

- Lazy load pages with React.lazy()
- Memoize expensive computations with useMemo()
- Debounce user inputs (especially autosave)
- Keep bundle size under 500KB (initial load)

### Security Considerations

- Never log API keys (even in development)
- Sanitize all user inputs
- Use environment variables for sensitive config
- Implement proper CSP headers when deploying

### Accessibility

- Use semantic HTML
- Add proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers
- Maintain proper color contrast

---

## Questions to Resolve

Before starting implementation:

1. **Hosting:** Where will this be deployed? (Vercel, Netlify, GitHub Pages?)
2. **Analytics:** Do we need usage tracking? (GA4, Plausible?)
3. **Error Tracking:** Should we integrate Sentry or similar?
4. **Prompt Templates:** Should templates be in JSON or TypeScript?
5. **Design System:** Do we have a specific color palette/brand guidelines?

---

## Estimated Timeline

- **Setup & Configuration:** 1 day
- **Type System & State Management:** 1 day
- **Layout & Routing:** 1 day
- **Component Structure:** 2-3 days
- **Styling & Polish:** 1-2 days
- **Documentation:** 1 day

**Total:** ~7-9 days for base layer

---

_This document will be updated as implementation progresses. All stub functions marked with `[STUB]` will be implemented in future phases._
