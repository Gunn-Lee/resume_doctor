import { useState } from "react";
import { Eye, EyeOff, Key, Trash2 } from "lucide-react";
import { useSession } from "../store/useSession";
import { cn } from "../lib/utils";

interface SubmitBarProps {
  onSubmit: () => void;
  cooldownSeconds: number;
  isDisabled: boolean;
}

/**
 * API key input and submit button with cooldown
 */
export default function SubmitBar({
  onSubmit,
  cooldownSeconds,
  isDisabled,
}: SubmitBarProps) {
  const { apiKey, rememberApiKey, setApiKey, setRememberApiKey, clearApiKey } =
    useSession();
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = () => {
    if (cooldownSeconds > 0 || isDisabled) return;
    onSubmit();
  };

  const handleClearKey = () => {
    clearApiKey();
    setRememberApiKey(false);
  };

  const buttonDisabled = isDisabled || cooldownSeconds > 0 || !apiKey;

  return (
    <div className="space-y-4 border rounded-lg p-6 bg-card">
      {/* API Key Input */}
      <div>
        <label htmlFor="apiKey" className="block text-sm font-medium mb-2">
          Gemini API Key <span className="text-destructive">*</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Key className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              id="apiKey"
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your Gemini API key here"
              className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              title={showKey ? "Hide key" : "Show key"}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {apiKey && (
            <button
              type="button"
              onClick={handleClearKey}
              className="px-3 py-2 border rounded-lg hover:bg-destructive/10 hover:border-destructive transition-colors"
              title="Clear API key"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Your API key is stored locally and never sent to our servers.{" "}
          <a
            href="https://ai.google.dev/gemini-api/docs/api-key"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Get your key
          </a>
        </p>
      </div>

      {/* Remember Key Checkbox */}
      <div className="flex items-center gap-2">
        <input
          id="rememberKey"
          type="checkbox"
          checked={rememberApiKey}
          onChange={(e) => setRememberApiKey(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label
          htmlFor="rememberKey"
          className="text-sm text-muted-foreground cursor-pointer"
        >
          Remember my API key (stored in browser localStorage)
        </label>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={buttonDisabled}
        className={cn(
          "w-full py-3 rounded-lg font-medium transition-colors",
          buttonDisabled
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {cooldownSeconds > 0
          ? `Please wait (${cooldownSeconds}s)`
          : isDisabled
          ? "Please complete all required fields"
          : "Analyze Resume"}
      </button>

      {cooldownSeconds > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Cooldown prevents accidental resubmissions
        </p>
      )}
    </div>
  );
}
