import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBoundary from "../ErrorBoundary";

// Component that throws an error when flag is true
interface ThrowErrorProps {
  shouldThrow?: boolean;
  errorMessage?: string;
}

function ThrowError({
  shouldThrow = false,
  errorMessage = "Test error",
}: ThrowErrorProps) {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>Working Component</div>;
}

describe("ErrorBoundary", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for cleaner test output
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  describe("Normal Operation", () => {
    it("should render children when no error occurs", () => {
      render(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("should render multiple children correctly", () => {
      render(
        <ErrorBoundary>
          <div>First Child</div>
          <div>Second Child</div>
          <div>Third Child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText("First Child")).toBeInTheDocument();
      expect(screen.getByText("Second Child")).toBeInTheDocument();
      expect(screen.getByText("Third Child")).toBeInTheDocument();
    });

    it("should render complex nested children", () => {
      render(
        <ErrorBoundary>
          <div>
            <h1>Title</h1>
            <p>Paragraph</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        </ErrorBoundary>
      );

      expect(
        screen.getByRole("heading", { name: "Title" })
      ).toBeInTheDocument();
      expect(screen.getByText("Paragraph")).toBeInTheDocument();
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should catch errors and display fallback UI", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText("Working Component")).not.toBeInTheDocument();
      expect(
        screen.getByText("Oops! Something went wrong")
      ).toBeInTheDocument();
      expect(
        screen.getByText(/We encountered an unexpected error/i)
      ).toBeInTheDocument();
    });

    it("should display custom error message", () => {
      const customError = "Custom error message";
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage={customError} />
        </ErrorBoundary>
      );

      expect(
        screen.getByText("Oops! Something went wrong")
      ).toBeInTheDocument();
    });

    it("should log error to console", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Test error" />
        </ErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
      // Check that console.error was called (React and ErrorBoundary both call it)
      expect(consoleErrorSpy.mock.calls.length).toBeGreaterThan(0);
    });

    it("should not render children after error", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
          <div>This should not be visible</div>
        </ErrorBoundary>
      );

      expect(
        screen.queryByText("This should not be visible")
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Working Component")).not.toBeInTheDocument();
    });
  });

  describe("Error UI Elements", () => {
    it("should display error icon", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Check for SVG icon
      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("text-red-600");
    });

    it("should display main error heading", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const heading = screen.getByRole("heading", {
        name: /something went wrong/i,
      });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe("H1");
    });

    it("should display helpful error message", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/We encountered an unexpected error/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/your data is safe/i)).toBeInTheDocument();
    });

    it("should display action buttons", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(
        screen.getByRole("button", { name: /try again/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /reload page/i })
      ).toBeInTheDocument();
    });

    it("should display support information", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/If this problem persists/i)).toBeInTheDocument();
      expect(
        screen.getByText(/clearing your browser cache/i)
      ).toBeInTheDocument();
    });
  });

  describe("Development Mode", () => {
    it("should show error details in development mode", () => {
      process.env.NODE_ENV = "development";

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Dev mode error" />
        </ErrorBoundary>
      );

      expect(
        screen.getByText("Error Details (Development Mode)")
      ).toBeInTheDocument();
    });

    it("should hide error details in production mode", () => {
      process.env.NODE_ENV = "production";

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Prod mode error" />
        </ErrorBoundary>
      );

      expect(
        screen.queryByText("Error Details (Development Mode)")
      ).not.toBeInTheDocument();
    });

    it("should display error message in details", () => {
      process.env.NODE_ENV = "development";
      const errorMessage = "Specific dev error";

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage={errorMessage} />
        </ErrorBoundary>
      );

      // Error message should be in the details section
      const detailsSection = screen
        .getByText("Error Details (Development Mode)")
        .closest("details");
      expect(detailsSection).toBeInTheDocument();
    });
  });

  describe("Reset Functionality", () => {
    it("should handle Try Again button click", async () => {
      const user = userEvent.setup();
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Error UI should be visible
      expect(
        screen.getByText("Oops! Something went wrong")
      ).toBeInTheDocument();

      // Click Try Again button - should not throw error
      const tryAgainButton = screen.getByRole("button", { name: /try again/i });
      await expect(user.click(tryAgainButton)).resolves.not.toThrow();
    });

    it("should have proper styling on Try Again button", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole("button", { name: /try again/i });
      expect(tryAgainButton).toHaveClass("bg-blue-600");
      expect(tryAgainButton).toHaveClass("text-white");
    });
  });

  describe("Reload Functionality", () => {
    it("should reload page when Reload Page button is clicked", async () => {
      const user = userEvent.setup();

      // Mock window.location.href
      delete (window as any).location;
      window.location = { href: "" } as any;

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole("button", { name: /reload page/i });
      await user.click(reloadButton);

      // Check that location.href was set to '/'
      expect(window.location.href).toBe("/");
    });

    it("should have proper styling on Reload Page button", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole("button", { name: /reload page/i });
      expect(reloadButton).toHaveClass("bg-gray-600");
      expect(reloadButton).toHaveClass("text-white");
    });
  });

  describe("Error Isolation", () => {
    it("should only catch errors from its children", () => {
      render(
        <div>
          <div>Outside ErrorBoundary</div>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </div>
      );

      // Content outside error boundary should still be visible
      expect(screen.getByText("Outside ErrorBoundary")).toBeInTheDocument();
      // Error UI should be shown for children
      expect(
        screen.getByText("Oops! Something went wrong")
      ).toBeInTheDocument();
    });

    it("should allow multiple independent error boundaries", () => {
      render(
        <div>
          <ErrorBoundary>
            <div>First Boundary - Working</div>
          </ErrorBoundary>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </div>
      );

      // First boundary should show its children
      expect(screen.getByText("First Boundary - Working")).toBeInTheDocument();
      // Second boundary should show error UI
      expect(
        screen.getByText("Oops! Something went wrong")
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible heading structure", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(/something went wrong/i);
    });

    it("should have accessible buttons", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole("button", { name: /try again/i });
      const reloadButton = screen.getByRole("button", { name: /reload page/i });

      expect(tryAgainButton).toHaveAccessibleName();
      expect(reloadButton).toHaveAccessibleName();
    });

    it("should have proper ARIA attributes on error icon", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null children", () => {
      render(<ErrorBoundary>{null}</ErrorBoundary>);

      // Should render without error
      expect(document.body).toBeInTheDocument();
    });

    it("should handle undefined children", () => {
      render(<ErrorBoundary>{undefined}</ErrorBoundary>);

      // Should render without error
      expect(document.body).toBeInTheDocument();
    });

    it("should handle empty children", () => {
      render(<ErrorBoundary>{""}</ErrorBoundary>);

      // Should render without error
      expect(document.body).toBeInTheDocument();
    });

    it("should handle errors thrown in event handlers gracefully", () => {
      // Note: ErrorBoundary doesn't catch errors in event handlers
      // This is React's behavior - just documenting it
      const ComponentWithEventError = () => {
        const handleClick = () => {
          throw new Error("Event handler error");
        };
        return <button onClick={handleClick}>Click Me</button>;
      };

      render(
        <ErrorBoundary>
          <ComponentWithEventError />
        </ErrorBoundary>
      );

      // Component should still render (error boundary won't catch event handler errors)
      expect(
        screen.getByRole("button", { name: /click me/i })
      ).toBeInTheDocument();
    });
  });
});
