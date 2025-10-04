/**
 * Prompt building stub
 * Will be implemented in future phase
 */

import type { JobContextFormData, ParsedResume } from "../types";
import type { PromptTemplate } from "./prompts";

/**
 * Build system and user prompts from template and data
 * @throws Error - Not yet implemented
 */
export function buildPrompt(
  template: PromptTemplate,
  formData: JobContextFormData,
  resume: ParsedResume
): { systemPrompt: string; userPrompt: string } {
  // Placeholder - will implement prompt hydration logic
  throw new Error(
    `Prompt building not yet implemented - future phase (${template.version}, ${formData.targetRole}, ${resume.wordCount})`
  );
}
