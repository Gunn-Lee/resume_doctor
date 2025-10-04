/**
 * Prompt templates stub
 * Will be implemented in future phase
 */

import type { AnalysisDepth, Domain } from "../types";

export interface PromptTemplate {
  version: string;
  systemInstruction: string;
  userPromptTemplate: string;
}

/**
 * Get prompt template based on analysis depth and domain
 * @throws Error - Not yet implemented
 */
export function getPromptTemplate(
  depth: AnalysisDepth,
  domain: Domain
): PromptTemplate {
  // Placeholder - will load from JSON templates
  throw new Error(
    `Prompt template loading not yet implemented - future phase (${depth}, ${domain})`
  );
}

/**
 * List of all available prompt templates
 */
export const AVAILABLE_TEMPLATES = {
  compact: {
    universal: "Universal (Compact)",
    technical: "Technical (Compact)",
    nonTechnical: "Non-Technical (Compact)",
  },
  full: {
    universal: "Universal (Full Analysis)",
    technical: "Technical (Full Analysis)",
    nonTechnical: "Non-Technical (Full Analysis)",
  },
} as const;
