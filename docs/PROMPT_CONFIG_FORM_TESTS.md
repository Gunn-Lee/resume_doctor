# PromptConfigForm Test Documentation

## Overview

This document describes the comprehensive unit tests for the `PromptConfigForm` component.

## Test Coverage

### Total Tests: 26

All tests passing ✅

## Test Suites

### 1. Rendering (5 tests)

Tests that verify the component renders correctly with proper structure.

- ✅ **should render all form fields**: Verifies all 7 form fields are present

  - Analysis Depth
  - Domain
  - Target Role (required)
  - Target Company (required)
  - Experience Level
  - Geographic Focus (optional)
  - Special Focus (optional)

- ✅ **should render with default values**: Confirms default values are applied

  - Analysis Depth: "compact"
  - Domain: "universal"
  - Experience Level: "Mid"

- ✅ **should render with provided default values**: Tests custom default values override defaults

- ✅ **should mark required fields with asterisk**: Validates required field indicators

  - Target Role (\*)
  - Target Company (\*)

- ✅ **should mark optional fields**: Confirms optional fields show "(optional)" label

### 2. Form Interaction (5 tests)

Tests user interactions with form controls.

- ✅ **should allow selecting different analysis depths**: Tests select between "compact" and "full"

- ✅ **should allow selecting different domains**: Tests switching between:

  - universal
  - technical
  - nonTechnical

- ✅ **should allow selecting different experience levels**: Tests options:

  - Entry Level
  - Mid Level
  - Senior Level

- ✅ **should allow typing in text inputs**: Tests user input in:

  - Target Role
  - Target Company
  - Geographic Focus

- ✅ **should allow typing in textarea**: Tests Special Focus textarea input

### 3. Form Validation (2 tests)

Tests form validation and error handling.

- ✅ **should show validation error for empty required fields**: Verifies required field presence

- ✅ **should accept valid form data**: Tests valid data entry

### 4. State Management (3 tests)

Tests integration with Zustand store.

- ✅ **should update store when form values change**: Verifies `setFormData` is called on changes

- ✅ **should initialize with formData from store**: Tests loading saved form data

- ✅ **should prioritize defaultValues over store formData**: Validates precedence:
  1. defaultValues prop (highest priority)
  2. Store formData
  3. Component defaults (lowest priority)

### 5. Accessibility (3 tests)

Tests accessibility features and WCAG compliance.

- ✅ **should have proper label associations**: Verifies all inputs have proper `id` and `for` attributes

- ✅ **should have proper placeholder text**: Tests descriptive placeholders for all inputs

- ✅ **should have textareas with resize capability**: Validates textarea configuration

### 6. Edge Cases (5 tests)

Tests edge cases and error scenarios.

- ✅ **should handle rapid form changes**: Tests rapid typing without errors

- ✅ **should handle form clear and re-entry**: Tests clearing and re-entering data

- ✅ **should handle special characters in inputs**: Tests:

  - Special characters: @, ++, etc.
  - Multi-line text with newlines

- ✅ **should not break with null defaultValues**: Tests undefined props handling

- ✅ **should handle empty string values gracefully**: Tests whitespace-only input

### 7. Select Options (3 tests)

Tests dropdown option correctness.

- ✅ **should have correct analysis depth options**: ["compact", "full"]

- ✅ **should have correct domain options**: ["universal", "technical", "nonTechnical"]

- ✅ **should have correct experience level options**: ["Entry", "Mid", "Senior"]

## Testing Infrastructure

### Test Framework

- **Vitest**: Fast, modern testing framework for Vite projects
- **React Testing Library**: User-centric testing utilities
- **@testing-library/user-event**: Realistic user interaction simulation
- **@testing-library/jest-dom**: Custom matchers for DOM testing

### Configuration Files

- `vitest.config.ts`: Vitest configuration with jsdom environment
- `src/test/setup.ts`: Global test setup with cleanup utilities

### Mock Strategy

The tests mock the `useAppState` Zustand store to:

- Isolate component testing
- Control store state
- Verify store interactions

## Running Tests

```bash
# Run all tests once
npm test -- --run

# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Patterns Used

### 1. Arrange-Act-Assert (AAA)

Every test follows the AAA pattern:

```typescript
it("should do something", async () => {
  // Arrange: Set up test data and render component
  const user = userEvent.setup();
  render(<PromptConfigForm onSubmit={mockOnSubmit} />);

  // Act: Perform user action
  await user.type(screen.getByLabelText(/target role/i), "Engineer");

  // Assert: Verify expected outcome
  expect(screen.getByLabelText(/target role/i)).toHaveValue("Engineer");
});
```

### 2. User-Centric Queries

Tests use queries that reflect how users interact:

- `getByLabelText()`: Find by label (accessible)
- `getByPlaceholderText()`: Find by placeholder
- `getByRole()`: Find by ARIA role
- Case-insensitive regex matching

### 3. Async User Events

All user interactions use `@testing-library/user-event` for realistic behavior:

```typescript
await user.type(input, "text");
await user.selectOptions(select, "option");
await user.clear(input);
```

## Code Coverage

The test suite covers:

- ✅ All render paths
- ✅ All user interactions
- ✅ State management hooks
- ✅ Form validation logic
- ✅ Default value handling
- ✅ Optional/required fields
- ✅ Edge cases and error scenarios

## Best Practices Demonstrated

1. **Accessibility Testing**: Uses semantic queries (`getByLabelText`)
2. **Isolation**: Mocks external dependencies (store)
3. **Realistic Interactions**: Uses user-event library
4. **Clear Descriptions**: Descriptive test names
5. **Cleanup**: Automatic cleanup after each test
6. **Type Safety**: Full TypeScript support

## Maintenance Notes

### When to Update Tests

Update tests when:

- Adding new form fields
- Changing validation rules
- Modifying default values
- Updating select options
- Changing required/optional field status

### Common Pitfalls

1. **Async Operations**: Always `await` user events
2. **Query Priority**: Use accessible queries first
3. **State Updates**: Use `waitFor()` for async state changes
4. **Cleanup**: Tests auto-cleanup, but custom timers need manual cleanup

## Future Enhancements

Potential test additions:

- [ ] Integration tests with real store
- [ ] E2E tests with form submission
- [ ] Visual regression tests
- [ ] Performance benchmarks
- [ ] Error boundary integration tests
