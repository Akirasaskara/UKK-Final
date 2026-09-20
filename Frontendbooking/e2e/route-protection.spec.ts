import { expect, test } from '@playwright/test';

test.describe('protected route boundary', () => {
  test('redirects anonymous member request to login and preserves returnTo', async ({ page }) => {
    await page.goto('/member/history');

    await expect(page).toHaveURL(/\/login\?returnTo=%2Fmember%2Fhistory$/);
    await expect(page.getByRole('heading', { name: /masuk/i })).toBeVisible();
  });

  test('redirects anonymous admin request to login and preserves returnTo', async ({ page }) => {
    await page.goto('/admin/check-in');

    await expect(page).toHaveURL(/\/login\?returnTo=%2Fadmin%2Fcheck-in$/);
    await expect(page.getByRole('heading', { name: /masuk/i })).toBeVisible();
  });

  test('renders login without horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/login');

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });
});
