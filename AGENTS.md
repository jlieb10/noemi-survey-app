# AGENTS

## Core Principles

**UI/UX are top priorities.** This application is designed for interaction, so every user touchpoint must be tested and optimized for a luxury experience. Code must be modular, robust, and easily navigable by both humans and GitHub Copilot.

## Code Style & Architecture

### Structural Guidelines

- Use 2 spaces for indentation
- Prefer functional React components with hooks
- Organize code in logical, self-contained modules
- Use consistent naming conventions (camelCase for functions, PascalCase for components)
- Maintain clear separation of concerns (components, hooks, services, utils)

### Copilot-Friendly Patterns

- Write descriptive function and variable names
- Use JSDoc comments for complex functions
- Maintain consistent directory structure
- Keep files focused on single responsibilities
- Use predictable import/export patterns

## Testing Requirements (CRITICAL)

**⚠️ ALL CODE CHANGES MUST INCLUDE CORRESPONDING TESTS ⚠️**

### When making ANY code change:

1. ✅ **Add unit tests** for new functions/components
2. ✅ **Update existing tests** when modifying code
3. ✅ **Test edge cases** and error scenarios
4. ✅ **Verify accessibility** in component tests
5. ✅ **Run full test suite** before committing

### Test Files Required:

- `*.test.js` for utilities and services
- `*.test.jsx` for React components
- Visual regression tests for UI changes
- E2E tests for user flow changes

### Testing Commands:

```bash
pnpm run test          # Unit tests (must pass)
pnpm run test:e2e      # E2E tests (must pass)
pnpm run lint          # Code style (must pass)
```

See [TESTING.md](./TESTING.md) for complete guidelines.

## Development Environment

This repository uses [Vite](https://vitejs.dev) with React for a survey application.
Follow these guidelines when contributing code.

### Environment

- Use **Node.js v20.11.1** and **pnpm v8.10.5**.
- Install dependencies with `pnpm install`.

### Development

- Start the development server with `pnpm run dev`.
- Source files live in the `src/` directory; end-to-end tests are in `e2e/`.

### Code style

- Use modern ES modules (`import`/`export`) and React functional components.
- Indent with 2 spaces and terminate statements with semicolons.
- Add concise [JSDoc](https://jsdoc.app) comments for functions and components.

### Verification

Run these commands before submitting changes:

```bash
pnpm run lint     # Code style and quality
pnpm run test     # Unit tests with coverage
pnpm run test:e2e # End-to-end tests
```

**ALL THREE COMMANDS MUST SUCCEED** before commit.

## Testing Philosophy

### Test-Driven Development

1. **Write failing test first** ✅
2. **Write minimal code to pass** ✅
3. **Refactor while keeping tests green** ✅

### Coverage Requirements

- **Functions**: 100% statement coverage
- **Components**: All props, states, interactions
- **Error handling**: All catch blocks
- **Accessibility**: Screen reader compatibility

## Pull Request Acceptance Criteria

Pull requests are accepted **only** when they include:

- ✅ **Comprehensive unit tests** for all new or changed code
- ✅ **Component interaction tests** for any user-facing functionality
- ✅ **Accessibility verification** (keyboard navigation, screen readers)
- ✅ **End-to-end tests** for user journey changes
- ✅ **Visual regression tests** for UI modifications
- ✅ **Error handling tests** for edge cases and failures
- ✅ **Performance considerations** (image optimization, bundle size)
- ✅ **Passing CI results**: `pnpm run lint && pnpm run test && pnpm run build`
- ✅ **Code review approval** with focus on maintainability and luxury UX
- ✅ **Documentation updates** when architectural changes are made

### Luxury UX Requirements

- All interactions must feel instant and responsive
- Error states must be gracefully handled with user-friendly messages
- Loading states must be smooth with appropriate feedback
- Accessibility must be seamless across all features
- Visual consistency must be maintained across components

## Commit messages

- Write commits in the imperative mood: "Add feature" not "Added feature".
- Reference issue numbers when relevant.
- Include test updates in commit descriptions.

## AI/Copilot Guidelines

When using GitHub Copilot or AI assistance:

### ✅ Always Include Tests

```javascript
// ❌ Don't do this
function validateEmail(email) {
  return email.includes('@'); // No tests!
}

// ✅ Do this
describe('validateEmail', () => {
  it('should return true for valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('should return false for invalid email', () => {
    expect(validateEmail('invalid')).toBe(false);
  });
});

function validateEmail(email) {
  return email.includes('@'); // Now with tests!
}
```

### ✅ Test-First Approach

1. Ask AI to generate tests along with code
2. Verify tests actually test the intended behavior
3. Add edge cases that AI might miss
4. Update existing tests when modifying code

### ✅ Quality Checklist

Before accepting any AI-generated code:

- [ ] Does it include comprehensive tests?
- [ ] Are edge cases covered?
- [ ] Is accessibility tested?
- [ ] Do all tests pass?
- [ ] Is the code maintainable?

**Remember: Tests are not optional. They're the foundation of a reliable codebase.**

tests actually test the intended behavior  
3. Add edge cases that AI might miss 4. Update existing tests when modifying code

### ✅ Quality Checklist

Before accepting any AI-generated code:

- [ ] Does it include comprehensive tests?
- [ ] Are edge cases covered?
- [ ] Is accessibility tested?
- [ ] Do all tests pass?
- [ ] Is the code maintainable?

**Remember: Tests are not optional. They're the foundation of a reliable codebase.**
