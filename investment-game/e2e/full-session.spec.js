import { test, expect } from '@playwright/test';

// Participant IDs that deterministically map to A and B (verified via assignVersion seed).
const ID_A = 'P-A-FIXED-1';
const ID_B = 'P-B-FIXED-2';

async function playThrough(page, participantId) {
  await page.goto('/');
  await page.getByRole('button', { name: /begin/i }).click();
  await page.getByRole('button', { name: /english/i }).click();

  await page.getByLabel('Participant ID', { exact: false }).fill(participantId);
  await page.getByLabel('Enumerator ID', { exact: false }).fill('E-TEST');
  await page.getByRole('button', { name: /start session/i }).click();

  // Click through instruction steps (6 Nexts + Start practice)
  for (let i = 0; i < 7; i++) {
    await page.getByRole('button', { name: /next|start practice/i }).first().click();
  }

  // Practice decision → Plant → confirm
  await page.getByRole('button', { name: /^plant$/i }).click();
  await page.getByRole('button', { name: /yes, plant now/i }).click();
  await page.getByRole('button', { name: /continue/i }).click({ timeout: 10_000 });
  await page.getByRole('button', { name: /continue/i }).click();

  // Round 1
  await page.getByRole('button', { name: /^plant$/i }).click();
  await page.getByRole('button', { name: /yes, plant now/i }).click();
  await page.getByRole('button', { name: /continue/i }).click({ timeout: 10_000 });
  await page.getByRole('button', { name: /continue/i }).click();

  // Video offer — skip video
  await page.getByRole('button', { name: /no, go to round 2/i }).click();

  // Round 2 decision → Plant
  await page.getByRole('button', { name: /^plant$/i }).click();
  await page.getByRole('button', { name: /yes, plant now/i }).click();
  await page.getByRole('button', { name: /continue/i }).click({ timeout: 10_000 });
  await page.getByRole('button', { name: /continue/i }).click();

  // Final payout
  await page.getByRole('button', { name: /continue/i }).click();

  // Survey — answer all nine
  const firstOption = (label) =>
    page.locator('p', { hasText: label }).locator('..').locator('button').first();
  for (const q of [
    'Gender', 'Age range', 'Highest education', 'Main crop',
    'Have you ever purchased crop insurance?',
    'If you plant seeds and the rain is good',
    'If you buy insurance and the rain is bad',
    'What is your budget each round?',
  ]) {
    await firstOption(q).click();
  }
  await page.locator('p', { hasText: 'People in household' }).locator('..').locator('input').fill('5');
  await page.getByRole('button', { name: /submit/i }).click();

  await expect(page.getByText(/thank you/i)).toBeVisible();
}

test('full V-A session happy path', async ({ page }) => {
  await playThrough(page, ID_A);
});

test('full V-B session happy path', async ({ page }) => {
  await playThrough(page, ID_B);
});
