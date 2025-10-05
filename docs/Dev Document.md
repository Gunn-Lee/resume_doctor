# # High-level take

- **Feasib**Data flow\*\*

1. Us# Bot Protection (reCAPTCHA v3)

- Use **reCAPTCHA v3** for invisible bot detection - no user interaction required.
- Get site key from Google reCAPTCHA console, verify tokens client-side.
  -# Final callouts

- **reCAPTCHA v3** provides invisible bot protection without affecting UX - essential for preventing API abuse.
- Keep the **templates JSON** versioned so you can update verbiage without redeploying code (even store it as a hosted JSON you fetch on load).
- Consider adding a usage counter/analytics to monitor API usage patterns and detect abuse.egrate with form submission: get score (0.0-1.0), block if score < 0.5.
- Protects Gemini API quota from automated abuse without UX friction.
- Add script: `<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>`lects **Template Type** (Compact/Full) + **Domain** (Universal/Tech/Non-Tech).

2. User provides resume (text or file) → parse text **in a Web Worker**.
3. User inputs job context + optional fields → validate with zod.
4. **reCAPTCHA v3** validates user is not a bot (invisible, no user interaction).
5. Assemble prompt from your **prompt templates JSON** (you already have this) → fill dynamic fields.
6. Call Gemini with user's key → stream result → show in Result pane.
7. Enforce **10s cooldown** on submit to reduce accidental repeats.-only**: Local file parsing, **Gemini** calls via the official browser SDK, and **reCAPTCHA v3\*\* bot protection are all doable purely in the client.

- **Security trade-off**: Users will paste their **own Gemini API key**. Treat it as toxic waste—never send it anywhere, never log it, and default to **session-only** storage. Offer an explicit "remember key in Local Storage" toggle (off by default).
- **Bot protection**: Use **reCAPTCHA v3** for invisible bot detection to prevent API abuse without user friction.
- **Performance**: PDF/DOCX parsing and long prompts can block the UI—use a **Web Worker** for parsing and prompt assembly.ocument

# High-level take

- **Feasible client-only**: Google login (via **Google Identity Services**), local file parsing, and **Gemini** calls via the official browser SDK are all doable purely in the client.
- **Security trade-off**: Users will paste their **own Gemini API key**. Treat it as toxic waste—never send it anywhere, never log it, and default to **session-only** storage. Offer an explicit “remember key in Local Storage” toggle (off by default).
- **Performance**: PDF/DOCX parsing and long prompts can block the UI—use a **Web Worker** for parsing and prompt assembly.

---

# Architecture (frontend-only)

**Libraries**

- React + Vite (fast dev) or Next.js (if you ever want to add a backend later).
- UI: **shadcn/ui + Tailwind** (fast, accessible).
- Forms/validation: **react-hook-form + zod**.
- State: **Zustand** (tiny, unopinionated).
- Routing: React Router (or Next’s app router if you go Next).
- File parsing:
  - PDF: **pdfjs-dist** (extract text), optionally **pdf-parse/lib** equivalents for browser.
  - DOCX: **mammoth** (to text/HTML).
  - Markdown: **unified + remark-parse**.
- AI: **@google/generative-ai** (browser SDK).
- Workers: **comlink** to simplify worker messaging.

**Data flow**

1. User logs in with Google → store minimal profile (name, email, avatar) in memory.
2. User selects **Template Type** (Compact/Full) + **Domain** (Universal/Tech/Non-Tech).
3. User provides resume (text or file) → parse text **in a Web Worker**.
4. User inputs job context + optional fields → validate with zod.
5. Assemble prompt from your **prompt templates JSON** (you already have this) → fill dynamic fields.
6. Call Gemini with user’s key → stream result → show in Result pane.
7. Enforce **10s cooldown** on submit to reduce accidental repeats.

---

# Auth (no backend)

- Use **Google Identity Services (GIS)** button (popup mode). Request **profile/email only** (no drive, no calendar).
- You’ll get an **ID token** that you can verify client-side only for display; there’s no server to verify signature, so don’t base security decisions on it. It’s just gated UX.
- If true auth/trust matters later, plan a lightweight server to verify tokens.

---

# Handling the Gemini API key (client-only)

- Input field with **masking** + “eye” toggle.
- **Do not** auto-persist. Provide a **“Remember this key (LocalStorage)”** checkbox; default **unchecked**.
- Keep a **copy in memory** (Zustand store) during the session even if user doesn’t persist it.
- Add a **“Clear key”** button in a small “Privacy” menu.

---

# File parsing & prompt assembly

- Accept: raw text, **PDF**, **DOCX**, **MD**.
- Run parsing in a **Worker**:
  - Detect MIME → route to correct parser.
  - Normalize whitespace, collapse hyphenated line breaks (PDF quirk).
  - Return `{ text, wordCount, parseWarnings }`.
- Prompt assembly:
  - Keep your six templates in a **versioned JSON** object.
  - Map dropdown:
    - Analysis depth: `compact|full`
    - Domain: `universal|technical|nonTechnical`
  - Fill slots: resume text, title, company, level, geo, special focus, memo.

---

# UX details (mentor checklist)

- **Cooldown button**: after submit, disable for 10s with a countdown label (“Submit (9s)”).
- **Streaming UI**: show tokens as they arrive; include a copy button and “Open in new tab” printer-friendly view.
- **Autosave (client-only)**: persist last inputs (excluding the API key unless toggled) in LocalStorage.
- **Validation**: block submit if no resume text (post-parse) or no API key; surface friendly errors (Gemini 4xx/5xx).
- **Accessibility**: proper labels, focus states, keyboard nav; live region for streaming text.

