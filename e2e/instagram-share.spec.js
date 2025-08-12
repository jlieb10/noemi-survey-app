import { test, expect } from '@playwright/test';

test('share to instagram button appears in game', async ({ page }) => {
  await page.goto('/?play=true');
  const btn = page.getByLabel('Share to Instagram');
  await expect(btn).toBeVisible({ timeout: 15000 });
});
