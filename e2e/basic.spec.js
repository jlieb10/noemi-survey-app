import { test, expect } from '@playwright/test';

test('renders welcome screen and first question', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', {
      name: 'NOEMI — A Minute for Your Future',
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Begin' }).click();
  await expect(
    page.getByText(
      'When you think of feeling your absolute best, which word speaks first?',
    ),
  ).toBeVisible();
});
