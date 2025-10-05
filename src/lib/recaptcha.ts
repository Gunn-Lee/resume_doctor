// reCAPTCHA v3 integration for Resume Doctor
// Based on Implementation Plan - Core Functions.md

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

declare global {
  interface Window {
    grecaptcha: {
      ready(callback: () => void): void;
      execute(siteKey: string, options: { action: string }): Promise<string>;
    };
  }
}

/**
 * Inject reCAPTCHA script dynamically with site key from env
 */
function injectRecaptchaScript(): void {
  if (!SITE_KEY) {
    console.error("reCAPTCHA site key not configured in environment");
    return;
  }

  // Check if script already exists
  const existingScript = document.querySelector(
    'script[src*="recaptcha/api.js"]'
  );
  if (existingScript) {
    return; // Script already injected
  }

  // Create and inject script element
  const script = document.createElement("script");
  script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

/**
 * Initialize reCAPTCHA by waiting for the script to load
 * @returns Promise that resolves when reCAPTCHA is ready
 */
export function initRecaptcha(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!SITE_KEY) {
      reject(new Error("reCAPTCHA site key not configured"));
      return;
    }

    // Inject the script if not already present
    injectRecaptchaScript();

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

/**
 * Get a reCAPTCHA token for the specified action
 * @param action - The action name (e.g., 'submit', 'login')
 * @returns Promise with the reCAPTCHA token
 */
export async function getRecaptchaToken(
  action: string = "submit"
): Promise<string> {
  if (!SITE_KEY) {
    throw new Error("reCAPTCHA not configured");
  }

  // Ensure reCAPTCHA is initialized before using it
  await initRecaptcha();

  return new Promise((resolve, reject) => {
    window.grecaptcha.ready(async () => {
      try {
        const token = await window.grecaptcha.execute(SITE_KEY, { action });
        resolve(token);
      } catch (error) {
        console.error("reCAPTCHA error:", error);
        reject(new Error("reCAPTCHA verification failed"));
      }
    });
  });
}

/**
 * Client-side token validation (basic check only)
 * Note: In production with a backend, you'd verify server-side
 * @param token - The reCAPTCHA token to verify
 * @returns Promise with verification result
 */
export async function verifyRecaptchaToken(token: string): Promise<boolean> {
  try {
    // Verify token format and expiration
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);

    // Check if token is not expired (tokens are valid for 2 minutes)
    return payload.exp > now;
  } catch {
    return false;
  }
}
