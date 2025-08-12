import { test, expect } from '@playwright/test';

// Intercept Supabase requests so tests do not hit the real backend.
async function mockSupabase(page) {
  await page.route('https://lzzgroksxrqkwyvykmka.supabase.co/**', (route) => {
    const url = route.request().url();
    if (url.includes('/participants')) {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'test-participant' }),
      });
    }
    if (url.includes('/swipes')) {
      return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

test('complete survey and swipe ritual', async ({ page }) => {
  await mockSupabase(page);
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
  const slider1 = page.getByRole('slider').first();
  if (await slider1.isVisible()) {
    await slider1.fill('4');
  }
  await page.getByRole('button', { name: 'Next' }).click();

  // Q7
  const slider2 = page.getByRole('slider').first();
  if (await slider2.isVisible()) {
    await slider2.fill('4');
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
    await constraintInput.fill('no caffeine');
  }
  await page.getByRole('button', { name: 'Next' }).click();

  // Q12
  await page.getByLabel('Yes, keep me posted').check();
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Instagram').fill('testhandle');
  await page.getByRole('button', { name: /Continue|Reveal/i }).click();

  await page.waitForSelector('.card img');
  await expect(
    page.getByRole('heading', { name: 'Swipe Ritual' })
  ).toBeVisible();
  await page.waitForSelector('.card.tutorial', { state: 'detached' });

  const imgSrc = await page.locator('.card img').first().getAttribute('src');
  expect(imgSrc).toContain('/designs/');

  const card = page.locator('.card').first();
  const box = await card.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width + 200, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);
  }
  await expect(page.locator('.card')).toBeVisible();
});
