import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SubmitBar from "../SubmitBar";
import { useSession } from "../../store/useSession";
import * as recaptcha from "../../lib/recaptcha";

// Mock the recaptcha module
vi.mock("../../lib/recaptcha", () => ({
  getRecaptchaToken: vi.fn(),
}));

describe("SubmitBar", () => {
  const mockOnSubmit = vi.fn();
  const mockGetRecaptchaToken = vi.mocked(recaptcha.getRecaptchaToken);

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Zustand store
    useSession.setState({ apiKey: "", rememberApiKey: false });
    // Default mock for recaptcha - reset to default
    mockGetRecaptchaToken.mockReset();
    mockGetRecaptchaToken.mockResolvedValue("mock-recaptcha-token");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render API key input field", () => {
      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      expect(screen.getByLabelText(/gemini api key/i)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/paste your gemini api key here/i)
      ).toBeInTheDocument();
    });

    it("should render remember checkbox", () => {
      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      expect(screen.getByLabelText(/remember my api key/i)).toBeInTheDocument();
    });

    it("should render submit button", () => {
      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      expect(
        screen.getByRole("button", { name: /analyze resume/i })
      ).toBeInTheDocument();
    });

    it("should show API key help link", () => {
      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      const link = screen.getByText(/get your key/i);
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute(
        "href",
        "https://ai.google.dev/gemini-api/docs/api-key"
      );
    });

    it("should show reCAPTCHA privacy notice", () => {
      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      expect(screen.getByText(/protected by recaptcha/i)).toBeInTheDocument();
      expect(screen.getByText(/privacy policy/i)).toBeInTheDocument();
      expect(screen.getByText(/terms of service/i)).toBeInTheDocument();
    });
  });

  describe("API Key Input", () => {
    it("should allow typing API key", async () => {
      const user = userEvent.setup();
      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      const input = screen.getByPlaceholderText(
        /paste your gemini api key here/i
      );
      await user.type(input, "test-api-key-12345");

      expect(useSession.getState().apiKey).toBe("test-api-key-12345");
    });

    it("should default to password type (hidden)", () => {
      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      const input = screen.getByPlaceholderText(
        /paste your gemini api key here/i
      );
      expect(input).toHaveAttribute("type", "password");
    });

    it("should toggle API key visibility", async () => {
      const user = userEvent.setup();
      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      const input = screen.getByPlaceholderText(
        /paste your gemini api key here/i
      );
      const toggleButton = screen.getByTitle(/show key/i);

      // Initially hidden
      expect(input).toHaveAttribute("type", "password");

      // Click to show
      await user.click(toggleButton);
      expect(input).toHaveAttribute("type", "text");

      // Click to hide again
      const hideButton = screen.getByTitle(/hide key/i);
      await user.click(hideButton);
      expect(input).toHaveAttribute("type", "password");
    });

    it("should show clear button when API key exists", async () => {
      const user = userEvent.setup();
      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      const input = screen.getByPlaceholderText(
        /paste your gemini api key here/i
      );

      // No clear button initially
      expect(screen.queryByTitle(/clear api key/i)).not.toBeInTheDocument();

      // Type API key
      await user.type(input, "my-api-key");

      // Clear button appears
      expect(screen.getByTitle(/clear api key/i)).toBeInTheDocument();
    });

    it("should clear API key when clear button clicked", async () => {
      const user = userEvent.setup();

      // Set initial API key
      useSession.setState({ apiKey: "existing-key", rememberApiKey: true });

      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      const clearButton = screen.getByTitle(/clear api key/i);
      await user.click(clearButton);

      expect(useSession.getState().apiKey).toBe("");
      expect(useSession.getState().rememberApiKey).toBe(false);
    });
  });

  describe("Remember Checkbox", () => {
    it("should toggle remember checkbox", async () => {
      const user = userEvent.setup();
      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      const checkbox = screen.getByLabelText(/remember my api key/i);

      // Initially unchecked
      expect(checkbox).not.toBeChecked();
      expect(useSession.getState().rememberApiKey).toBe(false);

      // Check it
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
      expect(useSession.getState().rememberApiKey).toBe(true);

      // Uncheck it
      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
      expect(useSession.getState().rememberApiKey).toBe(false);
    });

    it("should reflect initial remember state from store", () => {
      useSession.setState({ rememberApiKey: true });

      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      const checkbox = screen.getByLabelText(/remember my api key/i);
      expect(checkbox).toBeChecked();
    });
  });

  describe("Button States", () => {
    it("should disable button when no API key", () => {
      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      const button = screen.getByRole("button", { name: /analyze resume/i });
      expect(button).toBeDisabled();
    });

    it("should enable button when API key provided and no cooldown", () => {
      useSession.setState({ apiKey: "test-key" });

      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      const button = screen.getByRole("button", { name: /analyze resume/i });
      expect(button).not.toBeDisabled();
    });

    it('should show "Please wait" when analyzing', () => {
      useSession.setState({ apiKey: "test-key" });

      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={true}
        />
      );

      expect(screen.getByText("Please wait")).toBeInTheDocument();
    });

    it("should show cooldown seconds", () => {
      useSession.setState({ apiKey: "test-key" });

      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={5}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      expect(screen.getByText("Please wait (5s)")).toBeInTheDocument();
      expect(
        screen.getByText(/cooldown prevents accidental resubmissions/i)
      ).toBeInTheDocument();
    });

    it("should show disabled message when isDisabled prop is true", () => {
      useSession.setState({ apiKey: "test-key" });

      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={true}
          isAnalyzing={false}
        />
      );

      expect(
        screen.getByText("Please complete all required fields")
      ).toBeInTheDocument();
    });

    it('should show "Verifying..." during reCAPTCHA verification', async () => {
      const user = userEvent.setup();
      useSession.setState({ apiKey: "test-key" });

      // Make reCAPTCHA take some time
      mockGetRecaptchaToken.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve("token"), 100);
          })
      );

      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      const button = screen.getByRole("button", { name: /analyze resume/i });
      await user.click(button);

      // Should show verifying state
      expect(screen.getByText("Verifying...")).toBeInTheDocument();

      // Wait for the async operation to complete to avoid test pollution
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith("token");
      });
    });
  });

  describe("Submit Functionality", () => {
    it("should call onSubmit with recaptcha token on button click", async () => {
      const user = userEvent.setup();
      useSession.setState({ apiKey: "test-key" });

      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      const button = screen.getByRole("button", { name: /analyze resume/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockGetRecaptchaToken).toHaveBeenCalledWith("submit_analysis");
        expect(mockOnSubmit).toHaveBeenCalledWith("mock-recaptcha-token");
      });
    });

    it("should not submit when cooldown is active", () => {
      useSession.setState({ apiKey: "test-key" });

      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={5}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      const button = screen.getByRole("button", {
        name: /please wait \(5s\)/i,
      });

      // Button should be disabled during cooldown
      expect(button).toBeDisabled();
    });

    it("should not submit when disabled", () => {
      useSession.setState({ apiKey: "test-key" });

      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={true}
          isAnalyzing={false}
        />
      );

      const button = screen.getByRole("button", {
        name: /please complete all required fields/i,
      });

      // Button should be disabled when isDisabled is true
      expect(button).toBeDisabled();
    });

    it("should not submit when no API key", () => {
      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      const button = screen.getByRole("button", { name: /analyze resume/i });

      // Button should be disabled when no API key
      expect(button).toBeDisabled();
    });
  });

  describe("reCAPTCHA Error Handling", () => {
    it("should display error when reCAPTCHA fails", async () => {
      const user = userEvent.setup();
      useSession.setState({ apiKey: "test-key" });

      mockGetRecaptchaToken.mockRejectedValue(
        new Error("reCAPTCHA verification failed")
      );

      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      const button = screen.getByRole("button", { name: /analyze resume/i });
      await user.click(button);

      await waitFor(() => {
        expect(
          screen.getByText("reCAPTCHA verification failed")
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should clear previous error on new submission attempt", async () => {
      const user = userEvent.setup();
      useSession.setState({ apiKey: "test-key" });

      // First attempt fails
      mockGetRecaptchaToken.mockRejectedValueOnce(new Error("First error"));

      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      const button = screen.getByRole("button", { name: /analyze resume/i });

      // First click - should show error
      await user.click(button);
      await waitFor(() => {
        expect(screen.getByText("First error")).toBeInTheDocument();
      });

      // Second attempt succeeds
      mockGetRecaptchaToken.mockResolvedValueOnce("token-success");

      await user.click(button);

      await waitFor(() => {
        expect(screen.queryByText("First error")).not.toBeInTheDocument();
        expect(mockOnSubmit).toHaveBeenCalledWith("token-success");
      });
    });

    it("should handle non-Error objects in reCAPTCHA rejection", async () => {
      const user = userEvent.setup();
      useSession.setState({ apiKey: "test-key" });

      mockGetRecaptchaToken.mockRejectedValue("String error");

      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      const button = screen.getByRole("button", { name: /analyze resume/i });
      await user.click(button);

      await waitFor(() => {
        expect(
          screen.getByText("reCAPTCHA verification failed")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for form elements", () => {
      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      expect(screen.getByLabelText(/gemini api key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remember my api key/i)).toBeInTheDocument();
    });

    it("should have title attributes for icon buttons", () => {
      useSession.setState({ apiKey: "test-key" });

      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      expect(screen.getByTitle(/show key/i)).toBeInTheDocument();
      expect(screen.getByTitle(/clear api key/i)).toBeInTheDocument();
    });

    it("should have external links with proper security attributes", () => {
      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      const apiKeyLink = screen.getByText(/get your key/i);
      expect(apiKeyLink).toHaveAttribute("target", "_blank");
      expect(apiKeyLink).toHaveAttribute("rel", "noopener noreferrer");

      const privacyLink = screen.getByText(/privacy policy/i);
      expect(privacyLink).toHaveAttribute("target", "_blank");
      expect(privacyLink).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("Integration", () => {
    it("should maintain API key across re-renders", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      const input = screen.getByPlaceholderText(
        /paste your gemini api key here/i
      );
      await user.type(input, "persistent-key");

      // Re-render with different props
      rerender(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={3}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      expect(input).toHaveValue("persistent-key");
      expect(useSession.getState().apiKey).toBe("persistent-key");
    });

    it("should work with pre-populated API key from store", () => {
      useSession.setState({ apiKey: "stored-key", rememberApiKey: true });

      render(
        <SubmitBar
          onSubmit={mockOnSubmit}
          cooldownSeconds={0}
          isDisabled={false}
          isAnalyzing={false}
        />
      );

      const input = screen.getByPlaceholderText(
        /paste your gemini api key here/i
      );
      expect(input).toHaveValue("stored-key");

      const checkbox = screen.getByLabelText(/remember my api key/i);
      expect(checkbox).toBeChecked();

      const button = screen.getByRole("button", { name: /analyze resume/i });
      expect(button).not.toBeDisabled();
    });
  });
});
