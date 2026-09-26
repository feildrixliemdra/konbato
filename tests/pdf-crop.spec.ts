import { test, expect } from '@playwright/test';
import path from 'path';

test.describe.configure({ mode: 'serial' });

test('crops a PDF', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'worker-heavy test');
  await page.goto('/tools/pdf-crop');
  await page.locator('input[type="file"]').first().setInputFiles(path.join(__dirname, 'files', 'test-document.pdf'));
  await expect(page.getByText('test-document.pdf').first()).toBeVisible({ timeout: 30000 });
  await page.getByPlaceholder('Top (pt)').fill('10');
  await page.getByRole('button', { name: /Crop PDF/i }).click();
  await expect(page.getByRole('heading', { name: /PDF Cropped/i })).toBeVisible({ timeout: 60000 });
});
