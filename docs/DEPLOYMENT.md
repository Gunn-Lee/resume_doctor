# Deployment Guide

## Production Deployment

**Live URL**: [https://resume-doctor-liard.vercel.app/](https://resume-doctor-liard.vercel.app/)

**Platform**: Vercel  
**Deployment Method**: Automatic (Git-based)  
**Status**: ✅ Live

---

## Deployment Configuration

### Platform: Vercel

Vercel provides automatic deployments for Vite applications with zero configuration.

### Build Settings

**Framework Preset**: Vite  
**Build Command**: `npm run build`  
**Output Directory**: `dist`  
**Install Command**: `npm install`

### Environment Variables

The following environment variables need to be configured in Vercel:

#### Required

- `VITE_RECAPTCHA_SITE_KEY` - reCAPTCHA v3 site key
  - Get from: [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
  - Must whitelist: `resume-doctor-liard.vercel.app`

#### Optional

- None (API keys are entered client-side by users)

### Domain Configuration

**Production Domain**: `https://resume-doctor-liard.vercel.app/`

**reCAPTCHA Configuration**:

- ✅ Add `resume-doctor-liard.vercel.app` to authorized domains
- ✅ Add `localhost` for local development
- ✅ Supports both HTTP and HTTPS

---

## Deployment Process

### Automatic Deployment (Recommended)

Vercel automatically deploys on every push to the main branch:

1. **Push to GitHub**:

   ```bash
   git add .
   git commit -m "Update"
   git push origin main
   ```

2. **Vercel Detects Changes**:

   - Automatic build triggered
   - Build logs available in Vercel dashboard
   - ~2-3 minutes deployment time

3. **Deployment Complete**:
   - Production URL updated
   - Preview URLs for branches
   - Automatic HTTPS

### Manual Deployment

If needed, deploy manually using Vercel CLI:

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

---

## Build Verification

Before deploying, verify the build works locally:

### 1. Build the Application

```bash
npm run build
```

**Expected Output**:

```
✓ 2249 modules transformed.
dist/index.html                     0.88 kB
dist/assets/index-*.css            15.90 kB
dist/assets/state-*.js              3.59 kB
dist/assets/vendor-*.js            28.11 kB
dist/assets/form-*.js              77.16 kB
dist/assets/index-*.js          1,379.54 kB
dist/pdf.worker.min.js           1,046.21 kB
✓ built in 2.37s
```

### 2. Test Locally

```bash
npm start
# or
npm run preview
```

Open http://localhost:4173

### 3. Verify Checklist

- [ ] PDF uploads work
- [ ] DOCX uploads work
- [ ] Text paste works
- [ ] Form validation works
- [ ] reCAPTCHA loads (check console for errors)
- [ ] API key input works
- [ ] Analysis streaming works
- [ ] Markdown renders correctly
- [ ] Download functionality works
- [ ] Cooldown timer works
- [ ] No console errors

---

## Production Checklist

Before going live, ensure:

### Environment Setup

- [ ] reCAPTCHA site key configured in Vercel
- [ ] Production domain whitelisted in reCAPTCHA
- [ ] Environment variables verified

### Build Configuration

- [ ] `public/pdf.worker.min.js` exists
- [ ] Build completes without errors
- [ ] Bundle size acceptable (<2MB)
- [ ] Source maps disabled in production

### Security

- [ ] No API keys hardcoded
- [ ] No sensitive data in client code
- [ ] reCAPTCHA v3 enabled
- [ ] HTTPS enforced

### Testing

- [ ] All file upload formats work
- [ ] Form validation prevents invalid submissions
- [ ] Error messages are user-friendly
- [ ] Streaming updates work smoothly
- [ ] Mobile responsive
- [ ] Cross-browser compatible

### Monitoring

- [ ] Console errors monitored
- [ ] Vercel analytics enabled
- [ ] Error tracking configured (optional)

---

## Domain Management

### Current Domains

**Production**:

- Primary: `https://resume-doctor-liard.vercel.app/`
- Vercel subdomain: `https://resume-doctor-liard.vercel.app/`

**Preview** (automatic for branches):

- Format: `https://resume-doctor-{branch}.vercel.app/`
- Created for every PR

### Custom Domain Setup (Optional)

To add a custom domain:

1. **Add Domain in Vercel**:

   - Go to Vercel dashboard
   - Select project
   - Settings → Domains
   - Add custom domain

2. **Configure DNS**:

   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or add A records to Vercel IPs

3. **Update reCAPTCHA**:
   - Add custom domain to reCAPTCHA whitelist
   - Update environment variables if needed

---

## Troubleshooting

### Build Fails

**Check**:

1. TypeScript errors: `npm run build` locally
2. Missing dependencies: `npm install`
3. Environment variables: Verify in Vercel settings

**Common Issues**:

- Missing `pdf.worker.min.js` in public folder
- TypeScript compilation errors
- Missing environment variables

### PDF Upload Fails in Production

**Issue**: PDF worker not found
**Solution**: Ensure `public/pdf.worker.min.js` exists

- See: [PDF_WORKER_FIX.md](./PDF_WORKER_FIX.md)

### reCAPTCHA Errors

**Issue**: "Invalid site key" in production
**Solution**:

1. Verify `VITE_RECAPTCHA_SITE_KEY` in Vercel
2. Whitelist production domain in reCAPTCHA settings

- See: [RECAPTCHA_SETUP.md](./RECAPTCHA_SETUP.md)

### Streaming Incomplete

**Issue**: Analysis results cut off
**Solution**: Check browser console for finish reasons

- See: [GEMINI_STREAMING_FIX.md](./GEMINI_STREAMING_FIX.md)

---

## Performance Optimization

### Current Bundle Sizes

- Vendor chunk: ~28 KB (React, React Router)
- State chunk: ~3.5 KB (Zustand)
- Form chunk: ~77 KB (React Hook Form, Zod)
- Main chunk: ~1.38 MB (PDF.js, Gemini, etc.)

### Optimization Opportunities

1. **Code Splitting**: Dynamic imports for heavy libraries
2. **PDF.js**: Load worker only when needed
3. **Markdown**: Lazy load react-markdown
4. **Images**: Optimize and compress assets

### Cache Configuration

Vercel automatically configures optimal caching:

- Static assets: 1 year cache
- HTML: No cache (fresh on every visit)
- API: N/A (client-side only)

---

## Monitoring & Analytics

### Vercel Analytics

Available in Vercel dashboard:

- Page views
- Unique visitors
- Top pages
- Device types
- Geographic distribution

### Error Tracking

**Browser Console**:

- Check for errors in production
- Use browser DevTools
- Check Network tab for failed requests

**Recommended Tools** (optional):

- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for user behavior

---

## Rollback Strategy

### Quick Rollback

If deployment has issues:

1. **Via Vercel Dashboard**:

   - Go to Deployments
   - Find previous working deployment
   - Click "..." → "Promote to Production"

2. **Via Git**:
   ```bash
   git revert HEAD
   git push origin main
   ```

### Emergency Rollback

```bash
# Revert to last commit
git reset --hard HEAD~1
git push --force origin main
```

⚠️ **Warning**: Force push will overwrite remote history

---

## Deployment History

### Version 0.1.0 (October 5, 2025)

**Initial Production Deployment** ✅

**Features Deployed**:

- ✅ Client-side resume analysis
- ✅ PDF/DOCX/MD/TXT file parsing
- ✅ Gemini API streaming integration
- ✅ reCAPTCHA v3 security
- ✅ Form validation with Zod
- ✅ Error boundary
- ✅ Cooldown system
- ✅ Markdown result rendering

**Bug Fixes Included**:

- ✅ Submit button validation
- ✅ reCAPTCHA configuration
- ✅ Gemini API system instruction
- ✅ PDF worker in production build
- ✅ Streaming response logging

**Tests**:

- ✅ 26 unit tests for PromptConfigForm

---

## Maintenance

### Regular Tasks

**Weekly**:

- [ ] Check Vercel logs for errors
- [ ] Review analytics for usage patterns
- [ ] Monitor console errors

**Monthly**:

- [ ] Update dependencies: `npm update`
- [ ] Check for security advisories: `npm audit`
- [ ] Review and update documentation

**As Needed**:

- [ ] Update Gemini API version
- [ ] Refresh reCAPTCHA configuration
- [ ] Add new features

### Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Update all packages
npm update

# Update specific package
npm update <package-name>

# Rebuild and test
npm run build
npm start
```

---

## Support & Resources

### Links

- **Production**: https://resume-doctor-liard.vercel.app/
- **Repository**: https://github.com/Gunn-Lee/resume_doctor
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Gemini API**: https://ai.google.dev/
- **reCAPTCHA Admin**: https://www.google.com/recaptcha/admin

### Documentation

- [Bug Fix Log](./BUG_FIX_LOG.md)
- [reCAPTCHA Setup](./RECAPTCHA_SETUP.md)
- [PDF Worker Fix](./PDF_WORKER_FIX.md)
- [Gemini Streaming Fix](./GEMINI_STREAMING_FIX.md)
- [Testing Guide](./UNIT_TEST_SETUP.md)

---

**Last Updated**: October 5, 2025  
**Deployment Status**: ✅ Live  
**Platform**: Vercel  
**Version**: 0.1.0
