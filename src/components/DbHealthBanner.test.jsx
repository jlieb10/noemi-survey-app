/**
 * Tests for the DbHealthBanner component
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DbHealthBanner from './DbHealthBanner.jsx';

// Mock the Supabase client module
vi.mock('../services/supabaseClient.js', () => ({
  checkDbHealth: vi.fn(),
  generateDiagnostics: vi.fn(),
}));

describe('DbHealthBanner', () => {
  let mockCheckDbHealth;
  let mockGenerateDiagnostics;
  let mockClipboard;

  beforeEach(async () => {
    // Access mocked functions from the mocked module
    const supabaseClient = await import('../services/supabaseClient.js');
    mockCheckDbHealth = vi.mocked(supabaseClient.checkDbHealth);
    mockGenerateDiagnostics = vi.mocked(supabaseClient.generateDiagnostics);

    // Mock clipboard API
    mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };

    // Define clipboard property properly
    global.navigator = global.navigator || {};
    Object.defineProperty(global.navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true,
    });

    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    // Clean up clipboard mock
    if (global.navigator && global.navigator.clipboard) {
      delete global.navigator.clipboard;
    }
  });

  it('should not render when database is healthy', async () => {
    mockCheckDbHealth.mockResolvedValue({
      ok: true,
      timestamp: '2024-01-01T00:00:00.000Z',
    });

    render(<DbHealthBanner />);

    // Wait for health check to complete
    await waitFor(() => {
      expect(mockCheckDbHealth).toHaveBeenCalled();
    });

    // Banner should not be visible when DB is healthy
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should render banner when database health check fails', async () => {
    const mockError = {
      message: 'Invalid API key',
      hint: 'Double check your Supabase anon key',
    };

    mockCheckDbHealth.mockResolvedValue({
      ok: false,
      error: mockError,
      timestamp: '2024-01-01T00:00:00.000Z',
    });

    render(<DbHealthBanner />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText('Database Connection Issue')).toBeInTheDocument();
    expect(screen.getByText('Invalid API key')).toBeInTheDocument();
    expect(screen.getByText('Check Again')).toBeInTheDocument();
    expect(screen.getByText('Copy Info')).toBeInTheDocument();
  });

  it('should handle retry health check', async () => {
    const user = userEvent.setup();

    // Initial failed check
    mockCheckDbHealth.mockResolvedValueOnce({
      ok: false,
      error: { message: 'Connection failed' },
      timestamp: '2024-01-01T00:00:00.000Z',
    });

    // Successful retry
    mockCheckDbHealth.mockResolvedValueOnce({
      ok: true,
      timestamp: '2024-01-01T00:00:01.000Z',
    });

    render(<DbHealthBanner />);

    // Wait for initial failed check
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Click retry button
    const retryButton = screen.getByText('Check Again');
    await user.click(retryButton);

    // Banner should disappear after successful retry
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    expect(mockCheckDbHealth).toHaveBeenCalledTimes(2);
  });

  it('should copy diagnostics to clipboard', async () => {
    const user = userEvent.setup();
    const mockHealthResult = {
      ok: false,
      error: { message: 'Test error' },
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    const mockDiagnostics = 'DB_HEALTH_DIAGNOSTICS | {"error": "Test error"}';

    mockCheckDbHealth.mockResolvedValue(mockHealthResult);
    mockGenerateDiagnostics.mockReturnValue(mockDiagnostics);

    render(<DbHealthBanner />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    const copyButton = screen.getByText('Copy Info');
    await user.click(copyButton);

    // Check that generateDiagnostics was called
    expect(mockGenerateDiagnostics).toHaveBeenCalledWith(mockHealthResult);

    // Check for feedback text change to verify copy was attempted
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('should handle clipboard copy failure gracefully', async () => {
    const user = userEvent.setup();

    mockCheckDbHealth.mockResolvedValue({
      ok: false,
      error: { message: 'Test error' },
      timestamp: '2024-01-01T00:00:00.000Z',
    });

    mockClipboard.writeText.mockRejectedValue(
      new Error('Clipboard not available')
    );

    render(<DbHealthBanner />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    const copyButton = screen.getByText('Copy Info');
    await user.click(copyButton);

    // Should log error but not crash
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Failed to copy diagnostics:',
        expect.any(Error)
      );
    });
  });

  it('should dismiss banner when close button is clicked', async () => {
    const user = userEvent.setup();

    mockCheckDbHealth.mockResolvedValue({
      ok: false,
      error: { message: 'Connection failed' },
      timestamp: '2024-01-01T00:00:00.000Z',
    });

    render(<DbHealthBanner />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    const dismissButton = screen.getByLabelText('Dismiss banner');
    await user.click(dismissButton);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('should show loading state during health check', async () => {
    const user = userEvent.setup();

    // Slow health check response
    let resolveHealthCheck;
    const healthCheckPromise = new Promise((resolve) => {
      resolveHealthCheck = resolve;
    });

    mockCheckDbHealth.mockReturnValue(healthCheckPromise);

    render(<DbHealthBanner />);

    // Trigger manual health check
    await waitFor(() => {
      // Initial health check is called
      expect(mockCheckDbHealth).toHaveBeenCalledTimes(1);
    });

    // Resolve initial check with error to show banner
    resolveHealthCheck({
      ok: false,
      error: { message: 'Initial error' },
      timestamp: '2024-01-01T00:00:00.000Z',
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Mock another slow check for manual retry
    const retryPromise = new Promise(() => {}); // Never resolves
    mockCheckDbHealth.mockReturnValue(retryPromise);

    const retryButton = screen.getByText('Check Again');
    await user.click(retryButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('...')).toBeInTheDocument();
    });

    // Button should be disabled during loading
    expect(retryButton).toBeDisabled();
  });
});
