# Implementation Plan - Authentication & Login

**Project:** Resume Doctor  
**Purpose:** Add Google Identity Services authentication  
**Phase:** Authentication Layer (Phase D)  
**Date:** October 4, 2025

---

## Overview

This document outlines the implementation plan for adding **Google Identity Services (GIS)** authentication to Resume Doctor. This is an optional feature that provides user profile management and can be used for future enhancements like saving analysis history or sharing results.

### Important Note

Authentication is **optional** for Resume Doctor since all processing happens client-side. However, it provides:

- User profile display (name, email, avatar)
- Foundation for future features (save history, preferences)
- Professional user experience
- Trust and credibility

---

## What's Included in This Phase

- ✅ Google Identity Services integration
- ✅ Login page with Google Sign-In button
- ✅ User session management
- ✅ Protected routes
- ✅ Logout functionality
- ✅ User profile display
- ✅ Token verification (client-side only)

### What's NOT Included (Optional Future Enhancement)

- ❌ Backend server for token verification
- ❌ User data persistence on server
- ❌ Advanced session management
- ❌ OAuth flow for other providers

---

## Phase 1: Setup & Configuration

### 1.1 Google Cloud Console Setup

**Prerequisites:**

- Google Cloud account
- Project created in Google Cloud Console

**Steps:**

1. **Create OAuth 2.0 Client ID**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Name: "Resume Doctor"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - Your production domain (e.g., `https://resumedoctor.app`)
   - Authorized redirect URIs: (not needed for GIS)
   - Click "Create"
   - Copy the **Client ID**

2. **Enable Required APIs**

   - No additional APIs needed for basic GIS
   - People API (optional, for extended profile info)

3. **Configure OAuth Consent Screen**
   - User type: External
   - App name: "Resume Doctor"
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: `email`, `profile`, `openid` (default)
   - Test users: Add your email for testing

### 1.2 Environment Configuration

Update `.env.example`:

```bash
# Google Identity Services
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com

# Application Configuration
VITE_APP_NAME=Resume Doctor
VITE_APP_VERSION=0.2.0
VITE_ENABLE_ANALYTICS=false

# Authentication
VITE_ENABLE_AUTH=true
```

Create `.env.local`:

```bash
VITE_GOOGLE_CLIENT_ID=actual_client_id.apps.googleusercontent.com
VITE_ENABLE_AUTH=true
```

---

## Phase 2: Type Definitions

### 2.1 Add User Types (`src/types/index.ts`)

```typescript
// Add to existing types/index.ts

/**
 * User authentication types
 */
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  givenName?: string;
  familyName?: string;
}

/**
 * Google credential response
 */
export interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
  clientId?: string;
}

/**
 * Decoded JWT token payload
 */
export interface GoogleTokenPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  iat: number;
  exp: number;
}
```

### 2.2 Add Google GIS Types (`src/types/google-gsi.d.ts`)

```typescript
/**
 * Google Identity Services type definitions
 */

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: GoogleIdConfiguration) => void;
        prompt: () => void;
        renderButton: (
          parent: HTMLElement,
          options: GsiButtonConfiguration
        ) => void;
        disableAutoSelect: () => void;
        storeCredential: (credential: { id: string; password: string }) => void;
        cancel: () => void;
        revoke: (
          hint: string,
          callback: (done: RevocationResponse) => void
        ) => void;
      };
    };
  };
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: "signin" | "signup" | "use";
  ux_mode?: "popup" | "redirect";
  login_uri?: string;
  native_callback?: (response: GoogleCredentialResponse) => void;
  itp_support?: boolean;
}

interface GsiButtonConfiguration {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: string | number;
  locale?: string;
}

interface GoogleCredentialResponse {
  credential: string;
  select_by?:
    | "auto"
    | "user"
    | "user_1tap"
    | "user_2tap"
    | "btn"
    | "btn_confirm";
  clientId?: string;
}

interface RevocationResponse {
  successful: boolean;
  error?: string;
}
```

---

## Phase 3: Authentication Service

### 3.1 Create Google Auth Service (`src/lib/googleAuth.ts`)

