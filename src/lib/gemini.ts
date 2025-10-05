// Gemini API service for Resume Doctor
// Based on Implementation Plan - Core Functions.md

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface StreamChunk {
  text: string;
  isComplete: boolean;
}

export class GeminiService {
  private client: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        maxOutputTokens: 4096,
      },
    });
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
      const chat = this.model.startChat({
        systemInstruction: systemPrompt,
      });

      const result = await chat.sendMessageStream(userPrompt);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield { text, isComplete: false };
        }
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
