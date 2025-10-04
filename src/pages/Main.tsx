import ResumeDropzone from "../components/ResumeDropzone";
import ParsedPreview from "../components/ParsedPreview";
import PromptConfigForm from "../components/PromptConfigForm";
import SubmitBar from "../components/SubmitBar";
import ResultPane from "../components/ResultPane";
import { useAppState } from "../store/useAppState";

/**
 * Main application page with two-column layout
 */
export default function Main() {
  const { parsedResume, analysisResult, isAnalyzing, cooldownSeconds } =
    useAppState();

  const handleFileSelect = (file: File) => {
    console.log("File selected:", file.name);
    // TODO: Parse file in worker (future implementation)
  };

  const handleTextInput = (text: string) => {
    console.log("Text input received:", text.length, "characters");
    // TODO: Process text (future implementation)
  };

  const handleClearResume = () => {
    useAppState.getState().setParsedResume(null);
  };

  const handleFormSubmit = () => {
    console.log("Form submitted");
    // TODO: Call Gemini API (future implementation)
  };

  const handleSubmit = () => {
    console.log("Submit clicked");
    // TODO: Start analysis (future implementation)
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="grid grid-cols-2 gap-8 h-[100vh]">
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
            />
          </div>

          {parsedResume && (
            <div>
              <h2 className="text-xl font-semibold mb-4">3. Resume Preview</h2>
              <ParsedPreview
                parsedResume={parsedResume}
                onClear={handleClearResume}
              />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {parsedResume ? "4" : "3"}. Submit
            </h2>
            <SubmitBar
              onSubmit={handleSubmit}
              cooldownSeconds={cooldownSeconds}
              isDisabled={!parsedResume || isAnalyzing}
            />
          </div>
        </div>
      </div>

      <div className="w-full h-[88vh]">
        <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
        <ResultPane result={analysisResult} isStreaming={isAnalyzing} />
      </div>
    </div>
  );
}
