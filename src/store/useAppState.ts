import { create } from "zustand";
import type {
  ParsedResume,
  JobContextFormData,
  AnalysisResult,
} from "../types";

interface AppState {
  parsedResume: ParsedResume | null;
  formData: Partial<JobContextFormData>;
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
  cooldownSeconds: number;

  // Actions
  setParsedResume: (resume: ParsedResume | null) => void;
  setFormData: (data: Partial<JobContextFormData>) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setCooldownSeconds: (seconds: number) => void;
  resetState: () => void;
}

export const useAppState = create<AppState>((set) => ({
  parsedResume: null,
  formData: {},
  analysisResult: null,
  isAnalyzing: false,
  cooldownSeconds: 0,

  setParsedResume: (parsedResume) => set({ parsedResume }),
  setFormData: (formData) =>
    set((state) => ({ formData: { ...state.formData, ...formData } })),
  setAnalysisResult: (analysisResult) => set({ analysisResult }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setCooldownSeconds: (cooldownSeconds) => set({ cooldownSeconds }),
  resetState: () =>
    set({
      parsedResume: null,
      formData: {},
      analysisResult: null,
      isAnalyzing: false,
      cooldownSeconds: 0,
    }),
}));
