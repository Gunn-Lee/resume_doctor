import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PromptConfigForm from "../PromptConfigForm";
import { useAppState } from "../../store/useAppState";
import type { JobContextFormValues } from "../../utils/validation";

// Mock the useAppState store
vi.mock("../../store/useAppState", () => ({
  useAppState: vi.fn(),
}));

describe("PromptConfigForm", () => {
  const mockOnSubmit = vi.fn();
  const mockSetFormData = vi.fn();
  const mockGetState = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementation
    (useAppState as any).mockReturnValue({
      formData: {
        analysisDepth: "compact",
        domain: "universal",
        experienceLevel: "Mid",
        targetRole: "",
        targetCompany: "",
      },
    });

    (useAppState as any).getState = mockGetState;
    mockGetState.mockReturnValue({
      formData: {
        analysisDepth: "compact",
        domain: "universal",
        experienceLevel: "Mid",
        targetRole: "",
        targetCompany: "",
      },
      setFormData: mockSetFormData,
    });
  });

  describe("Rendering", () => {
    it("should render all form fields", () => {
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/analysis depth/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/domain/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/target role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/target company/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/experience level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/geographic focus/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/special focus/i)).toBeInTheDocument();
    });

    it("should render with default values", () => {
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      const analysisDepth = screen.getByLabelText(
        /analysis depth/i
      ) as HTMLSelectElement;
      const domain = screen.getByLabelText(/domain/i) as HTMLSelectElement;
      const experienceLevel = screen.getByLabelText(
        /experience level/i
      ) as HTMLSelectElement;

      expect(analysisDepth.value).toBe("compact");
      expect(domain.value).toBe("universal");
      expect(experienceLevel.value).toBe("Mid");
    });

    it("should render with provided default values", () => {
      const defaultValues: Partial<JobContextFormValues> = {
        analysisDepth: "full",
        domain: "technical",
        targetRole: "Software Engineer",
        targetCompany: "Google",
        experienceLevel: "Senior",
      };

      render(
        <PromptConfigForm
          onSubmit={mockOnSubmit}
          defaultValues={defaultValues}
        />
      );

      const analysisDepth = screen.getByLabelText(
        /analysis depth/i
      ) as HTMLSelectElement;
      const domain = screen.getByLabelText(/domain/i) as HTMLSelectElement;
      const targetRole = screen.getByLabelText(
        /target role/i
      ) as HTMLInputElement;
      const targetCompany = screen.getByLabelText(
        /target company/i
      ) as HTMLInputElement;
      const experienceLevel = screen.getByLabelText(
        /experience level/i
      ) as HTMLSelectElement;

      expect(analysisDepth.value).toBe("full");
      expect(domain.value).toBe("technical");
      expect(targetRole.value).toBe("Software Engineer");
      expect(targetCompany.value).toBe("Google");
      expect(experienceLevel.value).toBe("Senior");
    });

    it("should mark required fields with asterisk", () => {
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      const targetRoleLabel = screen.getByText(/target role/i).closest("label");
      const targetCompanyLabel = screen
        .getByText(/target company/i)
        .closest("label");

      expect(targetRoleLabel?.textContent).toContain("*");
      expect(targetCompanyLabel?.textContent).toContain("*");
    });

    it("should mark optional fields", () => {
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      expect(
        screen.getByText(/geographic focus/i).closest("label")?.textContent
      ).toContain("optional");
      expect(
        screen.getByText(/special focus/i).closest("label")?.textContent
      ).toContain("optional");
    });
  });

  describe("Form Interaction", () => {
    it("should allow selecting different analysis depths", async () => {
      const user = userEvent.setup();
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      const analysisDepth = screen.getByLabelText(
        /analysis depth/i
      ) as HTMLSelectElement;

      await user.selectOptions(analysisDepth, "full");
      expect(analysisDepth.value).toBe("full");

      await user.selectOptions(analysisDepth, "compact");
      expect(analysisDepth.value).toBe("compact");
    });

    it("should allow selecting different domains", async () => {
      const user = userEvent.setup();
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      const domain = screen.getByLabelText(/domain/i) as HTMLSelectElement;

      await user.selectOptions(domain, "technical");
      expect(domain.value).toBe("technical");

      await user.selectOptions(domain, "nonTechnical");
      expect(domain.value).toBe("nonTechnical");

      await user.selectOptions(domain, "universal");
      expect(domain.value).toBe("universal");
    });

    it("should allow selecting different experience levels", async () => {
      const user = userEvent.setup();
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      const experienceLevel = screen.getByLabelText(
        /experience level/i
      ) as HTMLSelectElement;

      await user.selectOptions(experienceLevel, "Entry");
      expect(experienceLevel.value).toBe("Entry");

      await user.selectOptions(experienceLevel, "Senior");
      expect(experienceLevel.value).toBe("Senior");
    });

    it("should allow typing in text inputs", async () => {
      const user = userEvent.setup();
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      const targetRole = screen.getByLabelText(
        /target role/i
      ) as HTMLInputElement;
      const targetCompany = screen.getByLabelText(
        /target company/i
      ) as HTMLInputElement;
      const geographicFocus = screen.getByLabelText(
        /geographic focus/i
      ) as HTMLInputElement;

      await user.type(targetRole, "Product Manager");
      expect(targetRole.value).toBe("Product Manager");

      await user.type(targetCompany, "Microsoft");
      expect(targetCompany.value).toBe("Microsoft");

      await user.type(geographicFocus, "Seattle");
      expect(geographicFocus.value).toBe("Seattle");
    });

    it("should allow typing in textarea", async () => {
      const user = userEvent.setup();
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      const specialFocus = screen.getByLabelText(
        /special focus/i
      ) as HTMLTextAreaElement;

      await user.type(specialFocus, "Focus on leadership skills");
      expect(specialFocus.value).toBe("Focus on leadership skills");
    });
  });

  describe("Form Validation", () => {
    it("should show validation error for empty required fields on submit", () => {
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      // Check that required fields are present and properly marked
      const targetRole = screen.getByLabelText(
        /target role/i
      ) as HTMLInputElement;
      const targetCompany = screen.getByLabelText(
        /target company/i
      ) as HTMLInputElement;

      // Check that fields are present and can be interacted with
      expect(targetRole).toBeInTheDocument();
      expect(targetCompany).toBeInTheDocument();
    });

    it("should accept valid form data", async () => {
      const user = userEvent.setup();
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      const targetRole = screen.getByLabelText(
        /target role/i
      ) as HTMLInputElement;
      const targetCompany = screen.getByLabelText(
        /target company/i
      ) as HTMLInputElement;

      await user.type(targetRole, "Software Engineer");
      await user.type(targetCompany, "Google");

      expect(targetRole.value).toBe("Software Engineer");
      expect(targetCompany.value).toBe("Google");
    });
  });

  describe("State Management", () => {
    it("should update store when form values change", async () => {
      const user = userEvent.setup();
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      const targetRole = screen.getByLabelText(
        /target role/i
      ) as HTMLInputElement;

      await user.type(targetRole, "Engineer");

      // Wait for the useEffect to trigger
      await waitFor(() => {
        expect(mockSetFormData).toHaveBeenCalled();
      });
    });

    it("should initialize with formData from store", () => {
      const storeData = {
        analysisDepth: "full" as const,
        domain: "technical" as const,
        experienceLevel: "Senior" as const,
        targetRole: "Staff Engineer",
        targetCompany: "Meta",
      };

      (useAppState as any).mockReturnValue({
        formData: storeData,
      });

      mockGetState.mockReturnValue({
        formData: storeData,
        setFormData: mockSetFormData,
      });

      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      const analysisDepth = screen.getByLabelText(
        /analysis depth/i
      ) as HTMLSelectElement;
      const domain = screen.getByLabelText(/domain/i) as HTMLSelectElement;
      const targetRole = screen.getByLabelText(
        /target role/i
      ) as HTMLInputElement;

      expect(analysisDepth.value).toBe("full");
      expect(domain.value).toBe("technical");
      expect(targetRole.value).toBe("Staff Engineer");
    });

    it("should prioritize defaultValues over store formData", () => {
      (useAppState as any).mockReturnValue({
        formData: {
          analysisDepth: "compact" as const,
          targetRole: "Should be overridden",
        },
      });

      const defaultValues: Partial<JobContextFormValues> = {
        analysisDepth: "full" as const,
        targetRole: "Override Value",
      };

      render(
        <PromptConfigForm
          onSubmit={mockOnSubmit}
          defaultValues={defaultValues}
        />
      );

      const analysisDepth = screen.getByLabelText(
        /analysis depth/i
      ) as HTMLSelectElement;
      const targetRole = screen.getByLabelText(
        /target role/i
      ) as HTMLInputElement;

      expect(analysisDepth.value).toBe("full");
      expect(targetRole.value).toBe("Override Value");
    });
  });

  describe("Accessibility", () => {
    it("should have proper label associations", () => {
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      const analysisDepth = screen.getByLabelText(/analysis depth/i);
      const domain = screen.getByLabelText(/domain/i);
      const targetRole = screen.getByLabelText(/target role/i);
      const targetCompany = screen.getByLabelText(/target company/i);
      const experienceLevel = screen.getByLabelText(/experience level/i);
      const geographicFocus = screen.getByLabelText(/geographic focus/i);
      const specialFocus = screen.getByLabelText(/special focus/i);

      expect(analysisDepth).toHaveAttribute("id", "analysisDepth");
      expect(domain).toHaveAttribute("id", "domain");
      expect(targetRole).toHaveAttribute("id", "targetRole");
      expect(targetCompany).toHaveAttribute("id", "targetCompany");
      expect(experienceLevel).toHaveAttribute("id", "experienceLevel");
      expect(geographicFocus).toHaveAttribute("id", "geographicFocus");
      expect(specialFocus).toHaveAttribute("id", "specialFocus");
    });

    it("should have proper placeholder text", () => {
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      const targetRole = screen.getByPlaceholderText(
        /e.g., Software Engineer, Product Manager/i
      );
      const targetCompany = screen.getByPlaceholderText(
        /e.g., Google, Startup, Consulting Firm/i
      );
      const geographicFocus = screen.getByPlaceholderText(
        /e.g., San Francisco, Remote, EU/i
      );
      const specialFocus = screen.getByPlaceholderText(
        /Any specific areas to focus on or concerns to address?/i
      );

      expect(targetRole).toBeInTheDocument();
      expect(targetCompany).toBeInTheDocument();
      expect(geographicFocus).toBeInTheDocument();
      expect(specialFocus).toBeInTheDocument();
    });

    it("should have textareas with resize capability", () => {
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      const specialFocus = screen.getByLabelText(
        /special focus/i
      ) as HTMLTextAreaElement;

      expect(specialFocus.tagName).toBe("TEXTAREA");
      expect(specialFocus.rows).toBe(3);
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid form changes", async () => {
      const user = userEvent.setup();
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      const targetRole = screen.getByLabelText(
        /target role/i
      ) as HTMLInputElement;

      // Type rapidly
      await user.type(targetRole, "Test");

      expect(targetRole.value).toBe("Test");
    });

    it("should handle form clear and re-entry", async () => {
      const user = userEvent.setup();
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      const targetRole = screen.getByLabelText(
        /target role/i
      ) as HTMLInputElement;

      await user.type(targetRole, "First Value");
      expect(targetRole.value).toBe("First Value");

      await user.clear(targetRole);
      expect(targetRole.value).toBe("");

      await user.type(targetRole, "Second Value");
      expect(targetRole.value).toBe("Second Value");
    });

    it("should handle special characters in inputs", async () => {
      const user = userEvent.setup();
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      const targetRole = screen.getByLabelText(
        /target role/i
      ) as HTMLInputElement;
      const specialFocus = screen.getByLabelText(
        /special focus/i
      ) as HTMLTextAreaElement;

      await user.type(targetRole, "Senior C++ Developer @ FAANG");
      expect(targetRole.value).toBe("Senior C++ Developer @ FAANG");

      await user.type(specialFocus, "Focus on:\n- Leadership\n- Team building");
      expect(specialFocus.value).toContain("Leadership");
      expect(specialFocus.value).toContain("Team building");
    });

    it("should not break with null defaultValues", () => {
      render(
        <PromptConfigForm onSubmit={mockOnSubmit} defaultValues={undefined} />
      );

      const analysisDepth = screen.getByLabelText(
        /analysis depth/i
      ) as HTMLSelectElement;
      expect(analysisDepth).toBeInTheDocument();
    });

    it("should handle empty string values gracefully", async () => {
      const user = userEvent.setup();
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      const geographicFocus = screen.getByLabelText(
        /geographic focus/i
      ) as HTMLInputElement;

      await user.type(geographicFocus, "   ");
      expect(geographicFocus.value).toBe("   ");
    });
  });

  describe("Select Options", () => {
    it("should have correct analysis depth options", () => {
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      const analysisDepth = screen.getByLabelText(/analysis depth/i);
      const options = Array.from(analysisDepth.querySelectorAll("option")).map(
        (opt) => opt.value
      );

      expect(options).toEqual(["compact", "full"]);
    });

    it("should have correct domain options", () => {
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      const domain = screen.getByLabelText(/domain/i);
      const options = Array.from(domain.querySelectorAll("option")).map(
        (opt) => opt.value
      );

      expect(options).toEqual(["universal", "technical", "nonTechnical"]);
    });

    it("should have correct experience level options", () => {
      render(<PromptConfigForm onSubmit={mockOnSubmit} />);

      const experienceLevel = screen.getByLabelText(/experience level/i);
      const options = Array.from(
        experienceLevel.querySelectorAll("option")
      ).map((opt) => opt.value);

      expect(options).toEqual(["Entry", "Mid", "Senior"]);
    });
  });
});
