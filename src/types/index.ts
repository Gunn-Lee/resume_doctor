// Analysis configuration types
export type AnalysisDepth = "compact" | "full";
export type Domain = "universal" | "technical" | "nonTechnical";
export type ExperienceLevel = "Entry" | "Mid" | "Senior";

// Resume data types
export interface ParsedResume {
  text: string;
  wordCount: number;
  parseWarnings: string[];
  sourceType: "text" | "pdf" | "docx" | "markdown";
}

// Job context form data
export interface JobContextFormData {
  analysisDepth: AnalysisDepth;
  domain: Domain;
  targetRole: string;
  targetCompany: string;
  experienceLevel: ExperienceLevel;
  geographicFocus?: string;
  specialFocus?: string;
  memo?: string;
}

// Analysis result types
export interface AnalysisResult {
  content: string;
  timestamp: Date;
  isStreaming: boolean;
}

// Note: User/authentication types will be added when implementing Google login in a future phase
