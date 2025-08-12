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
  await page.getByLabel('Woman').check();
  await page.waitForTimeout(400);

  // Q2 – select two desires
  await page.getByLabel('Deeper sleep').check();
  await page.getByLabel('Steadier mood').check();
  await page.getByRole('button', { name: 'Next' }).click();

  // Q3 – self-care style
  await page.getByLabel('Minimal & effortless').check();
  await page.waitForTimeout(400);

  // Q4 – preferred format
  await page.getByLabel('Capsules').check();
  await page.waitForTimeout(400);

  // Q5 – frequency
  await page.getByLabel('Daily').check();
  await page.waitForTimeout(400);

  // Q6 – evidence appeal
  const slider1 = page.getByRole('slider').first();
  if (await slider1.isVisible()) {
    await slider1.fill('4');
  }
  await page.getByRole('button', { name: 'Next' }).click();

  // Q7 – openness to botanicals
  const slider2 = page.getByRole('slider').first();
  if (await slider2.isVisible()) {
    await slider2.fill('4');
  }
  await page.getByRole('button', { name: 'Next' }).click();

  // Q8 – scent/flavour cues
  await page.getByLabel('Yes').check();
  await page.waitForTimeout(400);

  // Q9 – subscription interest
  await page.getByLabel('Yes').check();
  await page.waitForTimeout(400);

  // Q10 – budget
  await page.getByLabel('£80–£100').check();
  await page.waitForTimeout(400);

  // Q11 – constraints
  const constraintInput = page.getByPlaceholder(
    'e.g., allergens, caffeine‑free, vegan only',
  );
  if (await constraintInput.isVisible()) {
    await constraintInput.fill('no caffeine');
  }
  await page.getByRole('button', { name: 'Next' }).click();

  // Q12 – gate opt‑in (join yes with contact info)
  await page.getByLabel('Yes, keep me posted').check();
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Instagram').fill('testhandle');
  await page.getByRole('button', { name: /Continue|Reveal/i }).click();

  // After completion we should land on the Swipe Ritual game
  await page.waitForSelector('.card img');
  await expect(page.getByRole('heading', { name: 'Swipe Ritual' })).toBeVisible();

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
