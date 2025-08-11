import { test, expect } from '@playwright/test';

// Intercept Supabase requests so tests do not hit the real backend. This helper
// returns deterministic IDs for participants and ignores inserts for swipes.
async function mockSupabase(page) {
  await page.route(/https:\/\/.*\.supabase\.co\/.*$/, (route) => {
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

test('happy path: complete survey and unlock swipe game', async ({ page }) => {
  await mockSupabase(page);
  await page.goto('/');

  // Start the survey
  await page.getByRole('button', { name: 'Begin' }).click();

  // Q1
  await page.getByLabel('Mood').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q2 – select two routines
  await page.getByLabel('Coffee/Tea').check();
  await page.getByLabel('Skincare').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q3 – supplement approach
  await page.getByLabel('I take them consistently as part of my routine').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q4 – relationship with wellness products
  await page.getByLabel('I use them daily').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q5 – multi-select supplements
  await page.getByLabel('Magnesium').check();
  await page.getByLabel('Vitamin D').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q6 – preferred form
  await page.getByLabel('Capsule or pill').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q7 – ranking (select three)
  await page.getByLabel('Better sleep').check();
  await page.getByLabel('More energy').check();
  await page.getByLabel('Mood boost').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q8 – wellness feel
  await page.getByLabel('Mystic feel').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q9 – spending category
  await page.getByLabel('Fashion').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q10 – openness to botanicals
  await page.getByLabel('Very open').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q11 – subscription interest
  await page.getByLabel('Yes, definitely').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q12 – gate opt‑in (join yes with contact info)
  await page.getByLabel('Yes').check();
  await page.getByLabel('Email (optional)').fill('test@example.com');
  await page.getByLabel('Instagram handle (optional)').fill('testhandle');
  await page.getByRole('button', { name: 'See my results' }).click();

  // After completion we should land on the swipe game
  await page.waitForSelector('.card img');
  await expect(page.locator('.swipe-container')).toBeVisible();

  // Perform a right swipe on the first card via keyboard
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);

  // Expect there are still cards left (the deck rotates or reduces)
  await page.waitForSelector('.card.tutorial', { state: 'detached' });
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
