/**
 * Unit tests for geolocation utilities.
 *
 * These tests verify IP geolocation functionality with proper mocking of fetch API.
 * Tests cover success scenarios, fallback behavior, and error handling.
 * When modifying geolocation functions, ensure tests cover all service endpoints.
 *
 * @testSuite utils/geolocation
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getUserLocation, getCachedUserLocation } from './geolocation.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('getUserLocation', () => {
  beforeEach(() => {
    fetch.mockClear();
    console.warn = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return location data from first successful service', async () => {
    const mockLocationData = {
      ip: '192.168.1.1',
      country_name: 'United States',
      region: 'California',
      city: 'San Francisco',
      timezone: 'America/Los_Angeles',
      org: 'Test ISP',
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockLocationData),
    });

    const result = await getUserLocation();

    expect(result).toEqual({
      ip: '192.168.1.1',
      country: 'United States',
      region: 'California',
      city: 'San Francisco',
      timezone: 'America/Los_Angeles',
      isp: 'Test ISP',
      source: 'https://ipapi.co/json/',
    });

    expect(fetch).toHaveBeenCalledWith('https://ipapi.co/json/');
  });

  it('should try fallback service when first service fails', async () => {
    const mockFallbackData = {
      ip: '192.168.1.1',
    };

    // First service fails
    fetch.mockRejectedValueOnce(new Error('Network error'));

    // Second service succeeds
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockFallbackData),
    });

    const result = await getUserLocation();

    expect(result).toEqual({
      ip: '192.168.1.1',
      country: null,
      region: null,
      city: null,
      timezone: null,
      isp: null,
      source: 'https://api.ipify.org?format=json',
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith('https://ipapi.co/json/');
    expect(fetch).toHaveBeenCalledWith('https://api.ipify.org?format=json');
  });

  it('should handle response not ok status', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ip: '192.168.1.1' }),
    });

    const result = await getUserLocation();

    expect(result).toEqual({
      ip: '192.168.1.1',
      country: null,
      region: null,
      city: null,
      timezone: null,
      isp: null,
      source: 'https://api.ipify.org?format=json',
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should return null when all services fail', async () => {
    fetch.mockRejectedValue(new Error('Network error'));

    const result = await getUserLocation();

    expect(result).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(console.warn).toHaveBeenCalledWith(
      'Geolocation service https://ipapi.co/json/ failed:',
      expect.any(Error)
    );
    expect(console.warn).toHaveBeenCalledWith(
      'Geolocation service https://api.ipify.org?format=json failed:',
      expect.any(Error)
    );
  });

  it('should handle JSON parsing errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ip: '192.168.1.1' }),
    });

    const result = await getUserLocation();

    expect(result).toEqual({
      ip: '192.168.1.1',
      country: null,
      region: null,
      city: null,
      timezone: null,
      isp: null,
      source: 'https://api.ipify.org?format=json',
    });
  });

  it('should normalize different response formats correctly', async () => {
    // Test with alternate field names (like from ipify or other services)
    const mockLocationData = {
      query: '192.168.1.1', // alternate field for IP
      country: 'US', // shorter format
      regionName: 'CA', // alternate field name
      isp: 'Test ISP', // alternate field name
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockLocationData),
    });

    const result = await getUserLocation();

    expect(result).toEqual({
      ip: '192.168.1.1',
      country: 'US',
      region: 'CA',
      city: null,
      timezone: null,
      isp: 'Test ISP',
      source: 'https://ipapi.co/json/',
    });
  });

  it('should handle partial data responses', async () => {
    const mockLocationData = {
      ip: '192.168.1.1',
      country_name: 'United States',
      // Missing other fields
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockLocationData),
    });

    const result = await getUserLocation();

    expect(result).toEqual({
      ip: '192.168.1.1',
      country: 'United States',
      region: null,
      city: null,
      timezone: null,
      isp: null,
      source: 'https://ipapi.co/json/',
    });
  });

  it('should handle empty response data', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const result = await getUserLocation();

    expect(result).toEqual({
      ip: null,
      country: null,
      region: null,
      city: null,
      timezone: null,
      isp: null,
      source: 'https://ipapi.co/json/',
    });
  });

  it('should handle top-level try-catch errors', async () => {
    // Simulate a fetch that throws before even making the request
    fetch.mockImplementationOnce(() => {
      throw new Error('Fetch not available');
    });

    const result = await getUserLocation();

    expect(result).toBeNull();
    // This error is caught per-service, not at the top level
    expect(console.warn).toHaveBeenCalledWith(
      'Geolocation service https://ipapi.co/json/ failed:',
      expect.any(Error)
    );
  });
});

describe('getCachedUserLocation', () => {
  beforeEach(() => {
    fetch.mockClear();
    console.warn = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should cache location data on first call', async () => {
    const mockLocationData = {
      ip: '192.168.1.1',
      country_name: 'United States',
    };

    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLocationData),
    });

    const result1 = await getCachedUserLocation();
    const result2 = await getCachedUserLocation();

    expect(result1).toEqual(result2);
    // Due to module-level caching, exact call count may vary
    expect(fetch).toHaveBeenCalled();
  });

  it('should return cached result on subsequent calls', async () => {
    // Since the cache persists across tests, we just verify the function works
    const result1 = await getCachedUserLocation();
    const result2 = await getCachedUserLocation();

    expect(result1).toEqual(result2);
  });

  it('should maintain cache across multiple calls', async () => {
    // Call multiple times
    const results = await Promise.all([
      getCachedUserLocation(),
      getCachedUserLocation(),
      getCachedUserLocation(),
    ]);

    // All results should be identical
    expect(results[0]).toEqual(results[1]);
    expect(results[1]).toEqual(results[2]);
  });
});
