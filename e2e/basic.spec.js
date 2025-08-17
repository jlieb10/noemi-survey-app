import { test, expect } from '@playwright/test';

test('renders welcome screen and first question', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      name: 'Thank you for taking a moment to share your thoughts',
    })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Begin' }).click();
  await expect(
    page.getByRole('heading', { name: /best describes you today/i })
  ).toBeVisible();
});
