# Contributing to NOEMI Survey App

Thank you for contributing to the NOEMI Survey App! This document provides guidelines for contributing to this luxury survey application with a focus on user experience and code quality.

## Getting Started

### Prerequisites

- Node.js v20.11.1
- pnpm v8.10.5
- Basic knowledge of React, TypeScript, and testing

### Setup

1. Fork and clone the repository
2. Install dependencies: `pnpm install`
3. Create environment variables: Copy `.env.example` to `.env` and fill in values
4. Run tests to verify setup: `pnpm run test && pnpm run lint`
5. Start development server: `pnpm run dev`

## Development Principles

### User Experience First

This application prioritizes **luxury user experience** above all else:

- Every interaction must feel instant and responsive
- All UI changes require visual regression tests
- Accessibility is mandatory, not optional
- Error states must be gracefully handled
- Loading states must provide appropriate feedback

### Code Quality Standards

- **Modular Architecture**: Components should be self-contained and reusable
- **Robust Error Handling**: Graceful degradation when things go wrong
- **Comprehensive Testing**: Every interaction must be tested
- **Performance Conscious**: Optimize for user experience
- **Copilot-Friendly**: Clear patterns and consistent structure

## Pull Request Process

### Before Creating a PR

1. **Write tests first** (Test-Driven Development)
2. **Ensure all interactions are tested**
3. **Verify accessibility compliance**
4. **Run full test suite**: `pnpm run lint && pnpm run test && pnpm run build`
5. **Test manually** in development mode

### PR Requirements Checklist

- [ ] **Unit tests** for all new functions and components
- [ ] **Component interaction tests** for user-facing changes
- [ ] **Accessibility tests** for keyboard and screen reader support
- [ ] **Integration tests** for cross-component workflows
- [ ] **E2E tests** for user journey changes
- [ ] **Visual regression tests** for UI modifications
- [ ] **Error handling tests** for edge cases
- [ ] **Performance considerations** documented
- [ ] **All CI checks passing**
- [ ] **Code review approval**
- [ ] **Documentation updates** when relevant

### Code Review Criteria

Reviewers will evaluate:

- **User Experience**: Does this maintain the luxury feel?
- **Test Coverage**: Are all interactions properly tested?
- **Code Quality**: Is the code modular, readable, and maintainable?
- **Accessibility**: Can all users interact with these changes?
- **Performance**: Does this impact loading times or responsiveness?
- **Error Handling**: What happens when things go wrong?

## Testing Requirements

### Mandatory Testing for ALL Changes

Since this app is interaction-focused, every change requires comprehensive testing:

#### Component Changes

- Test all props and their variations
- Test all user interactions (clicks, form inputs, swipes)
- Test all states and state transitions
- Test error scenarios and edge cases
- Test accessibility features (keyboard navigation, screen readers)

#### Utility Function Changes

- Test with various input types
- Test edge cases and boundary conditions
- Test error scenarios
- Achieve 100% statement coverage

#### UI/Visual Changes

- Include visual regression tests
- Test responsive behavior
- Test accessibility compliance
- Test performance impact

### Testing Commands

```bash
# Run all tests
pnpm run test

# Run with coverage
pnpm run test --coverage

# Run E2E tests
pnpm run test:e2e

# Update visual regression baselines
pnpm run test:e2e --update-snapshots

# Lint code
pnpm run lint
```

## Code Style Guidelines

### React Component Patterns

```javascript
// ✅ Good: Robust, testable, accessible
export function UserCard({ user, onSelect, className = '' }) {
  const handleClick = useCallback(() => {
    try {
      onSelect?.(user);
    } catch (error) {
      console.error('Failed to select user:', error);
    }
  }, [user, onSelect]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  if (!user) {
    return (
      <div
        className="user-card user-card--empty"
        aria-label="No user data available"
      >
        No user selected
      </div>
    );
  }

  return (
    <div
      className={`user-card ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Select ${user.name}`}
    >
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}

// ❌ Bad: Fragile, untestable, inaccessible
export function UserCard({ user, onSelect }) {
  return <div onClick={() => onSelect(user)}>{user.name}</div>;
}
```

### Error Handling Patterns

```javascript
// ✅ Good: Graceful error handling
export function useImagePreloader(urls) {
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [failedImages, setFailedImages] = useState(new Set());

  useEffect(() => {
    urls.forEach((url) => {
      const img = new Image();
      img.onload = () => setLoadedImages((prev) => new Set([...prev, url]));
      img.onerror = () => {
        console.warn('Failed to preload image:', url);
        setFailedImages((prev) => new Set([...prev, url]));
      };
      img.src = url;
    });
  }, [urls]);

  return { loadedImages, failedImages };
}

// ❌ Bad: No error handling
export function useImagePreloader(urls) {
  useEffect(() => {
    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [urls]);
}
```

## Architecture Guidelines

### Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── ComponentName/
│   │   ├── index.jsx
│   │   ├── ComponentName.test.jsx
│   │   ├── ComponentName.accessibility.test.jsx
│   │   └── ComponentName.css
├── hooks/              # Custom React hooks
├── services/           # External service integrations
├── utils/              # Pure utility functions
├── styles/             # Shared styles and design tokens
└── constants.js        # Application constants
```

### Component Design Principles

- **Single Responsibility**: Each component should have one clear purpose
- **Composition Over Inheritance**: Build complex UIs from simple components
- **Props Interface**: Clear, documented props with sensible defaults
- **Error Boundaries**: Handle errors gracefully without crashing
- **Performance**: Optimize for user experience (memoization, lazy loading)

## Accessibility Requirements

### Mandatory Accessibility Features

- **Semantic HTML**: Use proper HTML elements and roles
- **ARIA Labels**: Provide descriptive labels for screen readers
- **Keyboard Navigation**: All interactions must be keyboard accessible
- **Focus Management**: Visible focus indicators and logical tab order
- **Color Contrast**: Meet WCAG 2.1 AA standards
- **Responsive Design**: Work on all device sizes

### Testing Accessibility

```javascript
// Test keyboard navigation
it('should be keyboard accessible', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);

  await user.tab();
  expect(screen.getByRole('button')).toHaveFocus();

  await user.keyboard('{Enter}');
  expect(mockHandler).toHaveBeenCalled();
});

// Test screen reader compatibility
it('should have proper ARIA labels', () => {
  render(<MyComponent />);

  expect(screen.getByRole('button')).toHaveAccessibleName('Submit form');
  expect(screen.getByRole('textbox')).toHaveAccessibleDescription(
    'Enter your email address'
  );
});
```

## Performance Guidelines

### Image Optimization

- Implement preloading for critical images
- Use appropriate image formats (WebP where supported)
- Provide alt text for all images
- Handle loading and error states

### Code Splitting

- Lazy load non-critical components
- Split large bundles into smaller chunks
- Monitor bundle size impact

### State Management

- Use React hooks appropriately
- Avoid unnecessary re-renders
- Implement proper cleanup in useEffect

## Getting Help

### Resources

- [AGENTS.md](./AGENTS.md) - Code style and agent guidelines
- [TESTING.md](./TESTING.md) - Comprehensive testing guide
- [docs/ui-style-guide.md](./docs/ui-style-guide.md) - UI design patterns

### Questions and Issues

- Check existing issues before creating new ones
- Provide detailed reproduction steps for bugs
- Include relevant code snippets and error messages
- Tag issues appropriately (bug, enhancement, question)

### Code Review Process

- All PRs require approval from maintainers
- Address feedback promptly and thoroughly
- Update tests when requested
- Be respectful and constructive in discussions

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.
