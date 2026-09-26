import { test, expect } from '@playwright/test';
import path from 'path';

test.describe.configure({ mode: 'serial' });

test('protects a PDF with a password', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'worker-heavy test');
  await page.goto('/tools/pdf-protect');
  await page.locator('input[type="file"]').first().setInputFiles(path.join(__dirname, 'files', 'test-document.pdf'));
  await expect(page.getByText('test-document.pdf').first()).toBeVisible({ timeout: 30000 });
  await page.getByPlaceholder('Password', { exact: true }).fill('secret123');
  await page.getByPlaceholder('Confirm password').fill('secret123');
  await page.getByRole('button', { name: /Protect PDF/i }).click();
  await expect(page.getByRole('heading', { name: /PDF Protected/i })).toBeVisible({ timeout: 60000 });
});
