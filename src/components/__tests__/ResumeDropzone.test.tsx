import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResumeDropzone from "../ResumeDropzone";
import type { ParsedResume } from "../../types";

describe("ResumeDropzone", () => {
  const mockOnFileSelect = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render with both tabs", () => {
      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={null}
          onClear={mockOnClear}
        />
      );

      expect(screen.getByText(/upload file/i)).toBeInTheDocument();
      expect(screen.getByText(/paste text/i)).toBeInTheDocument();
    });

    it("should default to upload tab", () => {
      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={null}
          onClear={mockOnClear}
        />
      );

      expect(
        screen.getByText(/drag and drop your resume here/i)
      ).toBeInTheDocument();
    });

    it("should show file type support text", () => {
      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={null}
          onClear={mockOnClear}
        />
      );

      expect(
        screen.getByText(/supports: pdf, docx, md, txt/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/max 1mb/i)).toBeInTheDocument();
    });
  });

  describe("Tab Navigation", () => {
    it("should switch to paste tab when clicked", async () => {
      const user = userEvent.setup();
      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={null}
          onClear={mockOnClear}
        />
      );

      const pasteTab = screen.getByText(/paste text/i);
      await user.click(pasteTab);

      expect(
        screen.getByPlaceholderText(/paste your resume text here/i)
      ).toBeInTheDocument();
    });

    it("should switch back to upload tab", async () => {
      const user = userEvent.setup();
      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={null}
          onClear={mockOnClear}
        />
      );

      // Click paste tab
      await user.click(screen.getByText(/paste text/i));
      expect(
        screen.getByPlaceholderText(/paste your resume text here/i)
      ).toBeInTheDocument();

      // Click upload tab
      await user.click(screen.getByText(/upload file/i));
      expect(
        screen.getByText(/drag and drop your resume here/i)
      ).toBeInTheDocument();
    });
  });

  describe("File Upload", () => {
    it("should accept file input through click", async () => {
      const user = userEvent.setup();
      const file = new File(["test content"], "resume.pdf", {
        type: "application/pdf",
      });

      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={null}
          onClear={mockOnClear}
        />
      );

      // Find the hidden input by type and accept attributes
      const input = document.querySelector(
        'input[type="file"][accept=".pdf,.docx,.doc,.md,.txt"]'
      ) as HTMLInputElement;

      await user.upload(input, file);

      expect(mockOnFileSelect).toHaveBeenCalledWith(file);
    });

    it("should validate file size (max 1MB)", async () => {
      const user = userEvent.setup();
      const largeFile = new File(["x".repeat(2 * 1024 * 1024)], "large.pdf", {
        type: "application/pdf",
      });

      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={null}
          onClear={mockOnClear}
        />
      );

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      await user.upload(input, largeFile);

      await waitFor(() => {
        expect(
          screen.getByText(/file size must be under 1mb/i)
        ).toBeInTheDocument();
      });
      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it("should validate file type", async () => {
      // Create an invalid file
      const invalidFile = new File(["test content"], "malware.exe", {
        type: "application/x-msdownload",
      });

      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={null}
          onClear={mockOnClear}
        />
      );

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      // Manually trigger the onChange event with the invalid file
      // This bypasses browser validation that respects the 'accept' attribute
      await waitFor(() => {
        Object.defineProperty(input, "files", {
          value: [invalidFile],
          configurable: true,
        });

        const changeEvent = new Event("change", { bubbles: true });
        input.dispatchEvent(changeEvent);
      });

      // The error should appear
      await waitFor(() => {
        expect(
          screen.getByText("Please upload a PDF, DOCX, MD, or TXT file")
        ).toBeInTheDocument();
      });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it("should accept valid PDF file", async () => {
      const user = userEvent.setup();
      const file = new File(["test content"], "resume.pdf", {
        type: "application/pdf",
      });

      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={null}
          onClear={mockOnClear}
        />
      );

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      await user.upload(input, file);

      expect(mockOnFileSelect).toHaveBeenCalledWith(file);
      expect(
        screen.queryByText(/file size must be under 1mb/i)
      ).not.toBeInTheDocument();
    });

    it("should accept valid DOCX file", async () => {
      const user = userEvent.setup();
      const file = new File(["test"], "resume.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={null}
          onClear={mockOnClear}
        />
      );

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      await user.upload(input, file);

      expect(mockOnFileSelect).toHaveBeenCalledWith(file);
    });

    it("should accept TXT file by extension even without mime type", async () => {
      const user = userEvent.setup();
      const file = new File(["test"], "resume.txt", { type: "" });

      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={null}
          onClear={mockOnClear}
        />
      );

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      await user.upload(input, file);

      expect(mockOnFileSelect).toHaveBeenCalledWith(file);
    });
  });

  describe("Text Paste", () => {
    it("should allow typing in textarea", async () => {
      const user = userEvent.setup();
      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={null}
          onClear={mockOnClear}
        />
      );

      await user.click(screen.getByText(/paste text/i));

      const textarea = screen.getByPlaceholderText(
        /paste your resume text here/i
      );
      await user.type(textarea, "My resume content");

      expect(textarea).toHaveValue("My resume content");
    });

    it("should show character count", async () => {
      const user = userEvent.setup();
      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={null}
          onClear={mockOnClear}
        />
      );

      await user.click(screen.getByText(/paste text/i));

      const textarea = screen.getByPlaceholderText(
        /paste your resume text here/i
      );
      await user.type(textarea, "Test");

      expect(screen.getByText("4 characters")).toBeInTheDocument();
    });

    it("should show minimum character requirement", async () => {
      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={null}
          onClear={mockOnClear}
        />
      );

      await userEvent.click(screen.getByText(/paste text/i));

      expect(screen.getByText(/minimum 200 characters/i)).toBeInTheDocument();
    });
  });

  describe("Parsed Resume Display", () => {
    it("should display uploaded file info", async () => {
      const user = userEvent.setup();
      const parsedResume: ParsedResume = {
        text: "Resume content",
        wordCount: 250,
        pageCount: 1,
        parseWarnings: [],
        source: "file",
        fileName: "my-resume.pdf",
        fileSize: 50000,
      };

      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={parsedResume}
          onClear={mockOnClear}
        />
      );

      // Auto-switches to paste tab, click back to upload tab
      await user.click(screen.getByText(/upload file/i));

      expect(screen.getByText("my-resume.pdf")).toBeInTheDocument();
      expect(screen.getByText(/words:/i)).toBeInTheDocument();
      expect(screen.getByText(/250/)).toBeInTheDocument();
      expect(screen.getByText(/pages:/i)).toBeInTheDocument();
      expect(screen.getByText(/1/)).toBeInTheDocument();
    });

    it("should show file size formatted", async () => {
      const user = userEvent.setup();
      const parsedResume: ParsedResume = {
        text: "Content",
        wordCount: 100,
        pageCount: 1,
        parseWarnings: [],
        source: "file",
        fileName: "resume.pdf",
        fileSize: 512000, // ~500KB
      };

      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={parsedResume}
          onClear={mockOnClear}
        />
      );

      // Switch back to upload tab to see file info
      await user.click(screen.getByText(/upload file/i));

      expect(screen.getByText(/size:/i)).toBeInTheDocument();
    });

    it("should show parse warnings if any", async () => {
      const user = userEvent.setup();
      const parsedResume: ParsedResume = {
        text: "Content",
        wordCount: 100,
        pageCount: 5,
        parseWarnings: ["Resume is too long", "Some formatting lost"],
        source: "file",
        fileName: "resume.pdf",
        fileSize: 50000,
      };

      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={parsedResume}
          onClear={mockOnClear}
        />
      );

      // Switch back to upload tab to see warnings
      await user.click(screen.getByText(/upload file/i));

      expect(screen.getByText(/parsing notes:/i)).toBeInTheDocument();
      expect(screen.getByText(/resume is too long/i)).toBeInTheDocument();
      expect(screen.getByText(/some formatting lost/i)).toBeInTheDocument();
    });

    it("should show replace file button", async () => {
      const user = userEvent.setup();
      const parsedResume: ParsedResume = {
        text: "Content",
        wordCount: 100,
        pageCount: 1,
        parseWarnings: [],
        source: "file",
        fileName: "resume.pdf",
        fileSize: 50000,
      };

      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={parsedResume}
          onClear={mockOnClear}
        />
      );

      // Switch back to upload tab to see replace button
      await user.click(screen.getByText(/upload file/i));

      expect(screen.getByText(/replace file/i)).toBeInTheDocument();
    });

    it("should show clear button for text", async () => {
      const user = userEvent.setup();
      const parsedResume: ParsedResume = {
        text: "Pasted content",
        wordCount: 100,
        pageCount: 1,
        parseWarnings: [],
        source: "text",
        fileName: "",
        fileSize: 0,
      };

      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={parsedResume}
          onClear={mockOnClear}
        />
      );

      // For text source, starts on upload tab, switch to paste tab
      await user.click(screen.getByText(/paste text/i));

      expect(screen.getByText("Clear")).toBeInTheDocument();
    });

    it("should call onClear when clear button clicked", async () => {
      const user = userEvent.setup();
      const parsedResume: ParsedResume = {
        text: "Content",
        wordCount: 100,
        pageCount: 1,
        parseWarnings: [],
        source: "file",
        fileName: "resume.pdf",
        fileSize: 50000,
      };

      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={parsedResume}
          onClear={mockOnClear}
        />
      );

      // Switch back to upload tab to see clear button (X icon)
      await user.click(screen.getByText(/upload file/i));

      const clearButton = screen.getByTitle("Remove file");
      await user.click(clearButton);

      expect(mockOnClear).toHaveBeenCalled();
    });
  });

  describe("Tab Indicators", () => {
    it("should show indicator on upload tab when file is uploaded", () => {
      const parsedResume: ParsedResume = {
        text: "Content",
        wordCount: 100,
        pageCount: 1,
        parseWarnings: [],
        source: "file",
        fileName: "resume.pdf",
        fileSize: 50000,
      };

      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={parsedResume}
          onClear={mockOnClear}
        />
      );

      const uploadTab = screen.getByText(/upload file/i).parentElement;
      const indicator = uploadTab?.querySelector(".bg-green-500");

      expect(indicator).toBeInTheDocument();
    });

    it("should show indicator on paste tab when text is present", async () => {
      const parsedResume: ParsedResume = {
        text: "Pasted text content",
        wordCount: 100,
        pageCount: 1,
        parseWarnings: [],
        source: "text",
        fileName: "",
        fileSize: 0,
      };

      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={parsedResume}
          onClear={mockOnClear}
        />
      );

      await waitFor(() => {
        const pasteTab = screen.getByText(/paste text/i).parentElement;
        const indicator = pasteTab?.querySelector(".bg-green-500");
        expect(indicator).toBeInTheDocument();
      });
    });
  });

  describe("Auto Tab Switching", () => {
    it("should switch to paste tab when file is uploaded", async () => {
      const { rerender } = render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={null}
          onClear={mockOnClear}
        />
      );

      // Initially on upload tab
      expect(
        screen.getByText(/drag and drop your resume here/i)
      ).toBeInTheDocument();

      // File gets parsed
      const parsedResume: ParsedResume = {
        text: "Parsed content from file",
        wordCount: 100,
        pageCount: 1,
        parseWarnings: [],
        source: "file",
        fileName: "resume.pdf",
        fileSize: 50000,
      };

      rerender(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={parsedResume}
          onClear={mockOnClear}
        />
      );

      // Should auto-switch to paste tab
      await waitFor(() => {
        expect(
          screen.getByDisplayValue("Parsed content from file")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display file size error", async () => {
      const user = userEvent.setup();
      const largeFile = new File(["x".repeat(2 * 1024 * 1024)], "large.pdf", {
        type: "application/pdf",
      });

      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={null}
          onClear={mockOnClear}
        />
      );

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      await user.upload(input, largeFile);

      await waitFor(() => {
        const errorElement = screen.getByText(/file size must be under 1mb/i);
        expect(errorElement).toBeInTheDocument();
        expect(errorElement.closest("div")).toHaveClass("bg-destructive/10");
      });
    });

    it("should clear error when valid file is uploaded", async () => {
      const user = userEvent.setup();
      const largeFile = new File(["x".repeat(2 * 1024 * 1024)], "large.pdf", {
        type: "application/pdf",
      });
      const validFile = new File(["valid content"], "resume.pdf", {
        type: "application/pdf",
      });

      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={null}
          onClear={mockOnClear}
        />
      );

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      // Upload large file
      await user.upload(input, largeFile);
      await waitFor(() => {
        expect(
          screen.getByText(/file size must be under 1mb/i)
        ).toBeInTheDocument();
      });

      // Upload valid file
      await user.upload(input, validFile);

      await waitFor(() => {
        expect(
          screen.queryByText(/file size must be under 1mb/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper file input attributes", () => {
      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={null}
          onClear={mockOnClear}
        />
      );

      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      expect(input).toHaveAttribute("type", "file");
      expect(input).toHaveAttribute("accept", ".pdf,.docx,.doc,.md,.txt");
    });

    it("should have accessible textarea", async () => {
      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={null}
          onClear={mockOnClear}
        />
      );

      await userEvent.click(screen.getByText(/paste text/i));

      const textarea = screen.getByPlaceholderText(
        /paste your resume text here/i
      );
      expect(textarea).toHaveAttribute("name", "resumeText");
    });

    it("should have clear button with title", async () => {
      const user = userEvent.setup();
      const parsedResume: ParsedResume = {
        text: "Content",
        wordCount: 100,
        pageCount: 1,
        parseWarnings: [],
        source: "file",
        fileName: "resume.pdf",
        fileSize: 50000,
      };

      render(
        <ResumeDropzone
          onFileSelect={mockOnFileSelect}
          parsedResume={parsedResume}
          onClear={mockOnClear}
        />
      );

      // Switch to upload tab to see the Remove file button
      await user.click(screen.getByText(/upload file/i));

      const clearButton = screen.getByTitle("Remove file");
      expect(clearButton).toBeInTheDocument();
    });
  });
});
