// Gemini API service for Resume Doctor
// Based on Implementation Plan - Core Functions.md

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface StreamChunk {
  text: string;
  isComplete: boolean;
}

export class GeminiService {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Stream analysis results from Gemini API
   * @param systemPrompt - The system instruction for the model
   * @param userPrompt - The user's prompt with resume and context
   * @yields StreamChunk objects with text and completion status
   */
  async *streamAnalysis(
    systemPrompt: string,
    userPrompt: string
  ): AsyncGenerator<StreamChunk> {
    try {
      // Create model with system instruction
      const model = this.client.getGenerativeModel({
        model: "gemini-2.5-pro",
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 6144, // Increased from 4096 for longer responses
          responseMimeType: "text/plain",
        },
      });

      console.log("🚀 Starting Gemini stream...");

      // Send message and stream response
      const result = await model.generateContentStream(userPrompt);

      let totalChunks = 0;
      let totalText = "";

      for await (const chunk of result.stream) {
        totalChunks++;
        const text = chunk.text();
        totalText += text;

        console.log(`📦 Chunk ${totalChunks}: ${text.length} chars`);

        if (text) {
          yield { text, isComplete: false };
        }
      }

      // Check finish reason and usage
      const response = await result.response;
      const finishReason = response.candidates?.[0]?.finishReason;
      const usageMetadata = response.usageMetadata;

      console.log("✅ Stream complete:", {
        totalChunks,
        totalChars: totalText.length,
        totalWords: totalText.split(/\s+/).length,
        finishReason,
        promptTokens: usageMetadata?.promptTokenCount,
        responseTokens: usageMetadata?.candidatesTokenCount,
        totalTokens: usageMetadata?.totalTokenCount,
      });

      // Warn if response was cut off
      if (finishReason === "MAX_TOKENS") {
        console.warn(
          "⚠️ Response hit MAX_TOKENS limit - response may be incomplete"
        );
        yield {
          text: "\n\n*[Note: Response may be incomplete due to length limits. Consider requesting a more compact analysis.]*",
          isComplete: false,
        };
      }

      if (finishReason === "SAFETY") {
        console.warn("⚠️ Response blocked by safety filters");
        throw new Error(
          "Response blocked by content safety filters. Please try rephrasing your resume or job context."
        );
      }

      if (finishReason === "RECITATION") {
        console.warn("⚠️ Response blocked due to recitation");
        throw new Error(
          "Response blocked due to content recitation. Please try with different content."
        );
      }

      yield { text: "", isComplete: true };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("API_KEY_INVALID")) {
          throw new Error("Invalid API key. Please check your Gemini API key.");
        }
        if (error.message.includes("QUOTA_EXCEEDED")) {
          throw new Error(
            "API quota exceeded. Please try again later or check your billing."
          );
        }
        if (error.message.includes("RATE_LIMIT_EXCEEDED")) {
          throw new Error(
            "Rate limit exceeded. Please wait a moment and try again."
          );
        }
      }
      throw new Error(
        `Analysis failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
