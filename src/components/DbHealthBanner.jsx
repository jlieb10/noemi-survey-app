/**
 * Database health monitoring banner component.
 * Shows a non-intrusive banner when database connectivity issues are detected.
 * Includes diagnostics copying functionality for easy bug reporting.
 *
 * @component
 */
import { useCallback, useEffect, useState } from 'react';
import {
  checkDbHealth,
  generateDiagnostics,
} from '../services/supabaseClient.js';
import './DbHealthBanner.css';

/**
 * Database health banner that appears when DB issues are detected
 * @returns {JSX.Element|null} Banner component or null if healthy
 */
export default function DbHealthBanner() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);

  /**
   * Perform database health check
   */
  const performHealthCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await checkDbHealth();
      setHealthStatus(result);
      setLastCheck(new Date());
      setIsVisible(!result.ok);

      if (!result.ok) {
        console.error('Database health check failed:', result.error);
      }
    } catch (error) {
      console.error('Health check error:', error);
      setHealthStatus({
        ok: false,
        error,
        timestamp: new Date().toISOString(),
      });
      setIsVisible(true);
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Copy diagnostics to clipboard
   */
  const copyDiagnostics = useCallback(async () => {
    if (!healthStatus) return;

    try {
      const diagnostics = generateDiagnostics(healthStatus);
      await navigator.clipboard.writeText(diagnostics);

      // Show brief success feedback
      const button = document.getElementById('copy-diagnostics-btn');
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy diagnostics:', error);
    }
  }, [healthStatus]);

  /**
   * Dismiss the banner
   */
  const dismissBanner = useCallback(() => {
    setIsVisible(false);
  }, []);

  // Perform initial health check on mount
  useEffect(() => {
    performHealthCheck();
  }, [performHealthCheck]);

  // Don't render if not visible or no health status
  if (!isVisible || !healthStatus) {
    return null;
  }

  const errorMessage =
    healthStatus.error?.message ||
    healthStatus.error?.hint ||
    'Database connection failed';

  return (
    <div className="db-health-banner" role="alert" aria-live="assertive">
      <div className="db-health-content">
        <div className="db-health-icon">⚠️</div>
        <div className="db-health-text">
          <strong>Database Connection Issue</strong>
          <p>{errorMessage}</p>
          {lastCheck && (
            <small>Last checked: {lastCheck.toLocaleTimeString()}</small>
          )}
        </div>
        <div className="db-health-actions">
          <button
            type="button"
            onClick={performHealthCheck}
            disabled={isChecking}
            className="db-health-btn db-health-btn-check"
            aria-label="Recheck database connection"
          >
            {isChecking ? '...' : 'Check Again'}
          </button>
          <button
            type="button"
            id="copy-diagnostics-btn"
            onClick={copyDiagnostics}
            className="db-health-btn db-health-btn-copy"
            aria-label="Copy diagnostic information"
          >
            Copy Info
          </button>
          <button
            type="button"
            onClick={dismissBanner}
            className="db-health-btn db-health-btn-dismiss"
            aria-label="Dismiss banner"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