```typescript
import type {
  User,
  GoogleCredentialResponse,
  GoogleTokenPayload,
} from "../types";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Initialize Google Identity Services
 */
export function initGoogleAuth(
  onSuccess: (user: User) => void,
  onError: (error: Error) => void
): void {
  if (!GOOGLE_CLIENT_ID) {
    onError(new Error("Google Client ID not configured"));
    return;
  }

  // Load Google Identity Services script
  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;

  script.onload = () => {
    if (!window.google) {
      onError(new Error("Failed to load Google Identity Services"));
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: GoogleCredentialResponse) => {
        handleCredentialResponse(response, onSuccess, onError);
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });
  };

  script.onerror = () => {
    onError(new Error("Failed to load Google Identity Services script"));
  };

  document.head.appendChild(script);
}

/**
 * Handle credential response from Google
 */
function handleCredentialResponse(
  response: GoogleCredentialResponse,
  onSuccess: (user: User) => void,
  onError: (error: Error) => void
): void {
  try {
    const payload = decodeJWT(response.credential);

    if (!payload || !payload.email_verified) {
      onError(new Error("Email not verified"));
      return;
    }

    const user: User = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      givenName: payload.given_name,
      familyName: payload.family_name,
    };

    onSuccess(user);
  } catch (error) {
    onError(
      error instanceof Error ? error : new Error("Failed to process credential")
    );
  }
}

/**
 * Decode JWT token (client-side only, no verification)
 * WARNING: This is NOT secure for authorization decisions
 * Use only for display purposes
 */
function decodeJWT(token: string): GoogleTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as GoogleTokenPayload;
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

/**
 * Render Google Sign-In button
 */
export function renderGoogleButton(
  element: HTMLElement,
  onSuccess: (user: User) => void,
  onError: (error: Error) => void
): void {
  if (!window.google) {
    onError(new Error("Google Identity Services not loaded"));
    return;
  }

  window.google.accounts.id.renderButton(element, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "signin_with",
    shape: "rectangular",
    logo_alignment: "left",
    width: 300,
  });
}

/**
 * Prompt Google One Tap
 */
export function promptGoogleOneTap(): void {
  if (!window.google) return;
  window.google.accounts.id.prompt();
}

/**
 * Sign out (client-side)
 */
export function signOut(): void {
  if (!window.google) return;
  window.google.accounts.id.disableAutoSelect();
}

/**
 * Revoke access
 */
export function revokeAccess(
  email: string,
  callback: (success: boolean) => void
): void {
  if (!window.google) {
    callback(false);
    return;
  }

  window.google.accounts.id.revoke(email, (response) => {
    callback(response.successful);
  });
}
```

---

## Phase 4: Update State Management

### 4.1 Update Session Store (`src/store/useSession.ts`)

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types";

interface SessionState {
  // User
  user: User | null;
  isAuthenticated: boolean;

  // API Key
  apiKey: string;
  rememberApiKey: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setApiKey: (key: string) => void;
  setRememberApiKey: (remember: boolean) => void;
  clearApiKey: () => void;
  logout: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      apiKey: "",
      rememberApiKey: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setApiKey: (apiKey) => set({ apiKey }),
      setRememberApiKey: (rememberApiKey) => set({ rememberApiKey }),
      clearApiKey: () => set({ apiKey: "" }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          apiKey: "",
          rememberApiKey: false,
        }),
    }),
    {
      name: "resume-doctor-session",
      partialize: (state) => ({
        // Only persist API key if remember is enabled
        apiKey: state.rememberApiKey ? state.apiKey : "",
        rememberApiKey: state.rememberApiKey,
        // Never persist user info (for security)
      }),
    }
  )
);
```

---

## Phase 5: Create Login Page

### 5.1 Login Page Component (`src/pages/Login.tsx`)

```typescript
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ShieldCheck, Zap, Lock } from "lucide-react";
import { useSession } from "../store/useSession";
import { initGoogleAuth, renderGoogleButton } from "../lib/googleAuth";
import type { User } from "../types";

/**
 * Login page with Google Sign-In
 */
