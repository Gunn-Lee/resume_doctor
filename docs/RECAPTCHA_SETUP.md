# reCAPTCHA Setup Guide

## Quick Start

### 1. Get Your reCAPTCHA Site Key

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click **"+"** to create a new site
3. Fill in the form:
   - **Label**: Resume Doctor (or any name you prefer)
   - **reCAPTCHA type**: Select **"reCAPTCHA v3"**
   - **Domains**: Add the following domains:
     ```
     localhost
     127.0.0.1
     ```
     (Add your production domain later when deploying)
4. Accept the reCAPTCHA Terms of Service
5. Click **"Submit"**

### 2. Copy Your Keys

After submitting, you'll see two keys:

- **Site Key** (public) - This goes in your `.env` file
- **Secret Key** (private) - Not needed for this client-only app

### 3. Configure Your Application

1. Create a `.env` file in the project root (if it doesn't exist):

   ```bash
   cp .env.example .env
   ```

2. Add your site key to `.env`:

   ```bash
   VITE_RECAPTCHA_SITE_KEY=your_actual_site_key_here
   ```

3. Restart your dev server:
   ```bash
   npm run dev
   ```

## Important Notes

### ✅ Localhost Support

- **Yes, localhost works perfectly with reCAPTCHA v3!**
- No special configuration needed
- The same site key works for both localhost and production
- Both `localhost` and `127.0.0.1` are supported

### 🔒 Security

- The site key is **public** and safe to commit (it's meant to be visible in your frontend code)
- The secret key should **never** be committed or exposed
- In this client-only application, we only use the site key
- Server-side verification would require the secret key (not implemented in this app)

### 🚀 Production Deployment

When you deploy to production:

1. Go back to [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click on your site
3. Add your production domain (e.g., `resumedoctor.com`)
4. Save - the same site key will work for all configured domains

### 🧪 Testing

reCAPTCHA v3 is invisible and runs automatically:

- No user interaction required
- Scores requests from 0.0 (likely bot) to 1.0 (likely human)
- Works seamlessly on localhost for development

### 📝 Best Practices

- Keep `localhost` in your domains list for easy development
- Test thoroughly in development before deploying
- Monitor your reCAPTCHA dashboard for analytics
- Consider score thresholds if implementing server-side validation

## Troubleshooting

### "reCAPTCHA failed to load"

- Check that the script tag is in `index.html`
- Verify your site key is correct in `.env`
- Ensure dev server was restarted after adding `.env`
- Check browser console for errors

### "reCAPTCHA verification failed"

- Verify the site key is active in reCAPTCHA admin
- Check that localhost is in your domains list
- Clear browser cache and reload
- Check that you selected "reCAPTCHA v3" (not v2)

### Environment variable not loading

- Ensure `.env` file is in project root
- Variable must start with `VITE_` prefix
- Restart dev server after changing `.env`
- Vite only loads `.env` at startup

## Additional Resources

- [reCAPTCHA v3 Documentation](https://developers.google.com/recaptcha/docs/v3)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
