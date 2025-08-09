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
  await page.getByLabel('Mood').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q2
  await page.getByLabel('Coffee/Tea').check();
  await page.getByLabel('Skincare').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q3
  await page.getByText('Serene self-care').click();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q4
  await page.getByLabel('I use them daily').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q5
  await page.getByLabel('Magnesium').check();
  await page.getByLabel('Vitamin D').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q6
  await page.getByRole('textbox').fill('candles');
  await page.getByRole('button', { name: 'Next' }).click();

  // Q7
  await page.getByLabel('Better sleep').check();
  await page.getByLabel('More energy').check();
  await page.getByLabel('Mood boost').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q8
  await page.getByLabel('Ritual & mystic').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q9
  await page.getByLabel('Fashion').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q10
  await page.getByLabel('Yes').check();
  await page.getByLabel('Email (optional)').fill('test@example.com');
  await page.getByLabel('Instagram handle (optional)').fill('testhandle');
  await page.getByRole('button', { name: 'Reveal my archetype' }).click();

  await page.waitForSelector('.card img');
  await expect(
    page.getByRole('heading', { name: 'Swipe Ritual (30 seconds)' })
  ).toBeVisible();

  const imgSrc = await page.locator('.card img').first().getAttribute('src');
  expect(imgSrc).toContain('/designs/');

  // Perform a swipe to the right on the first card.
  const card = page.locator('.card').first();
  const box = await card.boundingBox();
  if (box) {
    const swipeRequest = page.waitForRequest((r) => r.url().includes('/swipes'));
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width + 200, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
    await swipeRequest;
  }
  await expect(page.locator('.swipe-feedback')).toBeVisible();
});