export default function Login() {
  const navigate = useNavigate();
  const { setUser, isAuthenticated } = useSession();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/app");
    }
  }, [isAuthenticated, navigate]);

  // Initialize Google Auth
  useEffect(() => {
    const handleSuccess = (user: User) => {
      setUser(user);
      navigate("/app");
    };

    const handleError = (err: Error) => {
      setError(err.message);
      setIsLoading(false);
    };

    initGoogleAuth(handleSuccess, handleError);

    // Render button when script loads
    const checkAndRender = setInterval(() => {
      if (window.google && buttonRef.current) {
        renderGoogleButton(buttonRef.current, handleSuccess, handleError);
        setIsLoading(false);
        clearInterval(checkAndRender);
      }
    }, 100);

    return () => clearInterval(checkAndRender);
  }, [setUser, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="h-12 w-12 text-primary" />
              <h1 className="text-5xl font-bold text-foreground">
                Resume Doctor
              </h1>
            </div>
            <p className="text-xl text-muted-foreground">
              AI-powered resume analysis for your next career move
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Features */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    100% Client-Side
                  </h3>
                  <p className="text-muted-foreground">
                    Your resume never leaves your browser. All processing
                    happens locally.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Powered by Gemini AI
                  </h3>
                  <p className="text-muted-foreground">
                    Get intelligent feedback tailored to your target role and
                    industry.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Privacy First</h3>
                  <p className="text-muted-foreground">
                    Your API key is stored locally. No data is sent to our
                    servers.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Login Card */}
            <div className="bg-card border rounded-xl shadow-xl p-8">
              <h2 className="text-2xl font-bold mb-6 text-center">
                Get Started
              </h2>

              <div className="space-y-6">
                {/* Google Sign-In Button */}
                <div className="flex flex-col items-center">
                  {isLoading ? (
                    <div className="h-11 w-[300px] bg-muted animate-pulse rounded-lg" />
                  ) : (
                    <div ref={buttonRef} />
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                    <p className="text-sm text-destructive text-center">
                      {error}
                    </p>
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or continue without signing in
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/app")}
                  className="w-full py-3 px-4 border rounded-lg hover:bg-muted transition-colors"
                >
                  Continue as Guest
                </button>

                <p className="text-xs text-center text-muted-foreground">
                  By continuing, you agree to our{" "}
                  <a href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </a>{" "}
                  and{" "}
                  <a href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 6: Update Router & Navigation

### 6.1 Create Protected Route Component (`src/components/ProtectedRoute.tsx`)

```typescript
import { Navigate } from "react-router-dom";
import { useSession } from "../store/useSession";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

/**
 * Protected route wrapper
 * If requireAuth is true, redirects to login if not authenticated
 */
export default function ProtectedRoute({
  children,
  requireAuth = false,
}: ProtectedRouteProps) {
  const { isAuthenticated } = useSession();

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

### 6.2 Update Router (`src/app/Router.tsx`)

```typescript
import { Routes, Route, Navigate } from "react-router-dom";
import { useSession } from "../store/useSession";
import AppShell from "./AppShell";
import Login from "../pages/Login";
import Main from "../pages/Main";
import ProtectedRoute from "../components/ProtectedRoute";

/**
 * Application router with authentication
 */
export default function Router() {
  const { isAuthenticated } = useSession();
  const authEnabled = import.meta.env.VITE_ENABLE_AUTH === "true";

  // If auth is disabled, always show main app
  if (!authEnabled) {
    return (
      <AppShell>
        <Routes>
          <Route path="/*" element={<Main />} />
        </Routes>
      </AppShell>
    );
  }

  // With auth enabled
  return (
    <Routes>
      {/* Login page (redirect to app if already authenticated) */}
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/app" replace /> : <Login />}
      />

      {/* Main app (accessible to all, but can be protected) */}
      <Route
        path="/app"
        element={
          <AppShell>
            <Main />
          </AppShell>
        }
      />

      {/* Catch all - redirect to appropriate page */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/app" : "/"} replace />}
      />
    </Routes>
  );
}
```

---

## Phase 7: Update App Shell with User Profile

### 7.1 Create User Menu Component (`src/components/UserMenu.tsx`)

```typescript
import { useState, useRef, useEffect } from "react";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../store/useSession";
import { signOut } from "../lib/googleAuth";
import { cn } from "../lib/utils";

/**
 * User profile dropdown menu
 */
export default function UserMenu() {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    signOut();
    logout();
    setIsOpen(false);
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <UserIcon className="h-4 w-4 text-primary" />
          </div>
        )}
        <span className="text-sm font-medium hidden md:inline">
          {user.name}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-card border rounded-lg shadow-lg py-2 z-50">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors text-left"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
```

### 7.2 Update AppShell (`src/app/AppShell.tsx`)

```typescript
import { FileText } from "lucide-react";
import type { ReactNode } from "react";
import { useSession } from "../store/useSession";
import UserMenu from "../components/UserMenu";

interface AppShellProps {
  children: ReactNode;
}

/**
 * Main application shell with header and layout
 */
export default function AppShell({ children }: AppShellProps) {
  const { isAuthenticated } = useSession();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                Resume Doctor
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {isAuthenticated && <UserMenu />}

              <span className="text-sm text-muted-foreground">
                v{import.meta.env.VITE_APP_VERSION || "0.2.0"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">{children}</main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-muted-foreground">
            Client-only resume analysis powered by Gemini AI
          </p>
        </div>
      </footer>
    </div>
  );
}
```

---

## Phase 8: Testing & Validation

### 8.1 Test Cases

**Login Flow:**

- [ ] Google Sign-In button renders correctly
- [ ] Successful login redirects to /app
- [ ] User profile displays in header
- [ ] Login persists across page refreshes
- [ ] "Continue as Guest" works without login

**Protected Routes:**

- [ ] Unauthenticated users can still access /app (guest mode)
- [ ] Authenticated users see profile menu
- [ ] Navigation works correctly

**Logout Flow:**

- [ ] Logout clears user session
- [ ] Logout redirects to home page
- [ ] Google One Tap doesn't auto-trigger after logout

**Error Handling:**

- [ ] Missing CLIENT_ID shows error
- [ ] Failed script load shows error
- [ ] Network errors handled gracefully

---

## Phase 9: Security Considerations

### 9.1 Client-Side Security

⚠️ **Important Security Notes:**

1. **No Server-Side Verification**

   - JWT tokens are decoded client-side only
   - Do NOT use for authorization decisions
   - Treat as display data only

2. **API Key Storage**

   - API keys stored in localStorage (optional)
   - Never log API keys
   - Clear on logout if not remembered

3. **Session Management**
   - User data NOT persisted in localStorage
   - Session expires when browser closes
   - No refresh tokens needed

### 9.2 Future Security Enhancements (Optional)

If you add a backend later:

- Verify JWT tokens server-side
- Store refresh tokens securely
- Implement proper session management
- Add CSRF protection
- Use httpOnly cookies

---

## Phase 10: Deployment

### 10.1 Environment Variables

**Production `.env.production`:**

```bash
VITE_GOOGLE_CLIENT_ID=your_production_client_id.apps.googleusercontent.com
VITE_APP_NAME=Resume Doctor
VITE_APP_VERSION=0.2.0
VITE_ENABLE_AUTH=true
```

### 10.2 Update Google Cloud Console

Add production domains to:

- Authorized JavaScript origins
- OAuth consent screen
- Test users (remove after publishing)

### 10.3 CSP Headers (if applicable)

Add to your hosting configuration:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://accounts.google.com;
  frame-src https://accounts.google.com;
  connect-src 'self' https://accounts.google.com https://generativelanguage.googleapis.com;
```

---

## Implementation Checklist

### Setup

- [ ] Create Google Cloud project
- [ ] Configure OAuth consent screen
- [ ] Create OAuth 2.0 Client ID
- [ ] Add environment variables
- [ ] Update `.env.example`

### Code

- [ ] Add User types to `src/types/index.ts`
- [ ] Create `src/types/google-gsi.d.ts`
- [ ] Create `src/lib/googleAuth.ts`
- [ ] Update `src/store/useSession.ts` with user management
- [ ] Create `src/pages/Login.tsx`
- [ ] Create `src/components/ProtectedRoute.tsx`
- [ ] Create `src/components/UserMenu.tsx`
- [ ] Update `src/app/Router.tsx`
- [ ] Update `src/app/AppShell.tsx`

### Testing

- [ ] Test login flow
- [ ] Test logout flow
- [ ] Test guest mode
- [ ] Test navigation
- [ ] Test on mobile
- [ ] Test with different Google accounts

### Documentation

- [ ] Update README with auth setup
- [ ] Document environment variables
- [ ] Add privacy policy
- [ ] Add terms of service

---

## Estimated Timeline

- **Setup (Google Cloud):** 30 minutes
- **Type Definitions:** 30 minutes
- **Auth Service:** 1-2 hours
- **State Management Updates:** 30 minutes
- **Login Page:** 1-2 hours
- **Protected Routes:** 1 hour
- **User Menu:** 1 hour
- **AppShell Updates:** 30 minutes
- **Testing:** 2 hours
- **Documentation:** 1 hour

**Total:** ~8-10 hours

---

## Optional Enhancements

### Future Features (Post-MVP)

1. **Save Analysis History**

   - Store past analyses in localStorage
   - Export/import functionality
   - Search and filter history

2. **User Preferences**

   - Default analysis settings
   - Preferred prompt templates
   - Dark mode preference

3. **Social Features**

   - Share analysis links
   - Collaborate on resume reviews
   - Community templates

4. **Backend Integration**
   - Server-side token verification
   - Database for user data
   - Advanced features

---

## Notes

- Authentication is **optional** - the app works without it
- All processing still happens client-side
- User profile is for display and future features only
- No backend required for this phase
- Can be disabled with `VITE_ENABLE_AUTH=false`

---

_This document will be updated as implementation progresses._
