# Testing Guidelines for NOEMI Survey App

## Overview

This document outlines testing requirements and best practices for the NOEMI Survey App. **ALL CODE CHANGES MUST INCLUDE CORRESPONDING TESTS.**

Since this application prioritizes user interaction and luxury experience, every touchpoint must be comprehensively tested to ensure reliability and premium feel.

## Core Testing Philosophy

**Every interaction matters.** This app is designed for user engagement, so all interactions require testing:

- Button clicks and form submissions
- Swipe gestures and touch interactions
- Keyboard navigation and accessibility
- Loading states and error scenarios
- Visual consistency and responsiveness

## Testing Strategy

### 1. Unit Tests (Required for All Code)

- **Location**: `src/**/*.test.{js,jsx}`
- **Framework**: Vitest + Testing Library
- **Coverage**: 100% of functions, components, and utilities

#### Required Test Coverage:

- ✅ All utility functions (`src/utils/`)
- ✅ All service modules (`src/services/`)
- ✅ All custom hooks (`src/hooks/`)
- ✅ All React components (`src/components/`)
- ✅ Edge cases and error scenarios

#### Writing Unit Tests:

```javascript
/**
 * Unit tests for [ComponentName/ModuleName].
 *
 * When modifying this code, ensure:
 * 1. All test cases continue to pass
 * 2. New functionality includes corresponding tests
 * 3. Edge cases and error scenarios are covered
 * 4. Accessibility requirements are tested
 *
 * @testSuite [category/ComponentName]
 */
```

### 2. Visual Regression Tests (Required for UI Changes)

- **Location**: `e2e/visual-regression.spec.js`
- **Framework**: Playwright
- **Purpose**: Detect unintended visual changes

#### Visual Testing Workflow:

1. Make UI changes
2. Run `pnpm test:e2e --update-snapshots` to update baseline images
3. Commit new snapshots with your changes
4. CI will verify visual consistency on PRs

### 3. End-to-End Tests (Required for User Flows)

- **Location**: `e2e/*.spec.js`
- **Framework**: Playwright
- **Coverage**: Critical user journeys

## Testing Commands

```bash
# Run all unit tests
pnpm run test

# Run tests in watch mode
pnpm run test --watch

# Run tests with coverage
pnpm run test --coverage

# Run e2e tests
pnpm run test:e2e

# Update visual snapshots
pnpm run test:e2e --update-snapshots

# Run linting
pnpm run lint
```

## Pre-Commit Requirements

Before committing ANY code:

1. ✅ `pnpm run lint` - Must pass with no errors
2. ✅ `pnpm run test` - All unit tests must pass
3. ✅ `pnpm run test:e2e` - All e2e tests must pass
4. ✅ New code includes tests
5. ✅ Modified code updates existing tests

## Testing Best Practices

### Unit Tests

- **Test behavior, not implementation**
- **Use descriptive test names**: `should handle user input validation when email is invalid`
- **Mock external dependencies** (APIs, services, etc.)
- **Test edge cases**: empty inputs, error states, loading states
- **Verify accessibility**: ARIA labels, keyboard navigation

### Visual Tests

- **Disable animations**: `animations: 'disabled'`
- **Use consistent viewports**: 1280x720 for desktop, 393x851 for mobile
- **Test key states**: loading, error, success, empty states
- **Test across browsers**: Chrome, Safari, mobile

### E2E Tests

- **Focus on user journeys**: complete survey flow, game interaction
- **Use page object pattern** for complex interactions
- **Test responsive design** on different screen sizes
- **Verify real integrations** (with proper test data)

## Code Quality Standards

### Test-Driven Development

1. **Write failing test first**
2. **Write minimal code to pass**
3. **Refactor while keeping tests green**

### Test Coverage Requirements

- **Functions**: 100% statement coverage
- **Components**: All props, states, and interactions
- **Error handling**: All catch blocks and error states
- **Accessibility**: Screen reader compatibility

## Copilot Integration

When using GitHub Copilot or AI assistance:

### ✅ Always Include Tests

- Request test generation with any code suggestion
- Verify AI-generated tests actually test the intended behavior
- Add edge cases that AI might miss

### ✅ Test-First Approach

```javascript
// ❌ Don't do this
function addNumbers(a, b) {
  return a + b; // No tests yet!
}

// ✅ Do this
describe('addNumbers', () => {
  it('should add two positive numbers', () => {
    expect(addNumbers(2, 3)).toBe(5);
  });

  it('should handle negative numbers', () => {
    expect(addNumbers(-1, 5)).toBe(4);
  });
});

function addNumbers(a, b) {
  return a + b; // Now with tests!
}
```

### ✅ Update Tests When Modifying Code

- Change component behavior? Update component tests
- Add new props? Test the new props
- Modify utility function? Update utility tests

## CI/CD Integration

### GitHub Actions Workflow

The CI pipeline runs:

1. **Lint check** - Code style validation
2. **Type check** - TypeScript validation
3. **Unit tests** - All jest/vitest tests
4. **Build verification** - Ensure app builds successfully
5. **E2E tests** - Playwright test suite
6. **Visual regression** - Screenshot comparison

### Required Checks

All PRs must pass:

- ✅ Lint
- ✅ Type check
- ✅ Unit tests (98%+ coverage)
- ✅ Build success
- ✅ E2E tests
- ✅ Visual regression tests

## Test Data Management

### Mock Data

- Store in `src/__mocks__/` or `e2e/fixtures/`
- Use realistic but fake data
- Keep consistent across tests

### Environment Variables

```bash
# Test environment
VITE_SUPABASE_URL=https://test.supabase.co
VITE_SUPABASE_ANON_KEY=test-key
```

## CI-Safe Testing Guidelines

### Environment Considerations

- Tests must run in headless CI environments
- No external dependencies during test execution
- Mock all external services and APIs
- Handle browser compatibility in test environment

### Performance in CI

- Keep test execution under 10 minutes total
- Use appropriate timeouts and waits
- Parallel test execution where possible
- Efficient test data setup and teardown

### Reliability Standards

- Tests must be deterministic (no flaky tests)
- Proper cleanup after each test
- Isolated test environments
- Clear error messages for debugging

## Test-Driven Development Workflow

### For New Features:

1. **Write failing test first** (TDD approach)
2. **Implement minimal code to pass**
3. **Refactor while keeping tests green**
4. **Add edge case tests**
5. **Verify accessibility and performance**

### For Bug Fixes:

1. **Write test that reproduces the bug**
2. **Verify the test fails**
3. **Fix the bug**
4. **Verify the test passes**
5. **Add related edge case tests**

## Debugging Tests

### Common Issues

```bash
# Tests failing locally but passing in CI
pnpm run test --run # Run once instead of watch mode

# Visual tests failing
pnpm run test:e2e --update-snapshots # Update baselines

# Flaky tests
# Add proper waits, mock timers, stabilize conditions
```

### Debug Commands

```bash
# Debug mode
pnpm run test --inspect-brk

# Headed browser for e2e
pnpm run test:e2e --headed

# Trace mode
pnpm run test:e2e --trace on
```

## Conclusion

**Testing is not optional.** Every line of code should be covered by tests. This ensures:

- ✅ **Reliability**: Catch bugs before production
- ✅ **Maintainability**: Safe refactoring with confidence
- ✅ **Documentation**: Tests serve as usage examples
- ✅ **Quality**: High-quality, robust codebase

When in doubt, write more tests, not fewer. The test suite is the safety net that allows for confident development and iteration.
