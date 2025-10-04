/**
 * Gemini API integration stub
 * Will be implemented in future phase
 */

export interface GeminiClientConfig {
  apiKey: string;
}

/**
 * Stream resume analysis from Gemini API
 * @throws Error - Not yet implemented
 */
export async function* streamResumeAnalysis(config: {
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
}): AsyncGenerator<string, void, unknown> {
  // Placeholder - will implement with @google/generative-ai SDK
  throw new Error("Gemini integration not yet implemented - future phase");

  // Suppress unused variable warning
  void config;

  // Make TypeScript happy with generator return type
  yield "";
}
