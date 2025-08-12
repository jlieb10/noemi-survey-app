/**
 * Utility functions for common operations throughout the application.
 */

/**
 * Safely get a value from localStorage with fallback.
 * @param {string} key - The localStorage key
 * @param {string|null} fallback - Fallback value if key doesn't exist
 * @returns {string|null} The stored value or fallback
 */
export function getStorageItem(key, fallback = null) {
  if (typeof window === 'undefined') return fallback;
  try {
    return localStorage.getItem(key) || fallback;
  } catch (error) {
    console.warn(`Failed to read from localStorage key "${key}":`, error);
    return fallback;
  }
}

/**
 * Safely set a value in localStorage.
 * @param {string} key - The localStorage key
 * @param {string} value - The value to store
 * @returns {boolean} True if successful, false otherwise
 */
export function setStorageItem(key, value) {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to write to localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Get URL parameter value with optional fallback.
 * @param {string} paramName - The URL parameter name
 * @param {string|null} fallback - Fallback value if parameter doesn't exist
 * @returns {string|null} The parameter value or fallback
 */
export function getUrlParam(paramName, fallback = null) {
  if (typeof window === 'undefined') return fallback;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName) || fallback;
  } catch (error) {
    console.warn(`Failed to read URL parameter "${paramName}":`, error);
    return fallback;
  }
}

/**
 * Check if a URL parameter has a specific value.
 * @param {string} paramName - The URL parameter name
 * @param {string} expectedValue - The expected value
 * @returns {boolean} True if parameter matches expected value
 */
export function hasUrlParam(paramName, expectedValue) {
  return getUrlParam(paramName) === expectedValue;
}

/**
 * Create a delay promise for async operations.
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>} Promise that resolves after the delay
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a unique ID for temporary use (not cryptographically secure).
 * @returns {string} A unique identifier based on timestamp and random number
 */
export function generateTempId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Safely handle image loading errors with fallback.
 * @param {Event} event - The error event from img onError
 * @param {string} fallbackSrc - The fallback image source
 */
export function handleImageError(event, fallbackSrc) {
  if (event.currentTarget && event.currentTarget.src !== fallbackSrc) {
    event.currentTarget.src = fallbackSrc;
  }
}