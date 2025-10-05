# PDF Worker Fix - Build Configuration

## Issue

When running the production build (`npm start` or `npm run preview`), PDF file uploads fail with:

```
Failed to parse PDF: Setting up fake worker failed: "Failed to fetch dynamically imported module: http://localhost:4173/pdf.worker.min.js"
```

## Root Cause

PDF.js requires a separate worker file (`pdf.worker.min.js`) to parse PDFs. This worker file needs to be available in the production build, but wasn't being copied to the `dist/` folder during the build process.

## Solution

### 1. Create Public Folder

Vite automatically copies files from a `public/` folder to the build output.

```bash
mkdir -p public
cp pdf.worker.min.js public/
```

### 2. Verify Build Output

After building, the worker file should be in the `dist/` folder:

```bash
npm run build
ls -la dist/pdf.worker.min.js
```

Expected output:

```
-rw-r--r--  1 user  staff  1046214 Oct  5 19:20 dist/pdf.worker.min.js
```

### 3. Configuration

The PDF parser is configured to use the local worker:

**src/lib/parsers/pdfParser.ts:**

```typescript
import * as pdfjs from "pdfjs-dist";

// Configure worker path for client-side processing
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
```

## File Structure

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

## How Vite Handles Public Assets

Vite treats the `public/` directory specially:

1. Files in `public/` are **not** processed by Vite
2. They are **copied as-is** to the root of `dist/` during build
3. They can be referenced using an **absolute path** starting with `/`

Reference: [Vite Static Assets](https://vitejs.dev/guide/assets.html#the-public-directory)

## Alternative: CDN Fallback

If you want to use a CDN as a fallback (not recommended for production due to network dependency):

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

## Verification Steps

1. **Build the application:**

   ```bash
   npm run build
   ```

2. **Check worker file is copied:**

   ```bash
   ls dist/pdf.worker.min.js
   ```

3. **Start production preview:**

   ```bash
   npm start
   ```

4. **Test PDF upload:**
   - Open http://localhost:4173
   - Upload a PDF file
   - Should parse successfully without worker errors

## Common Issues

### Issue: Worker file not found in dist/

**Solution:** Ensure `public/pdf.worker.min.js` exists before building

```bash
ls public/pdf.worker.min.js
npm run build
```

### Issue: Worker version mismatch

**Solution:** Ensure worker version matches pdfjs-dist version

```bash
# Check installed version
npm list pdfjs-dist

# Download matching worker
# Visit: https://github.com/mozilla/pdf.js/releases
# Or use CDN version that matches
```

### Issue: 404 error for worker in production

**Solution:** Check that your hosting platform serves static files correctly

- Vercel/Netlify: Should work automatically
- Custom server: Ensure `/pdf.worker.min.js` is accessible

## Prevention Strategy

To prevent this issue in the future:

1. ✅ Keep `pdf.worker.min.js` in `public/` folder
2. ✅ Add to version control (it's tracked in git)
3. ✅ Test production build before deploying
4. ✅ Add to deployment checklist

## Build Scripts

```json
{
  "scripts": {
    "dev": "vite", // Development with worker
    "build": "tsc && vite build", // Copies public/* to dist/
    "start": "vite preview", // Test production build locally
    "preview": "vite preview" // Same as start
  }
}
```

## Status

✅ **Fixed** - PDF worker is now properly included in production builds
✅ **Tested** - Worker file copied to dist/ folder
✅ **Documented** - Solution documented for future reference

## Related Files

- `public/pdf.worker.min.js` - Worker source file
- `src/lib/parsers/pdfParser.ts` - Worker configuration
- `vite.config.ts` - Build configuration (handles public folder)
- `package.json` - Build scripts

## References

- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [Vite Public Directory](https://vitejs.dev/guide/assets.html#the-public-directory)
- [PDF.js Worker Configuration](https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions#worker)
