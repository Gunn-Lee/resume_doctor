import { FileText } from "lucide-react";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

/**
 * Main application shell with header and layout
 */
export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Header */}
      <header className="border-b fixed top-0 bg-background/75 z-10 w-full">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                Resume Doctor
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                v{import.meta.env.VITE_APP_VERSION || "0.1.0"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mt-16 mx-auto px-4 pb-4">{children}</main>

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
