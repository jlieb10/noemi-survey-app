import { test, expect } from '@playwright/test';

test('loads survey on first visit', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'NOĒMI' })).toBeVisible();
});
