# Bug Fix Log - Resume Doctor

This document tracks all bugs encountered during development and their solutions.

---

## Table of Contents

1. [Submit Button Validation Issues](#1-submit-button-validation-issues)
2. [reCAPTCHA Invalid Site Key Error](#2-recaptcha-invalid-site-key-error)
3. [reCAPTCHA Dynamic Script Loading Error](#3-recaptcha-dynamic-script-loading-error)
4. [Gemini API System Instruction Error](#4-gemini-api-system-instruction-error)

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

   - Unit tests for form validation logic
   - Integration tests for API calls
   - E2E tests for user workflows

2. **Add error boundaries** for graceful failure handling:

   - ✅ Already implemented in Phase F
   - Add specific error boundaries for API calls

3. **Improve error messages** for better UX:

   - More descriptive validation errors
   - User-friendly API error messages
   - Recovery suggestions

4. **Add monitoring** for production:
   - Log API errors
   - Track reCAPTCHA failures
   - Monitor performance metrics

---

## Notes

- All bugs were caught during Phase D-F implementation
- Most issues related to async initialization and API integration
- Good documentation helped resolve issues quickly
- Environment variable approach improved security and flexibility

**Last Updated**: October 5, 2025  
**Next Review**: Before Phase G (Comprehensive Testing)
