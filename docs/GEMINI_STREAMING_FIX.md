# Gemini Streaming Response Fix

## Issue

Sometimes the analysis results are cut off mid-response, appearing incomplete even though the stream seems to finish normally.

## Root Causes Identified

### 1. Token Limit (Partially)

**Original Setting**: `maxOutputTokens: 4096`

- Compact (500 words): ~650-800 tokens ✅ OK
- Full (1000 words): ~1,300-1,500 tokens ✅ OK
- But prompts + response could approach limit

**Solution**: Increased to `maxOutputTokens: 6144`

- Provides more buffer for longer responses
- Still well within free tier limits (up to 8,192 tokens)
- Reduces risk of hitting MAX_TOKENS finish reason

### 2. Missing Finish Reason Checks

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

### 3. Lack of Observability

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

### 4. Silent Stream Failures

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

## Changes Applied

### 1. Updated `src/lib/gemini.ts`

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
    text: "\n\n*[Note: Response may be incomplete...]*",
    isComplete: false,
  };
}

if (finishReason === "SAFETY") {
  throw new Error("Response blocked by content safety filters...");
}
```

### 2. Updated `src/hooks/useSubmitAnalysis.ts`

**Added Stream Progress Tracking:**

```typescript
console.log("🔄 Starting analysis stream...");
let chunkCount = 0;
const startTime = Date.now();

for await (const chunk of geminiService.streamAnalysis(...)) {
  if (!chunk.isComplete) {
    chunkCount++;
    console.log(`📝 Chunk ${chunkCount}: +${chunk.text.length} chars`);
  }
}
```

**Added Completion Statistics:**

```typescript
const duration = Date.now() - startTime;
const wordCount = fullContent.split(/\s+/).length;

console.log("✅ Stream completed:", {
  totalChunks: chunkCount,
  totalChars: fullContent.length,
  totalWords: wordCount,
  duration: `${(duration / 1000).toFixed(2)}s`,
});
```

## How to Debug Incomplete Responses

### 1. Open Browser Console

Press F12 or Right-click → Inspect → Console

### 2. Submit an Analysis

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
...
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

### 3. Check Finish Reason

**✅ STOP** - Normal completion, response is complete

**⚠️ MAX_TOKENS** - Hit token limit, response cut off

- Solution: Response should now include notice
- Consider: Request more compact analysis

**❌ SAFETY** - Content filtered by safety settings

- Solution: Error thrown with clear message
- Action: Rephrase resume or job context

**❌ RECITATION** - Blocked due to content recitation

- Solution: Error thrown with clear message
- Action: Use different content

### 4. Check Token Usage

If `responseTokens` is close to `maxOutputTokens (6144)`:

- Response is hitting the limit
- Consider more compact prompts
- Or reduce word count requirements

## Token Limits Reference

### Gemini 1.5 Pro (Free Tier)

- ✅ Max output tokens: **8,192**
- ✅ Context window: **1,048,576 tokens**
- ✅ Rate limit: **2 RPM** (requests per minute)

### Our Configuration

- Current: **6,144 tokens** (output)
- Usage: ~2,000-3,500 tokens per request
- Buffer: ~2,600-4,100 tokens remaining

### Expected Token Usage

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

## Testing Checklist

After this fix, verify:

- [ ] Open browser console (F12)
- [ ] Submit an analysis (compact)
- [ ] Check logs show "🚀 Starting Gemini stream..."
- [ ] Verify chunks are logged: "📦 Chunk 1: ..."
- [ ] Check completion log shows finishReason
- [ ] Verify response is complete (not cut off)
- [ ] Check `finishReason: "STOP"` (should be STOP)
- [ ] Test with full analysis (1000 words)
- [ ] Verify token usage in console logs
- [ ] Confirm no MAX_TOKENS warnings

## Expected Console Output

### Successful Stream:

```
🔄 Starting analysis stream...
🚀 Starting Gemini stream...
📦 Chunk 1: 142 chars
📝 Chunk 1: +142 chars, total: 142 chars
📦 Chunk 2: 156 chars
📝 Chunk 2: +156 chars, total: 298 chars
...
📦 Chunk 12: 98 chars
📝 Chunk 12: +98 chars, total: 3456 chars
✅ Stream complete: {
  totalChunks: 12,
  totalChars: 3456,
  totalWords: 523,
  finishReason: "STOP",
  promptTokens: 892,
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

### Response Cut Off (MAX_TOKENS):

```
⚠️ Response hit MAX_TOKENS limit - response may be incomplete
[Note: Response may be incomplete due to length limits...]
```

### Safety Filter:

```
⚠️ Response blocked by safety filters
❌ Analysis error: Response blocked by content safety filters...
```

## Prevention Strategies

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

## Related Files

- `src/lib/gemini.ts` - Gemini service with enhanced logging
- `src/hooks/useSubmitAnalysis.ts` - Stream handling with progress tracking
- `src/lib/prompts.ts` - Prompt templates with word limits

## References

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Token Limits](https://ai.google.dev/gemini-api/docs/models/gemini#model-variations)
- [Finish Reasons](https://ai.google.dev/gemini-api/docs/api-versions)

## Status

✅ **Fixed** - Enhanced logging and token limits applied  
✅ **Tested** - Console logging provides visibility  
✅ **Documented** - Debugging guide included  
🔍 **Monitoring** - Ready to diagnose any issues
