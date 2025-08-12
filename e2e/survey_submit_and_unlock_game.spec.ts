import { test, expect } from '@playwright/test';
test.skip('survey submit -> redirect to game -> first swipe network', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Woman').click();
  await page.getByText('Deeper sleep').click();
  await page.getByText('Steadier mood').click();
  await page.getByText('Minimal & effortless').click();
  await page.getByText('Capsules').click();
  const sliders = page.getByRole('slider');
  if (await sliders.count()) { await sliders.first().fill('4'); if ((await sliders.count())>1) await sliders.nth(1).fill('4'); }
  await page.getByText('Yes').first().click();
  await page.getByText('Yes').nth(1).click();
  await page.getByText('£80–£100').click();
  const constraintInput = page.getByPlaceholder('e.g., allergens, caffeine‑free, vegan only').first();
  if (await constraintInput.isVisible()) await constraintInput.fill('no caffeine after 4pm');
  await page.getByRole('button', { name: /Submit|Reveal|Continue/i }).click();
  await page.waitForURL(/\/game|play/i, { timeout: 15000 }).catch(()=>{});
  const loveBtn = page.getByRole('button', { name: /Love|Like/i }).first();
  await expect(loveBtn).toBeVisible({ timeout: 15000 });
  const [req] = await Promise.all([
    page.waitForRequest(r => r.url().includes('/rest/v1/swipes') && r.method()==='POST'),
    loveBtn.click()
  ]);
  expect(req).toBeTruthy();
});
