import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResultPane from "../ResultPane";
import type { AnalysisResult } from "../../types";

describe("ResultPane", () => {
  const mockResult: AnalysisResult = {
    content: "# Test Analysis\n\nThis is a **test** result.",
    timestamp: new Date("2024-01-15T10:30:00"),
    isStreaming: false,
  };

  const mockClipboard = {
    writeText: vi.fn(() => Promise.resolve()),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard API
    Object.defineProperty(navigator, "clipboard", {
      value: mockClipboard,
      writable: true,
      configurable: true,
    });
    mockClipboard.writeText.mockClear();
    mockClipboard.writeText.mockResolvedValue(undefined);

    // Mock window.open
    vi.stubGlobal("open", vi.fn());
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe("Empty State", () => {
    it("should render empty state when no result and not streaming", () => {
      render(<ResultPane result={null} isStreaming={false} />);

      expect(screen.getByText("No Results Yet")).toBeInTheDocument();
      expect(
        screen.getByText(/Upload your resume, configure the analysis/i)
      ).toBeInTheDocument();
    });

    it("should show FileText icon in empty state", () => {
      const { container } = render(
        <ResultPane result={null} isStreaming={false} />
      );

      // Check for the svg element (FileText icon)
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Streaming State", () => {
    it("should show streaming indicator when streaming with no result", () => {
      render(<ResultPane result={null} isStreaming={true} />);

      expect(screen.getByText("Analyzing your resume...")).toBeInTheDocument();
      expect(screen.getByText("This may take a moment")).toBeInTheDocument();
    });

    it("should show spinner icon when streaming", () => {
      const { container } = render(
        <ResultPane result={null} isStreaming={true} />
      );

      // Check for animated spinner
      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should show streaming indicator when streaming with partial result", () => {
      render(<ResultPane result={mockResult} isStreaming={true} />);

      expect(screen.getByText("Streaming results...")).toBeInTheDocument();
    });

    it("should not show streaming indicator when streaming is complete", () => {
      render(<ResultPane result={mockResult} isStreaming={false} />);

      expect(
        screen.queryByText("Streaming results...")
      ).not.toBeInTheDocument();
    });
  });

  describe("Results Display", () => {
    it("should render markdown content", () => {
      render(<ResultPane result={mockResult} isStreaming={false} />);

      // Check for rendered markdown elements
      expect(
        screen.getByRole("heading", { name: "Test Analysis" })
      ).toBeInTheDocument();
      expect(screen.getByText(/This is a/)).toBeInTheDocument();

      // Check that "test" is rendered as bold (strong tag)
      const strongElement = screen.getByText("test");
      expect(strongElement.tagName).toBe("STRONG");
    });

    it("should render complex markdown with lists and links", () => {
      const complexResult: AnalysisResult = {
        content:
          "## Summary\n\n- Item 1\n- Item 2\n\n[Link text](https://example.com)",
        timestamp: new Date(),
        isStreaming: false,
      };

      render(<ResultPane result={complexResult} isStreaming={false} />);

      expect(
        screen.getByRole("heading", { name: "Summary" })
      ).toBeInTheDocument();
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Link text" })
      ).toBeInTheDocument();
    });

    it("should display timestamp when not streaming", () => {
      render(<ResultPane result={mockResult} isStreaming={false} />);

      expect(screen.getByText(/Generated:/)).toBeInTheDocument();
      // The exact format depends on locale, but check the date is present
      expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
    });

    it("should not display timestamp when streaming", () => {
      render(<ResultPane result={mockResult} isStreaming={true} />);

      expect(screen.queryByText(/Generated:/)).not.toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    it("should render all action buttons", () => {
      render(<ResultPane result={mockResult} isStreaming={false} />);

      expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /download/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /open/i })).toBeInTheDocument();
    });

    it("should have proper title attributes for action buttons", () => {
      render(<ResultPane result={mockResult} isStreaming={false} />);

      expect(screen.getByTitle("Copy to clipboard")).toBeInTheDocument();
      expect(screen.getByTitle("Download as text file")).toBeInTheDocument();
      expect(screen.getByTitle("Open in new tab")).toBeInTheDocument();
    });

    it("should not render action buttons in empty state", () => {
      render(<ResultPane result={null} isStreaming={false} />);

      expect(
        screen.queryByRole("button", { name: /copy/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /download/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /open/i })
      ).not.toBeInTheDocument();
    });

    it("should not render action buttons when only streaming", () => {
      render(<ResultPane result={null} isStreaming={true} />);

      expect(
        screen.queryByRole("button", { name: /copy/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /download/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /open/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Copy Functionality", () => {
    it("should show success message after copying", async () => {
      const user = userEvent.setup();
      render(<ResultPane result={mockResult} isStreaming={false} />);

      const copyButton = screen.getByRole("button", { name: /copy/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /copied!/i })
        ).toBeInTheDocument();
      });
    });

    it("should not show copy button when result is null", () => {
      render(<ResultPane result={null} isStreaming={false} />);

      expect(
        screen.queryByRole("button", { name: /copy/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Download Functionality", () => {
    it("should have download button when result exists", () => {
      render(<ResultPane result={mockResult} isStreaming={false} />);

      const downloadButton = screen.getByRole("button", { name: /download/i });
      expect(downloadButton).toBeInTheDocument();
      expect(downloadButton).toHaveAttribute("title", "Download as text file");
    });

    it("should not show download button when result is null", () => {
      render(<ResultPane result={null} isStreaming={false} />);

      expect(
        screen.queryByRole("button", { name: /download/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Open in New Tab Functionality", () => {
    it("should have open button when result exists", () => {
      render(<ResultPane result={mockResult} isStreaming={false} />);

      const openButton = screen.getByRole("button", { name: /open/i });
      expect(openButton).toBeInTheDocument();
      expect(openButton).toHaveAttribute("title", "Open in new tab");
    });

    it("should not show open button when result is null", () => {
      render(<ResultPane result={null} isStreaming={false} />);

      expect(
        screen.queryByRole("button", { name: /open/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible button labels", () => {
      render(<ResultPane result={mockResult} isStreaming={false} />);

      const copyButton = screen.getByRole("button", { name: /copy/i });
      const downloadButton = screen.getByRole("button", { name: /download/i });
      const openButton = screen.getByRole("button", { name: /open/i });

      expect(copyButton).toHaveAccessibleName();
      expect(downloadButton).toHaveAccessibleName();
      expect(openButton).toHaveAccessibleName();
    });

    it("should have proper heading hierarchy", () => {
      render(<ResultPane result={mockResult} isStreaming={false} />);

      const heading = screen.getByRole("heading", { name: "Test Analysis" });
      expect(heading.tagName).toBe("H1");
    });

    it("should have accessible empty state message", () => {
      render(<ResultPane result={null} isStreaming={false} />);

      const heading = screen.getByRole("heading", { name: "No Results Yet" });
      expect(heading).toBeInTheDocument();
    });

    it("should have accessible loading state", () => {
      render(<ResultPane result={null} isStreaming={true} />);

      expect(screen.getByText("Analyzing your resume...")).toBeInTheDocument();
      expect(screen.getByText("This may take a moment")).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("should handle transition from streaming to complete state", () => {
      const { rerender } = render(
        <ResultPane result={mockResult} isStreaming={true} />
      );

      expect(screen.getByText("Streaming results...")).toBeInTheDocument();
      expect(screen.queryByText(/Generated:/)).not.toBeInTheDocument();

      // Complete streaming
      rerender(<ResultPane result={mockResult} isStreaming={false} />);

      expect(
        screen.queryByText("Streaming results...")
      ).not.toBeInTheDocument();
      expect(screen.getByText(/Generated:/)).toBeInTheDocument();
    });

    it("should handle updating result content during streaming", () => {
      const initialResult: AnalysisResult = {
        content: "# Initial",
        timestamp: new Date(),
        isStreaming: true,
      };

      const { rerender } = render(
        <ResultPane result={initialResult} isStreaming={true} />
      );

      expect(
        screen.getByRole("heading", { name: "Initial" })
      ).toBeInTheDocument();

      // Update with more content
      const updatedResult: AnalysisResult = {
        content: "# Initial\n\n## Updated Section",
        timestamp: initialResult.timestamp,
        isStreaming: true,
      };

      rerender(<ResultPane result={updatedResult} isStreaming={true} />);

      expect(
        screen.getByRole("heading", { name: "Initial" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Updated Section" })
      ).toBeInTheDocument();
    });

    it("should render empty string content without error", () => {
      const emptyResult: AnalysisResult = {
        content: "",
        timestamp: new Date(),
        isStreaming: false,
      };

      render(<ResultPane result={emptyResult} isStreaming={false} />);

      // Should render action buttons even with empty content
      expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /download/i })
      ).toBeInTheDocument();
    });
  });
});
