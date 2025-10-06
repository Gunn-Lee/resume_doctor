# Bug Fix Log - Resume Doctor

This document tracks all bugs encountered during development and their solutions.

---

## Table of Contents

1. [Submit Button Validation Issues](#1-submit-button-validation-issues)
2. [reCAPTCHA Invalid Site Key Error](#2-recaptcha-invalid-site-key-error)
3. [reCAPTCHA Dynamic Script Loading Error](#3-recaptcha-dynamic-script-loading-error)
4. [Gemini API System Instruction Error](#4-gemini-api-system-instruction-error)
5. [PDF Worker Not Found in Production Build](#5-pdf-worker-not-found-in-production-build)
6. [Gemini Streaming Responses Cut Off](#6-gemini-streaming-responses-cut-off)

---

## 1. Submit Button Validation Issues

### Issue #1a: Submit Button Stays Disabled

**Date**: October 5, 2025  
**Severity**: High  
**Status**: ✅ Fixed

#### Problem

The submit button remained disabled even after the user filled out the form and uploaded a resume.

#### Root Cause

The `PromptConfigForm` component only updated parent state when the form was explicitly submitted (via `onSubmit`), but there was no submit button in the form. The form data never reached the Zustand store, so the `isFormComplete` validation in `Main.tsx` always returned `false`.

#### Solution

Modified `PromptConfigForm.tsx` to use `watch()` from react-hook-form to monitor all form values and update the store in real-time via `useEffect`:

```typescript
const watchedValues = watch();

useEffect(() => {
  const currentFormData = useAppState.getState().formData;
  if (JSON.stringify(currentFormData) !== JSON.stringify(watchedValues)) {
    useAppState.getState().setFormData(watchedValues);
  }
}, [watchedValues]);
```

#### Files Modified

- `src/components/PromptConfigForm.tsx`
- `src/pages/Main.tsx`

#### Related Documentation

- See: `docs/SUBMIT_BUTTON_FIX.md`

---

### Issue #1b: Infinite Loop Error

**Date**: October 5, 2025  
**Severity**: Critical  
**Status**: ✅ Fixed

#### Problem

```
Maximum update depth exceeded. This can happen when a component repeatedly
calls setState inside componentWillUpdate or componentDidUpdate.
```

#### Root Cause

The initial fix for Issue #1a included `onSubmit` as a dependency in the `useEffect`. Since `onSubmit` was being recreated on every render in the parent component, it triggered an infinite update loop:

1. Effect runs → updates store
2. Store update → parent re-renders
3. Parent re-render → new `onSubmit` function
4. New `onSubmit` → effect runs again
5. **Infinite loop!**

#### Solution

1. Removed `onSubmit` from `useEffect` dependencies
2. Added value comparison to only update when data actually changes
3. Wrapped parent's `handleFormSubmit` in `useCallback` with empty dependencies

```typescript
// In PromptConfigForm.tsx
useEffect(() => {
  const currentFormData = useAppState.getState().formData;
  if (JSON.stringify(currentFormData) !== JSON.stringify(watchedValues)) {
    useAppState.getState().setFormData(watchedValues);
  }
}, [watchedValues]); // Only depend on watchedValues, not onSubmit

// In Main.tsx
const handleFormSubmit = useCallback((data: Partial<JobContextFormData>) => {
  console.log("Form submitted (callback triggered):", data);
}, []); // Empty dependencies = stable reference
```

#### Files Modified

- `src/components/PromptConfigForm.tsx`
- `src/pages/Main.tsx`

#### Related Documentation

- See: `docs/INFINITE_LOOP_FIX.md`

---

## 2. reCAPTCHA Invalid Site Key Error

**Date**: October 5, 2025  
**Severity**: High  
**Status**: ✅ Fixed

#### Problem

```
Error: Invalid site key or not loaded in api.js: 6Lf-b98rAAAAALvMJcCJoW2kwIgJyOYeHIuZnjdc
```

#### Root Cause

The reCAPTCHA script was being loaded with the wrong parameter:

- ❌ **Wrong**: `render=explicit` (used for reCAPTCHA v2)
- ✅ **Correct**: `render=YOUR_SITE_KEY` (required for reCAPTCHA v3)

#### Solution

Updated `index.html` to load reCAPTCHA v3 with the correct site key parameter:

```html
<!-- Before -->
<script src="https://www.google.com/recaptcha/api.js?render=explicit"></script>

<!-- After -->
<script src="https://www.google.com/recaptcha/api.js?render=6Lf-b98rAAAAALvMJcCJoW2kwIgJyOYeHIuZnjdc"></script>
```

#### Verification Steps

1. Verify in GCP Console that the key is for reCAPTCHA v3 (not v2)
2. Confirm `localhost` is whitelisted in domain settings
3. Restart dev server
4. Clear browser cache

#### Files Modified

- `index.html`

#### Related Documentation

- See: `docs/RECAPTCHA_ERROR_FIX.md`
- See: `docs/RECAPTCHA_CHECKLIST.md`

---

## 3. reCAPTCHA Dynamic Script Loading Error

**Date**: October 5, 2025  
**Severity**: High  
**Status**: ✅ Fixed

#### Problem

After moving to environment variables, got error:

```
TypeError: Cannot read properties of undefined (reading 'ready')
```

#### Root Cause

The script injection was happening asynchronously, but `getRecaptchaToken()` was trying to use `window.grecaptcha.ready()` before the script was fully loaded and initialized.

#### Solution

1. **Moved from hardcoded to dynamic injection** to support environment variables:

   - Removed hardcoded script from `index.html`
   - Added `injectRecaptchaScript()` function in `recaptcha.ts`
   - Script now uses site key from `.env` file

2. **Fixed timing issue** by ensuring initialization before use:

   ```typescript
   export async function getRecaptchaToken(
     action: string = "submit"
   ): Promise<string> {
     // Ensure reCAPTCHA is initialized before using it
     await initRecaptcha();

     return new Promise((resolve, reject) => {
       window.grecaptcha.ready(async () => {
         // Now safe to use
       });
     });
   }
   ```

#### Benefits

- ✅ Site key from environment variables (not hardcoded)
- ✅ Can use different keys per environment (dev/staging/prod)
- ✅ Proper initialization sequence
- ✅ Follows 12-factor app methodology

#### Files Modified

- `index.html` - Removed hardcoded script
- `src/lib/recaptcha.ts` - Added dynamic injection and proper initialization

#### Related Documentation

- See: `docs/RECAPTCHA_ENV_VAR.md`

---

## 4. Gemini API System Instruction Error

**Date**: October 5, 2025  
**Severity**: Critical  
**Status**: ✅ Fixed

#### Problem

```
Analysis submission error: Error: Analysis failed: [GoogleGenerativeAI Error]:
Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:streamGenerateContent?alt=sse:
[400 Bad Request] Invalid value at 'system_instruction'
```

#### Root Cause

The system instruction was being passed to the wrong API method. The code was trying to set `systemInstruction` in `startChat()`, but the Gemini API requires it to be set when creating the model with `getGenerativeModel()`.

#### Incorrect Implementation

```typescript
// ❌ WRONG
export class GeminiService {
  private model: any;

  constructor(apiKey: string) {
    this.model = this.client.getGenerativeModel({
      model: "gemini-1.5-pro",
      // No systemInstruction here
    });
  }

  async *streamAnalysis(systemPrompt: string, userPrompt: string) {
    const chat = this.model.startChat({
      systemInstruction: systemPrompt, // Not supported here!
    });
  }
}
```

#### Correct Implementation

```typescript
// ✅ CORRECT
export class GeminiService {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async *streamAnalysis(systemPrompt: string, userPrompt: string) {
    // Create model with systemInstruction
    const model = this.client.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: systemPrompt, // Correct location!
      generationConfig: { ... },
    });

    // Use generateContentStream directly
    const result = await model.generateContentStream(userPrompt);
  }
}
```

#### Key Changes

1. Moved model creation from constructor to `streamAnalysis()` method
2. Set `systemInstruction` in `getGenerativeModel()` (correct location per API docs)
3. Use `generateContentStream()` directly instead of `startChat()`
4. Removed unnecessary chat session for single-turn interactions

#### Benefits

- ✅ Fixes the 400 Bad Request error
- ✅ More flexible - each request can have different system prompts
- ✅ Simpler code - direct streaming without chat setup
- ✅ Follows official Google API guidelines

#### Files Modified

- `src/lib/gemini.ts`

#### Related Documentation

- See: `docs/GEMINI_SYSTEM_INSTRUCTION_FIX.md`
- Official: [Gemini API - System Instructions](https://ai.google.dev/gemini-api/docs/system-instructions)

---

## Common Debugging Techniques Used

### 1. Console Logging

Added strategic debug logs to trace data flow:

```typescript
console.log("Form validation state:", {
  parsedResume: !!parsedResume,
  formData,
  isFormComplete,
  isSubmitDisabled,
});
```

### 2. React DevTools

- Monitored component re-renders
- Inspected Zustand store state
- Tracked effect executions

### 3. Network Tab

- Verified API requests to Gemini
- Checked reCAPTCHA token generation
- Analyzed error responses

### 4. TypeScript Errors

- Used `get_errors` to catch type issues early
- Fixed compilation errors before runtime testing

---

## Prevention Strategies

### 1. Effect Dependencies

**Lesson**: Always carefully consider `useEffect` dependencies

- ✅ Use stable references (`useCallback` with empty deps)
- ✅ Compare values before updating state
- ❌ Avoid including recreated functions in dependencies

### 2. API Documentation

**Lesson**: Read official API documentation thoroughly

- ✅ Check parameter names and locations
- ✅ Verify correct API patterns
- ✅ Use recommended code examples
- ❌ Don't assume API methods work similarly

### 3. Environment Variables

**Lesson**: Use env vars for configuration

- ✅ Never hardcode API keys or site keys
- ✅ Support multiple environments (dev/staging/prod)
- ✅ Document required env vars in `.env.example`

### 4. Initialization Order

**Lesson**: Ensure proper async initialization

- ✅ Wait for dependencies before use (`await initRecaptcha()`)
- ✅ Check for undefined before accessing properties
- ✅ Add timeouts for external scripts

---

## 5. PDF Worker Not Found in Production Build

**Date**: October 5, 2025  
**Severity**: High  
**Status**: ✅ Fixed

### Problem

When running the production build with `npm start`, PDF file uploads failed with:

```
Failed to parse PDF: Setting up fake worker failed: "Failed to fetch dynamically imported module: http://localhost:4173/pdf.worker.min.js"
```

Works in development, breaks in production.

### Root Cause

PDF.js requires a separate worker file (`pdf.worker.min.js`) to parse PDFs. The worker file wasn't being copied to the `dist/` folder during build, causing a 404 error in production.

### Solution

**Step 1: Create public folder**

```bash
mkdir -p public
cp pdf.worker.min.js public/
```

Vite automatically copies `public/` contents to `dist/` during build.

**Step 2: Configure worker path**

In `src/lib/parsers/pdfParser.ts`:

```typescript
import * as pdfjs from "pdfjs-dist";

// Configure worker path for client-side processing
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
```

**Step 3: Verify**

```bash
npm run build
ls dist/pdf.worker.min.js  # ✅ Should exist
```

### File Structure

```
resume_doctor/
├── public/
│   └── pdf.worker.min.js          # Source file (copied to dist during build)
├── dist/                           # Build output
│   ├── assets/
│   ├── index.html
│   └── pdf.worker.min.js          # Worker file (available at runtime)
└── src/
    └── lib/
        └── parsers/
            └── pdfParser.ts        # Configures worker path
```

### Technical Details

**Vite public folder behavior:**

- Files in `public/` copied as-is to `dist/` root
- Not processed by Vite bundler
- Referenced with absolute paths (`/pdf.worker.min.js`)

Reference: [Vite Static Assets](https://vitejs.dev/guide/assets.html#the-public-directory)

### Alternative: CDN Fallback

If you want to use a CDN as a fallback (not recommended for production):

```typescript
// Option 1: CDN only
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Option 2: Local with CDN fallback (more complex)
try {
  await fetch("/pdf.worker.min.js");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
} catch {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}
```

### Common Issues

**Issue: Worker file not found in dist/**

Solution: Ensure `public/pdf.worker.min.js` exists before building

```bash
ls public/pdf.worker.min.js
npm run build
```

**Issue: Worker version mismatch**

Solution: Ensure worker version matches pdfjs-dist version

```bash
# Check installed version
npm list pdfjs-dist

# Download matching worker from:
# https://github.com/mozilla/pdf.js/releases
```

**Issue: 404 error for worker in production**

Solution: Check that hosting platform serves static files correctly

- Vercel/Netlify: Should work automatically
- Custom server: Ensure `/pdf.worker.min.js` is accessible

### Verification

1. ✅ Build completed successfully
2. ✅ Worker file in `dist/pdf.worker.min.js`
3. ✅ PDF uploads work in production preview
4. ✅ No console errors

### Files Modified

- Created `public/` folder with `pdf.worker.min.js`
- `src/lib/parsers/pdfParser.ts` - Worker configuration

### Prevention Strategy

1. ✅ Keep `pdf.worker.min.js` in `public/` folder
2. ✅ Add to version control
3. ✅ Test production build before deploying
4. ✅ Add to deployment checklist

### Related Documentation

- See: `docs/PDF_WORKER_FIX.md` (detailed guide)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [Vite Public Directory](https://vitejs.dev/guide/assets.html#the-public-directory)

---

## 6. Gemini Streaming Responses Cut Off

**Date**: October 5, 2025  
**Severity**: Medium-High  
**Status**: ✅ Fixed

### Problem

Analysis results sometimes appeared incomplete, cutting off mid-sentence even though the stream seemed to finish normally. No error messages indicated why.

### Root Causes Identified

#### 1. Token Limit (Partially)

**Original Setting**: `maxOutputTokens: 4096`

- Compact (500 words): ~650-800 tokens ✅ OK
- Full (1000 words): ~1,300-1,500 tokens ✅ OK
- But prompts + response could approach limit

**Solution**: Increased to `maxOutputTokens: 6144`

- Provides more buffer for longer responses
- Still well within free tier limits (up to 8,192 tokens)
- Reduces risk of hitting MAX_TOKENS finish reason

#### 2. Missing Finish Reason Checks

**Problem**: No way to know WHY the stream ended

- MAX_TOKENS: Hit token limit
- SAFETY: Content filtered
- RECITATION: Blocked due to duplication
- STOP: Normal completion

**Solution**: Added comprehensive finish reason checking

```typescript
const finishReason = response.candidates?.[0]?.finishReason;

if (finishReason === "MAX_TOKENS") {
  console.warn("⚠️ Response hit MAX_TOKENS limit");
  // Add notice to output
}
```

#### 3. Lack of Observability

**Problem**: No logging to debug stream issues

- Can't see how many chunks received
- Don't know total token usage
- No timing information

**Solution**: Added detailed logging throughout stream

```typescript
console.log("🚀 Starting Gemini stream...");
console.log(`📦 Chunk ${n}: ${text.length} chars`);
console.log("✅ Stream complete:", { stats });
```

#### 4. Silent Stream Failures

**Problem**: Stream might fail silently without proper error handling

- Network timeouts not caught
- Safety filters not reported
- Async errors swallowed

**Solution**: Enhanced error handling with specific messages

```typescript
if (finishReason === "SAFETY") {
  throw new Error("Response blocked by content safety filters...");
}
```

### Changes Applied

#### Updated `src/lib/gemini.ts`

**Increased Token Limit:**

```typescript
generationConfig: {
  temperature: 0.2,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 6144, // Was: 4096
  responseMimeType: "text/plain",
}
```

**Added Detailed Logging:**

```typescript
console.log("🚀 Starting Gemini stream...");
let totalChunks = 0;
let totalText = "";

for await (const chunk of result.stream) {
  totalChunks++;
  totalText += text;
  console.log(`📦 Chunk ${totalChunks}: ${text.length} chars`);
  // ...
}
```

**Added Finish Reason Checks:**

```typescript
const finishReason = response.candidates?.[0]?.finishReason;
const usageMetadata = response.usageMetadata;

console.log("✅ Stream complete:", {
  totalChunks,
  totalChars: totalText.length,
  totalWords: totalText.split(/\s+/).length,
  finishReason,
  promptTokens: usageMetadata?.promptTokenCount,
  responseTokens: usageMetadata?.candidatesTokenCount,
  totalTokens: usageMetadata?.totalTokenCount,
});
```

**Added Safety Warnings:**

```typescript
if (finishReason === "MAX_TOKENS") {
  yield {
    text: "\n\n*[Note: Response may be incomplete due to length limits. Consider requesting a more compact analysis.]*",
    isComplete: false,
  };
}

if (finishReason === "SAFETY") {
  throw new Error(
    "Response blocked by content safety filters. Please try rephrasing your resume or job context."
  );
}
```

#### Updated `src/hooks/useSubmitAnalysis.ts`

**Added Stream Progress Tracking:**

```typescript
console.log("� Starting analysis stream...");
let chunkCount = 0;
const startTime = Date.now();

for await (const chunk of geminiService.streamAnalysis(...)) {
  if (!chunk.isComplete) {
    chunkCount++;
    console.log(`� Chunk ${chunkCount}: +${chunk.text.length} chars`);
  }
}

const duration = Date.now() - startTime;
console.log("✅ Stream completed:", {
  totalChunks: chunkCount,
  totalChars: fullContent.length,
  totalWords: fullContent.split(/\s+/).length,
  duration: `${(duration / 1000).toFixed(2)}s`,
});
```

### How to Debug Incomplete Responses

#### 1. Open Browser Console

Press F12 or Right-click → Inspect → Console

#### 2. Submit an Analysis

Watch for these log messages:

**Stream Start:**

```
🚀 Starting Gemini stream...
```

**Each Chunk:**

```
📦 Chunk 1: 142 chars
📦 Chunk 2: 156 chars
📦 Chunk 3: 189 chars
```

**Stream Completion:**

```
✅ Stream complete: {
  totalChunks: 12,
  totalChars: 3456,
  totalWords: 523,
  finishReason: "STOP",
  promptTokens: 892,
  responseTokens: 1456,
  totalTokens: 2348
}
```

#### 3. Check Finish Reason

**✅ STOP** - Normal completion, response is complete

**⚠️ MAX_TOKENS** - Hit token limit, response cut off

- Solution: Response includes notice
- Consider: Request more compact analysis

**❌ SAFETY** - Content filtered by safety settings

- Solution: Error thrown with clear message
- Action: Rephrase resume or job context

**❌ RECITATION** - Blocked due to content recitation

- Solution: Error thrown with clear message
- Action: Use different content

#### 4. Check Token Usage

If `responseTokens` is close to `maxOutputTokens (6144)`:

- Response is hitting the limit
- Consider more compact prompts
- Or reduce word count requirements

### Token Limits Reference

**Gemini 1.5 Pro (Free Tier):**

- ✅ Max output tokens: **8,192**
- ✅ Context window: **1,048,576 tokens**
- ✅ Rate limit: **2 RPM** (requests per minute)

**Our Configuration:**

- Current: **6,144 tokens** (output)
- Usage: ~2,000-3,500 tokens per request
- Buffer: ~2,600-4,100 tokens remaining

**Expected Token Usage:**

```
System prompt:        500-800 tokens
Resume text:          400-1,200 tokens
Job context:          100-300 tokens
Response (500 words): 650-800 tokens
Response (1000 words): 1,300-1,500 tokens
─────────────────────────────────────
Total (compact):      1,650-3,100 tokens
Total (full):         2,300-3,800 tokens
```

### Expected Console Output

**Successful Stream:**

```
🔄 Starting analysis stream...
🚀 Starting Gemini stream...
📦 Chunk 1: 142 chars
📝 Chunk 1: +142 chars, total: 142 chars
📦 Chunk 2: 156 chars
📝 Chunk 2: +156 chars, total: 298 chars
...
✅ Stream complete: {
  totalChunks: 12,
  totalChars: 3456,
  totalWords: 523,
  finishReason: "STOP",
  responseTokens: 1456,
  totalTokens: 2348
}
✅ Stream completed: {
  totalChunks: 12,
  totalChars: 3456,
  totalWords: 523,
  duration: "4.23s"
}
```

**Response Cut Off (MAX_TOKENS):**

```
⚠️ Response hit MAX_TOKENS limit - response may be incomplete
[Note: Response may be incomplete due to length limits...]
```

**Safety Filter:**

```
⚠️ Response blocked by safety filters
❌ Analysis error: Response blocked by content safety filters...
```

### Prevention Strategies

1. **Monitor Token Usage**

   - Check console logs for token counts
   - Alert if approaching 6,000 tokens

2. **Adjust Prompts**

   - Keep system prompts concise
   - Limit resume length to 2-3 pages
   - Clear word count expectations

3. **Handle Edge Cases**

   - Very long resumes (>2000 words)
   - Complex job descriptions
   - Multiple special focus areas

4. **User Feedback**
   - Show token usage in UI (optional)
   - Warn if resume is too long
   - Suggest compact mode for long content

### Files Modified

- `src/lib/gemini.ts` - Enhanced streaming with logging and checks
- `src/hooks/useSubmitAnalysis.ts` - Added progress tracking

### Verification

- ✅ Console logs provide visibility
- ✅ Finish reasons checked and reported
- ✅ Token usage visible in logs
- ✅ Safety filters throw clear errors
- ✅ MAX_TOKENS adds notice to output

### Related Documentation

- See: `docs/GEMINI_STREAMING_FIX.md` (comprehensive debugging guide)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Token Limits](https://ai.google.dev/gemini-api/docs/models/gemini#model-variations)
- [Finish Reasons](https://ai.google.dev/gemini-api/docs/api-versions)

---

## Summary Statistics

**Total Bugs Fixed**: 6  
**High Severity**: 5  
**Medium-High Severity**: 1

### Bug Categories

- Form Validation & React Hooks: 2
- reCAPTCHA Integration: 2
- Gemini API Integration: 2 (system instruction, streaming)
- Build & Static Assets: 1

---

## Testing Checklist

After each fix, verify:

- [ ] No TypeScript compilation errors
- [ ] No console errors or warnings
- [ ] Component renders correctly
- [ ] Expected behavior works
- [ ] No performance issues (infinite loops)
- [ ] Works across browser refreshes
- [ ] Dev server can be restarted successfully

---

## Future Improvements

1. **Add automated tests** to catch these issues earlier:

   - ✅ Unit tests for form validation logic (139 tests implemented)
   - ✅ Integration tests for API calls (covered in component tests)
   - E2E tests for user workflows

2. **Add error boundaries** for graceful failure handling:

   - ✅ Already implemented in Phase F (ErrorBoundary component with 28 tests)
   - Add specific error boundaries for API calls

3. **Improve error messages** for better UX:

   - ✅ More descriptive validation errors (implemented in forms)
   - ✅ User-friendly API error messages (Gemini streaming errors)
   - ✅ Recovery suggestions (added to error messages)

4. **Add monitoring** for production:
   - ✅ Log API errors (console logging for streams)
   - ✅ Track reCAPTCHA failures (error handling in place)
   - Monitor performance metrics

---

## Detailed Documentation

Each bug fix has comprehensive documentation available:

### Issue #1 & #1b: Submit Button Validation

- **Main**: This document (sections 1a & 1b)
- **Details**: Individual fix documents (deprecated, merged here)

### Issue #2: reCAPTCHA Invalid Site Key

- **Main**: This document (section 2)
- **Setup Guide**: `docs/RECAPTCHA_SETUP.md`

### Issue #3: reCAPTCHA Dynamic Script Loading

- **Main**: This document (section 3)
- **Setup Guide**: `docs/RECAPTCHA_SETUP.md`

### Issue #4: Gemini API System Instruction

- **Main**: This document (section 4)
- **Details**: Individual fix document (deprecated, merged here)

### Issue #5: PDF Worker Not Found

- **Main**: This document (section 5) - **COMPREHENSIVE**
- **Standalone**: `docs/PDF_WORKER_FIX.md` (detailed troubleshooting guide)
- **Includes**: File structure, alternatives, common issues, verification steps

### Issue #6: Gemini Streaming Cut Off

- **Main**: This document (section 6) - **COMPREHENSIVE**
- **Standalone**: `docs/GEMINI_STREAMING_FIX.md` (debugging guide with console logs)
- **Includes**: Token limits, finish reasons, observability, prevention strategies

---

## Related Documentation

### Setup & Configuration

- `RECAPTCHA_SETUP.md` - Complete reCAPTCHA v3 setup guide
- `DEPLOYMENT.md` - Production deployment instructions
- `UNIT_TEST_SETUP.md` - Testing infrastructure and 139 tests

### Implementation Guides

- `Implementation Plan - Base Layer.md` - Phase A-B foundation
- `Implementation Plan - Core Functions.md` - Phase C-D features
- `Implementation Plan - Analysis Flow.md` - Phase E analytics
- `Implementation Plan - Authentication.md` - Phase G+ future features

### Testing Documentation

- `PROMPT_CONFIG_FORM_TESTS.md` - 26 form tests detailed
- `src/components/__tests__/README.md` - All 139 tests overview
- Component tests: ErrorBoundary (28), PromptConfigForm (26), ResultPane (27), ResumeDropzone (28), SubmitBar (30)

### Production

- `PRODUCTION_SUMMARY.md` - Live deployment summary
- `Dev Document.md` - Original development plan

---

## Notes

- All bugs were caught during Phase D-F implementation
- Most issues related to async initialization and API integration
- Good documentation helped resolve issues quickly
- Environment variable approach improved security and flexibility
- Comprehensive testing suite (139 tests) prevents regressions

**Last Updated**: October 5, 2025  
**Total Lines**: ~950  
**Next Review**: Before Phase G (Comprehensive Testing)

---

## Quick Reference

**Most Common Issues:**

1. reCAPTCHA setup → See `RECAPTCHA_SETUP.md`
2. PDF uploads fail in production → See Issue #5 (public folder)
3. Streaming cut off → See Issue #6 (check console logs)
4. Form validation → See Issue #1 (useEffect dependencies)

**For New Developers:**

- Start with `README.md` in docs folder
- Review this BUG_FIX_LOG for common pitfalls
- Check `UNIT_TEST_SETUP.md` for test examples
- See `DEPLOYMENT.md` for production setup