---

# Privacy & security guardrails

- Never send files or the API key anywhere except **directly to Gemini**.
- **reCAPTCHA v3**: Only send score verification to Google's servers, no user data.
- `console.log` scrubbing: guard build to strip logs in production.
- CSP suggestion (if you host statically): restrict to your domain + Gemini + reCAPTCHA endpoints.
- Provide a **Privacy note** modal outlining that analysis runs locally and the key stays in the browser.

---

# Component breakdown

```
/src
  /app
    AppShell.tsx            // layout + toasts + theme
    Router.tsx
  /pages
    Main.tsx                // Input + Result layout
  /components
    ResumeDropzone.tsx      // file picker + drag/drop
    ParsedPreview.tsx       // word count, warnings
    PromptConfigForm.tsx    // dropdowns + inputs (react-hook-form)
    SubmitBar.tsx           // submit + cooldown + API key field + reCAPTCHA
    ResultPane.tsx          // streaming viewer + copy + download
  /store
    useSession.ts           // apiKey (session), rememberKey flag
    useAppState.ts          // parsedResume, form values, job context
  /workers
    parser.worker.ts        // pdf/docx/md → text
  /lib
    gemini.ts               // create client, call model, stream helper
    prompts.ts              // your 6 templates JSON
    buildPrompt.ts          // hydrate template with inputs + resume
    recaptcha.ts            // reCAPTCHA v3 integration
  /utils
    validation.ts           // zod schemas
    cooldown.ts             // submit rate limit helper

```

---

# Form schema (zod, minimal)

```tsx
const JobContextSchema = z.object({
  analysisDepth: z.enum(["compact", "full"]),
  domain: z.enum(["universal", "technical", "nonTechnical"]),
  targetRole: z.string().min(2),
  targetCompany: z.string().min(2),
  experienceLevel: z.enum(["Entry", "Mid", "Senior"]),
  geographicFocus: z.string().optional(),
  specialFocus: z.string().optional(),
  memo: z.string().max(1000).optional(),
  resumeText: z
    .string()
    .min(200, "Please provide at least ~200 characters after parsing."),
  geminiApiKey: z.string().regex(/^AI.*/, "Paste a valid Gemini API key"),
  recaptchaToken: z.string().min(1, "reCAPTCHA verification required"),
});
```

---

# Gemini call (browser)

```tsx
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function* streamResumeAnalysis({
  apiKey,
  systemPrompt,
  userPrompt,
}: {
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
}) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const chat = model.startChat({
    systemInstruction: systemPrompt,
    generationConfig: { temperature: 0.2, topP: 0.9 },
  });
  const resp = await chat.sendMessageStream(userPrompt);
  for await (const chunk of resp.stream) {
    yield chunk.text();
  }
}
```

> Tip: build systemPrompt and userPrompt from your templates; for compact modes you can collapse headings to reduce tokens.

---

# Cooldown logic

```tsx
const [cooldown, setCooldown] = useState(0);
useEffect(() => {
  if (!cooldown) return;
  const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
  return () => clearInterval(id);
}, [cooldown]);

async function onSubmit(values) {
  if (cooldown) return;
  setCooldown(10);
  // proceed with parse + call
}
```

---

# Edge cases to handle (don’t skip)

- **Huge PDFs/DOCX**: show a “Trimming to first N pages / M tokens” notice; offer a toggle to include more (with perf warning).
- **Over-long resumes (~pages/words)**: enforce a soft limit of **~2 pages ≈ 1,000 words** with a hard stop around **1,200 words**.
  - **PDF page hint (if available):** try `pdfjs`’s `pdf.numPages > 2 → block or warn`.
  - **Universal fallback:** after parsing to text, `wordCount = text.trim().split(/\s+/).length`; warn at >1000, reject at >1200.
  - **UX nicety:** show “~X pages” = `Math.ceil(wordCount / 500)` and offer “Trim to first 1000 words”.
- **Oversized files (scans/images)**: reject files **> 1 MB** before parsing to avoid heavy/scanned uploads that won’t parse well anyway.
  - Quick check: `if (file.size > 1 * 1024 * 1024) { error("Under 1 MB only"); }`
- **Non-English resumes**: detect language (simple heuristic: `franc` or similar) → pass a short instruction to respond in the resume’s language unless user overrides.
- **Gemini errors**: 401 invalid key, 429 rate limit, 5xx retry with exponential backoff (max 2).
- **Pasted resumes**: normalize smart quotes, bullets, and line breaks.

---

# Testing strategy (lightweight)

- **Unit**: prompt assembly, zod schema, cooldown, workers (parse fixtures).
- **E2E**: Playwright smoke: login → upload → submit → streamed text appears; error path with bad API key.
- **Accessibility**: axe + snapshots on Main page.

---

# Deployment

- Static hosting: Vercel/Netlify/GitHub Pages.
- If you later add a tiny backend (optional): put it behind `/api` to verify Google tokens and optionally proxy Gemini (lets you drop user-provided keys). But today’s plan works without it.

---

# Final callouts

- If **Google login is “nice-to-have”**, consider skipping it at v1 to reduce auth complexity (since there’s no server) and focus on resume → result flow. You can still include it as a user-profile garnish later.
- Keep the **templates JSON** versioned so you can update verbiage without redeploying code (even store it as a hosted JSON you fetch on load).
