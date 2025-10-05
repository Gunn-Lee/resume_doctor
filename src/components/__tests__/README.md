# Component Tests

This directory contains unit tests for all React components.

## Structure

```
__tests__/
├── PromptConfigForm.test.tsx  ✅ 26 tests
└── README.md                   📖 This file
```

## Running Tests

```bash
# Run all tests once
npm test -- --run

# Run tests in watch mode (auto-reruns on file changes)
npm test

# Run tests with UI dashboard
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test PromptConfigForm

# Run tests matching a pattern
npm test -- -t "should render"
```

## Test Files

### PromptConfigForm.test.tsx

**Status**: ✅ All 26 tests passing  
**Coverage**: Comprehensive  
**Documentation**: [PROMPT_CONFIG_FORM_TESTS.md](../../../docs/PROMPT_CONFIG_FORM_TESTS.md)

Tests cover:

- Rendering with various props
- User interactions (typing, selecting)
- Form validation
- State management (Zustand store)
- Accessibility features
- Edge cases and error handling
- Select option correctness

## Writing New Tests

### Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import YourComponent from "../YourComponent";

describe("YourComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Feature Group", () => {
    it("should do something specific", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<YourComponent />);

      // Act
      await user.click(screen.getByRole("button"));

      // Assert
      expect(screen.getByText("Expected text")).toBeInTheDocument();
    });
  });
});
```

### Best Practices

1. **Use Accessible Queries** (in order of preference):

   - `getByLabelText()` - For form inputs
   - `getByRole()` - For semantic elements
   - `getByPlaceholderText()` - For inputs without labels
   - `getByText()` - For static content
   - Avoid `getByTestId()` unless necessary

2. **Async Operations**:

   ```typescript
   await user.click(button);
   await waitFor(() => expect(element).toBeInTheDocument());
   ```

3. **Mock External Dependencies**:

   ```typescript
   vi.mock("../../store/useAppState", () => ({
     useAppState: vi.fn(),
   }));
   ```

4. **Clear Test Names**: Use descriptive names that explain the scenario

   ```typescript
   it("should display error message when email is invalid", () => {
     // Test implementation
   });
   ```

5. **Arrange-Act-Assert Pattern**: Keep tests organized
   ```typescript
   it("should do something", async () => {
     // Arrange: Setup
     const user = userEvent.setup();
     render(<Component />);

     // Act: User action
     await user.click(button);

     // Assert: Verify outcome
     expect(result).toBe(expected);
   });
   ```

## Test Categories

Tests are organized into logical groups:

- **Rendering**: Component display and initial state
- **Interaction**: User actions (click, type, select)
- **Validation**: Form validation and error states
- **State Management**: Store integration and updates
- **Accessibility**: ARIA, labels, keyboard navigation
- **Edge Cases**: Error handling, boundary conditions
- **Integration**: Multi-component interactions

## Testing Tools

### Vitest

Fast, modern test framework built for Vite projects.

- [Documentation](https://vitest.dev/)

### React Testing Library

User-centric testing utilities for React.

- [Documentation](https://testing-library.com/react)
- [Cheat Sheet](https://testing-library.com/docs/react-testing-library/cheatsheet/)

### @testing-library/user-event

Realistic user interaction simulation.

- [Documentation](https://testing-library.com/docs/user-event/intro)

### @testing-library/jest-dom

Custom matchers for DOM assertions.

- [Documentation](https://github.com/testing-library/jest-dom)

## Debugging Tests

### View Test Output

```bash
npm test -- --reporter=verbose
```

### Debug Single Test

```typescript
it.only("should debug this test", () => {
  // Only this test will run
});
```

### Skip Test Temporarily

```typescript
it.skip("should test later", () => {
  // This test will be skipped
});
```

### Use Debug Output

```typescript
import { render, screen } from "@testing-library/react";

render(<Component />);
screen.debug(); // Prints DOM tree
```

### Interactive Debugging

```typescript
it("should debug interactively", () => {
  render(<Component />);
  // Add breakpoint here in VS Code
  expect(screen.getByText("test")).toBeInTheDocument();
});
```

## Common Issues

### Issue: "Unable to find element"

**Solution**: Element might not be rendered yet

```typescript
await waitFor(() => {
  expect(screen.getByText("text")).toBeInTheDocument();
});
```

### Issue: "Act warning"

**Solution**: Wrap state updates in act or use async queries

```typescript
await user.click(button); // Already wrapped in act
```

### Issue: "Type error with queries"

**Solution**: Cast to specific element type

```typescript
const input = screen.getByLabelText("Name") as HTMLInputElement;
expect(input.value).toBe("John");
```

## Coverage Goals

Target coverage metrics:

- ✅ Statements: > 80%
- ✅ Branches: > 75%
- ✅ Functions: > 80%
- ✅ Lines: > 80%

Generate coverage report:

```bash
npm run test:coverage
```

## Continuous Integration

Tests run automatically on:

- Pull requests
- Main branch commits
- Pre-commit hooks (optional)

## Next Steps

Components to test next:

- [ ] ResumeDropzone
- [ ] SubmitBar
- [ ] ResultPane
- [ ] ErrorBoundary

## Resources

- [Component Test Documentation](../../../docs/PROMPT_CONFIG_FORM_TESTS.md)
- [Testing Library Docs](https://testing-library.com/)
- [Vitest Docs](https://vitest.dev/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
