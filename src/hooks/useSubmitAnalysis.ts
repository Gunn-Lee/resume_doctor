import { useState } from "react";
import { useAppState } from "../store/useAppState";
import { useSession } from "../store/useSession";
import { GeminiService } from "../lib/gemini";
import { buildPrompt } from "../lib/prompts";

/**
 * Custom hook for handling resume analysis submission
 * Orchestrates: validation → prompt building → Gemini streaming → cooldown
 */
export function useSubmitAnalysis() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");

  const {
    parsedResume,
    formData,
    setAnalysisResult,
    setIsAnalyzing,
    setCooldownSeconds,
  } = useAppState();

  const { apiKey } = useSession();

  const submitAnalysis = async (recaptchaToken: string) => {
    // Reset error state
    setSubmitError("");
    setIsSubmitting(true);

    try {
      // Step 1: Validate all required data
      if (!parsedResume) {
        throw new Error("Please upload or paste your resume first");
      }

      if (!formData.analysisDepth || !formData.domain) {
        throw new Error("Please complete the analysis configuration");
      }

      if (!formData.targetRole || !formData.targetCompany) {
        throw new Error("Please enter target role and company");
      }

      if (!formData.experienceLevel) {
        throw new Error("Please select your experience level");
      }

      if (!apiKey) {
        throw new Error("Please enter your Gemini API key");
      }

      if (!recaptchaToken) {
        throw new Error("reCAPTCHA verification failed");
      }

      // Step 2: Build prompt from template
      const prompt = buildPrompt(formData.analysisDepth, formData.domain, {
        resumeText: parsedResume.text,
        targetRole: formData.targetRole,
        targetCompany: formData.targetCompany,
        experienceLevel: formData.experienceLevel,
        geographicFocus: formData.geographicFocus,
        specialFocus: formData.specialFocus,
        memo: formData.memo,
      });

      // Step 3: Initialize Gemini service
      const geminiService = new GeminiService(apiKey);

      // Step 4: Start streaming
      setIsAnalyzing(true);
      setAnalysisResult({
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      });

      let fullContent = "";

      // Step 5: Stream results
      for await (const chunk of geminiService.streamAnalysis(
        prompt.system,
        prompt.user
      )) {
        if (!chunk.isComplete) {
          fullContent += chunk.text;
          setAnalysisResult({
            content: fullContent,
            timestamp: new Date(),
            isStreaming: true,
          });
        } else {
          // Streaming complete
          setAnalysisResult({
            content: fullContent,
            timestamp: new Date(),
            isStreaming: false,
          });
        }
      }

      // Step 6: Start cooldown (60 seconds)
      setCooldownSeconds(60);
      const cooldownInterval = setInterval(() => {
        const currentState = useAppState.getState();
        const currentCooldown = currentState.cooldownSeconds;

        if (currentCooldown <= 1) {
          clearInterval(cooldownInterval);
          setCooldownSeconds(0);
        } else {
          setCooldownSeconds(currentCooldown - 1);
        }
      }, 1000);

      setIsAnalyzing(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Analysis failed";
      setSubmitError(errorMessage);
      setIsAnalyzing(false);
      setAnalysisResult(null);
      console.error("Analysis submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitAnalysis,
    isSubmitting,
    submitError,
  };
}
