/**
 * Unit tests for common utility functions.
 * 
 * These tests ensure all utility functions behave correctly under various conditions,
 * including edge cases and error scenarios. When modifying utility functions,
 * always update corresponding tests to maintain coverage.
 * 
 * @testSuite utils/common
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getStorageItem,
  setStorageItem,
  getUrlParam,
  hasUrlParam,
  delay,
  generateTempId,
  handleImageError
} from './common.js';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

describe('getStorageItem', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    localStorageMock.clear();
  });

  it('should return stored value when key exists', () => {
    localStorageMock.setItem('test-key', 'test-value');
    expect(getStorageItem('test-key')).toBe('test-value');
  });

  it('should return fallback when key does not exist', () => {
    expect(getStorageItem('nonexistent-key', 'fallback')).toBe('fallback');
  });

  it('should return null fallback by default', () => {
    expect(getStorageItem('nonexistent-key')).toBe(null);
  });

  it('should handle localStorage errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error('Storage access denied');
    });

    expect(getStorageItem('test-key', 'fallback')).toBe('fallback');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to read from localStorage key "test-key":',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should return fallback in server environment', () => {
    delete global.window;
    expect(getStorageItem('test-key', 'fallback')).toBe('fallback');
    
    // Restore window for other tests
    global.window = global;
  });
});

describe('setStorageItem', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    localStorageMock.clear();
  });

  it('should set value in localStorage successfully', () => {
    const result = setStorageItem('test-key', 'test-value');
    
    expect(result).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', 'test-value');
  });

  it('should handle localStorage errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('Storage quota exceeded');
    });

    const result = setStorageItem('test-key', 'test-value');
    
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to write to localStorage key "test-key":',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should return false in server environment', () => {
    delete global.window;
    expect(setStorageItem('test-key', 'test-value')).toBe(false);
    
    // Restore window for other tests
    global.window = global;
  });
});

describe('getUrlParam', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true
    });
  });

  it('should return URL parameter value when it exists', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?param1=value1&param2=value2' },
      writable: true
    });

    expect(getUrlParam('param1')).toBe('value1');
    expect(getUrlParam('param2')).toBe('value2');
  });

  it('should return fallback when parameter does not exist', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?param1=value1' },
      writable: true
    });

    expect(getUrlParam('nonexistent', 'fallback')).toBe('fallback');
  });

  it('should return null fallback by default', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?param1=value1' },
      writable: true
    });

    expect(getUrlParam('nonexistent')).toBe(null);
  });

  it('should handle empty search string', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true
    });

    expect(getUrlParam('param1', 'fallback')).toBe('fallback');
  });

  it('should handle URLSearchParams errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Mock URLSearchParams to throw error
    const originalURLSearchParams = global.URLSearchParams;
    global.URLSearchParams = vi.fn(() => {
      throw new Error('URLSearchParams error');
    });

    expect(getUrlParam('param1', 'fallback')).toBe('fallback');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to read URL parameter "param1":',
      expect.any(Error)
    );

    global.URLSearchParams = originalURLSearchParams;
    consoleSpy.mockRestore();
  });

  it('should return fallback in server environment', () => {
    delete global.window;
    expect(getUrlParam('param1', 'fallback')).toBe('fallback');
    
    // Restore window for other tests
    global.window = global;
  });
});

describe('hasUrlParam', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true
    });
  });

  it('should return true when parameter matches expected value', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?mode=dev&debug=true' },
      writable: true
    });

    expect(hasUrlParam('mode', 'dev')).toBe(true);
    expect(hasUrlParam('debug', 'true')).toBe(true);
  });

  it('should return false when parameter does not match expected value', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?mode=prod&debug=false' },
      writable: true
    });

    expect(hasUrlParam('mode', 'dev')).toBe(false);
    expect(hasUrlParam('debug', 'true')).toBe(false);
  });

  it('should return false when parameter does not exist', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?mode=dev' },
      writable: true
    });

    expect(hasUrlParam('nonexistent', 'value')).toBe(false);
  });
});

describe('delay', () => {
  it('should resolve after specified milliseconds', async () => {
    const start = Date.now();
    await delay(100);
    const end = Date.now();
    
    // Allow some variance for execution time
    expect(end - start).toBeGreaterThanOrEqual(95);
    expect(end - start).toBeLessThan(150);
  });

  it('should resolve immediately for 0 milliseconds', async () => {
    const start = Date.now();
    await delay(0);
    const end = Date.now();
    
    expect(end - start).toBeLessThan(10);
  });

  it('should return a promise', () => {
    const result = delay(10);
    expect(result).toBeInstanceOf(Promise);
  });
});

describe('generateTempId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateTempId();
    const id2 = generateTempId();
    
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
  });

  it('should generate IDs with expected format', () => {
    const id = generateTempId();
    
    // Should be timestamp-randomstring format
    expect(id).toMatch(/^\d+-[a-z0-9]+$/);
  });

  it('should generate IDs with consistent length patterns', () => {
    const ids = Array.from({ length: 10 }, () => generateTempId());
    
    ids.forEach(id => {
      const parts = id.split('-');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toMatch(/^\d+$/); // timestamp
      expect(parts[1]).toMatch(/^[a-z0-9]+$/); // random string
    });
  });
});

describe('handleImageError', () => {
  it('should set fallback source when current source is different', () => {
    const mockEvent = {
      currentTarget: {
        src: 'original-image.jpg'
      }
    };

    handleImageError(mockEvent, 'fallback.jpg');
    
    expect(mockEvent.currentTarget.src).toBe('fallback.jpg');
  });

  it('should not change source when already using fallback', () => {
    const mockEvent = {
      currentTarget: {
        src: 'fallback.jpg'
      }
    };

    handleImageError(mockEvent, 'fallback.jpg');
    
    expect(mockEvent.currentTarget.src).toBe('fallback.jpg');
  });

  it('should handle missing currentTarget gracefully', () => {
    const mockEvent = {};
    
    expect(() => {
      handleImageError(mockEvent, 'fallback.jpg');
    }).not.toThrow();
  });

  it('should handle null event gracefully', () => {
    expect(() => {
      handleImageError(null, 'fallback.jpg');
    }).not.toThrow();
  });
});