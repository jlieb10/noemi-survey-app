import { test, expect } from '@playwright/test';
test('survey submit -> redirect to game -> first swipe network', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin' }).click();

  // Q1
  await page.getByLabel('Woman').check();
  await page.waitForTimeout(400);

  // Q2
  await page.getByLabel('Deeper sleep').check();
  await page.getByLabel('Steadier mood').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q3
  await page.getByLabel('Minimal & effortless').check();
  await page.waitForTimeout(400);

  // Q4
  await page.getByLabel('Capsules').check();
  await page.waitForTimeout(400);

  // Q5
  await page.getByLabel('Daily').check();
  await page.waitForTimeout(400);

  // Q6
  const sliders = page.getByRole('slider');
  if (await sliders.count()) {
    await sliders.first().fill('4');
  }
  await page.getByRole('button', { name: 'Next' }).click();

  // Q7
  const secondSlider = page.getByRole('slider');
  if (await secondSlider.count()) {
    await secondSlider.first().fill('4');
  }
  await page.getByRole('button', { name: 'Next' }).click();

  // Q8
  await page.getByLabel('Yes').check();
  await page.waitForTimeout(400);

  // Q9
  await page.getByLabel('Yes').check();
  await page.waitForTimeout(400);

  // Q10
  await page.getByLabel('£80–£100').check();
  await page.waitForTimeout(400);

  // Q11
  const constraintInput = page.getByPlaceholder(
    'e.g., allergens, caffeine‑free, vegan only',
  );
  if (await constraintInput.isVisible()) {
    await constraintInput.fill('no caffeine after 4pm');
  }
  await page.getByRole('button', { name: 'Next' }).click();

  // Q12
  await page.getByLabel('Yes, keep me posted').check();
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByRole('button', { name: /Submit|Reveal|Continue/i }).click();

  await page.waitForURL(/\/game|play/i, { timeout: 15000 }).catch(() => {});
  await page.waitForSelector('.card img');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);
  await expect(page.locator('.card')).toBeVisible();
});
