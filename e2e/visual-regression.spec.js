/**
 * Visual regression tests for the NOEMI survey application.
 * 
 * These tests capture screenshots of key UI states and compare them against
 * baseline images to detect visual regressions. Run 'pnpm test:e2e --update-snapshots' 
 * to update baseline screenshots after intentional UI changes.
 * 
 * @testSuite Visual Regression Tests
 */
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('welcome screen should look correct', async ({ page }) => {
    await page.goto('/');
    
    // Wait for content to load
    await expect(page.getByRole('heading', { name: /NOEMI/i })).toBeVisible();
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('welcome-screen.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('first survey question should look correct', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to survey
    await page.getByRole('button', { name: 'Begin' }).click();
    await expect(page.getByRole('heading', { name: /best describes you today/i })).toBeVisible();
    
    // Take screenshot of survey question
    await expect(page).toHaveScreenshot('first-survey-question.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('survey progress indicator should look correct', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to survey
    await page.getByRole('button', { name: 'Begin' }).click();
    await expect(page.getByRole('heading', { name: /best describes you today/i })).toBeVisible();
    
    // Take screenshot of progress area only
    const progressArea = page.locator('.survey-progress');
    await expect(progressArea).toHaveScreenshot('survey-progress.png');
  });

  test('game screen should look correct', async ({ page }) => {
    // Use play mode to skip directly to game
    await page.goto('/?play=true');
    
    // Wait for game to load
    await expect(page.locator('.swipe-game')).toBeVisible({ timeout: 10000 });
    
    // Take screenshot of game interface
    await expect(page).toHaveScreenshot('game-screen.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('terms tooltip should look correct', async ({ page }) => {
    await page.goto('/');
    
    // Hover over info button to show tooltip
    await page.getByRole('button', { name: /view terms/i }).hover();
    await expect(page.getByText(/By participating, you agree/)).toBeVisible();
    
    // Take screenshot showing tooltip
    await expect(page).toHaveScreenshot('terms-tooltip.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('mobile layout should look correct', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Wait for content to load
    await expect(page.getByRole('heading', { name: /NOEMI/i })).toBeVisible();
    
    // Take mobile screenshot
    await expect(page).toHaveScreenshot('mobile-welcome.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('survey question with selection should look correct', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to survey and select an option
    await page.getByRole('button', { name: 'Begin' }).click();
    await expect(page.getByRole('heading', { name: /best describes you today/i })).toBeVisible();
    
    // Select first option
    const firstOption = page.getByRole('radio').first();
    await firstOption.click();
    
    // Take screenshot with selection
    await expect(page).toHaveScreenshot('survey-with-selection.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('error states should look correct', async ({ page }) => {
    // Mock network error for this test
    await page.route('**/participants', route => {
      route.abort('failed');
    });
    
    await page.goto('/');
    
    // Complete survey to trigger error
    await page.getByRole('button', { name: 'Begin' }).click();
    await expect(page.getByRole('heading', { name: /best describes you today/i })).toBeVisible();
    
    // Navigate through survey quickly
    await page.getByRole('radio').first().click();
    await page.waitForTimeout(500); // Wait for auto-advance
    
    // Try to submit (should show error)
    const submitButton = page.getByRole('button', { name: /submit|next/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Wait for potential error message
      await page.waitForTimeout(1000);
      
      // Take screenshot if error is visible
      const errorText = page.locator('text=/error|failed/i');
      if (await errorText.isVisible()) {
        await expect(page).toHaveScreenshot('error-state.png', {
          fullPage: true,
          animations: 'disabled'
        });
      }
    }
  });
});

test.describe('Cross-browser Visual Tests', () => {
  ['chromium', 'webkit'].forEach(browserName => {
    test(`${browserName}: welcome screen consistency`, async ({ page, browserName: currentBrowser }) => {
      test.skip(currentBrowser !== browserName, `Only run on ${browserName}`);
      
      await page.goto('/');
      await expect(page.getByRole('heading', { name: /NOEMI/i })).toBeVisible();
      
      await expect(page).toHaveScreenshot(`${browserName}-welcome.png`, {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });
});

test.describe('Component-level Visual Tests', () => {
  test('app header should look correct', async ({ page }) => {
    await page.goto('/');
    
    const header = page.locator('.app-header');
    await expect(header).toBeVisible();
    
    await expect(header).toHaveScreenshot('app-header.png');
  });

  test('navigation buttons should look correct', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Begin' }).click();
    
    await expect(page.getByRole('heading', { name: /best describes you today/i })).toBeVisible();
    
    const navigation = page.locator('.survey-navigation');
    await expect(navigation).toHaveScreenshot('survey-navigation.png');
  });

  test('question types should render consistently', async ({ page }) => {
    await page.goto('/?dev=true');
    
    // Wait for survey to load
    await expect(page.getByRole('heading')).toBeVisible();
    
    // Take screenshot of current question
    const questionArea = page.locator('.stack').first();
    await expect(questionArea).toHaveScreenshot('question-rendering.png');
  });
});