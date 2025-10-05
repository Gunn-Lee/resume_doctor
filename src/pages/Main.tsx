import { useEffect, useState, useCallback } from "react";
import ResumeDropzone from "../components/ResumeDropzone";
import PromptConfigForm from "../components/PromptConfigForm";
import SubmitBar from "../components/SubmitBar";
import ResultPane from "../components/ResultPane";
import { useAppState } from "../store/useAppState";
import { useSubmitAnalysis } from "../hooks/useSubmitAnalysis";
import { parseFile, parseTextInput } from "../lib/parsers";
import type { ParsedResume, JobContextFormData } from "../types";

/**
 * Main application page with two-column layout
 */
export default function Main() {
  const {
    parsedResume,
    analysisResult,
    isAnalyzing,
    cooldownSeconds,
    formData,
  } = useAppState();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");

  const { submitAnalysis, isSubmitting, submitError } = useSubmitAnalysis();

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setError("");

    try {
      const parseResult = await parseFile(file);

      const parsedResume: ParsedResume = {
        text: parseResult.text,
        wordCount: parseResult.wordCount,
        pageCount: parseResult.pageCount,
        parseWarnings: parseResult.parseWarnings,
        source: "file",
        fileName: file.name,
        fileSize: file.size,
      };

      useAppState.getState().setParsedResume(parsedResume);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to parse file";
      setError(errorMessage);
      console.error("File parsing error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextInput = (text: string) => {
    setError("");

    try {
      const parseResult = parseTextInput(text);

      const parsedResume: ParsedResume = {
        text: parseResult.text,
        wordCount: parseResult.wordCount,
        pageCount: parseResult.pageCount,
        parseWarnings: parseResult.parseWarnings,
        source: "text",
        fileName: "Pasted Text",
        fileSize: new Blob([text]).size,
      };

      useAppState.getState().setParsedResume(parsedResume);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to process text";
      setError(errorMessage);
      console.error("Text processing error:", err);
    }
  };

  const handleClearResume = () => {
    useAppState.getState().setParsedResume(null);
  };

  const handleFormSubmit = useCallback((data: Partial<JobContextFormData>) => {
    // This callback is now stable and won't cause re-renders
    // The form will update the store directly via useEffect
    console.log("Form submitted (callback triggered):", data);
  }, []);

  const handleSubmit = async (recaptchaToken: string) => {
    await submitAnalysis(recaptchaToken);
  };

  // Check if form is complete
  const isFormComplete = Boolean(
    formData.analysisDepth &&
      formData.domain &&
      formData.targetRole &&
      formData.targetCompany &&
      formData.experienceLevel
  );

  const isSubmitDisabled =
    !parsedResume || !isFormComplete || isAnalyzing || isSubmitting;

  // Debug logging
  useEffect(() => {
    console.log("Form validation state:", {
      parsedResume: !!parsedResume,
      formData,
      isFormComplete,
      isAnalyzing,
      isSubmitting,
      isSubmitDisabled,
    });
  }, [
    parsedResume,
    formData,
    isFormComplete,
    isAnalyzing,
    isSubmitting,
    isSubmitDisabled,
  ]);

  return (
    <div className="flex flex-col flex-1">
      <div className="grid grid-grid-cols-1 lg:grid-cols-2 gap-8 h-full lg:h-[100vh]">
        <div>
          <div>
            <h2 className="text-xl font-semibold mb-4">
              1. Configure Analysis
            </h2>
            <PromptConfigForm onSubmit={handleFormSubmit} />
          </div>
        </div>
        <div>
          <div>
            <h2 className="text-xl font-semibold mb-4">
              2. Upload Your Resume
            </h2>
            <ResumeDropzone
              onFileSelect={handleFileSelect}
              onTextInput={handleTextInput}
              parsedResume={parsedResume}
              onClear={handleClearResume}
            />

            {/* Processing indicator */}
            {isProcessing && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  Processing your resume...
                </p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-4">3. Submit</h2>
            <SubmitBar
              onSubmit={handleSubmit}
              cooldownSeconds={cooldownSeconds}
              isDisabled={isSubmitDisabled}
              isAnalyzing={isAnalyzing}
            />

            {/* Submit error message */}
            {submitError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col w-full h-[82vh] mt-8">
        <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
        <ResultPane result={analysisResult} isStreaming={isAnalyzing} />
      </div>
    </div>
  );
}
