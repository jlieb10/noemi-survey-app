/**
 * Test setup configuration for Vitest.
 * 
 * This file is automatically loaded before all tests and configures:
 * - Testing Library matchers
 * - Global test utilities
 * - Mock configurations
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Extend expect with Testing Library matchers
// This allows us to use assertions like expect(element).toBeInTheDocument()

// Mock window.matchMedia for tests that use responsive design
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for components that observe element size changes
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver for components that use intersection detection
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));