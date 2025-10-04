import { create } from "zustand";

interface SessionState {
  apiKey: string;
  rememberApiKey: boolean;

  // Actions
  setApiKey: (key: string) => void;
  setRememberApiKey: (remember: boolean) => void;
  clearApiKey: () => void;
  reset: () => void;
}

export const useSession = create<SessionState>((set) => ({
  apiKey: "",
  rememberApiKey: false,

  setApiKey: (apiKey) => set({ apiKey }),
  setRememberApiKey: (rememberApiKey) => set({ rememberApiKey }),
  clearApiKey: () => set({ apiKey: "" }),
  reset: () => set({ apiKey: "", rememberApiKey: false }),
}));

// Note: User authentication fields will be added when implementing Google login
