import { test, expect } from '@playwright/test';

test('renders welcome screen and first question', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      name: 'NOEMI — A Minute for Your Future Ritual',
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Begin' }).click();
  await expect(
    page.getByRole('button', { name: 'Next' }),
  ).toBeVisible();
});
