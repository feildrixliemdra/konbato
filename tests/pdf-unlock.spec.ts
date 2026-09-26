import { test, expect } from '@playwright/test';
import path from 'path';

test.describe.configure({ mode: 'serial' });

test('unlocks a password-protected PDF', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'worker-heavy test');
  await page.goto('/tools/pdf-unlock');
  await page.locator('input[type="file"]').first().setInputFiles(path.join(__dirname, 'files', 'locked.pdf'));
  await expect(page.getByText('locked.pdf').first()).toBeVisible({ timeout: 30000 });
  await page.getByPlaceholder(/password/i).fill('secret123');
  await page.getByRole('button', { name: /Unlock PDF/i }).click();
  await expect(page.getByRole('heading', { name: /PDF Unlocked/i })).toBeVisible({ timeout: 60000 });
});
