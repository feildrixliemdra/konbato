import { test, expect } from '@playwright/test';
import path from 'path';

test.describe.configure({ mode: 'serial' });

test('adds page numbers to a PDF', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'worker-heavy test');
  await page.goto('/tools/pdf-page-number');
  await page.locator('input[type="file"]').first().setInputFiles(path.join(__dirname, 'files', 'test-document.pdf'));
  await expect(page.getByText('test-document.pdf').first()).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: /Add Page Numbers/i }).click();
  await expect(page.getByRole('heading', { name: /Page Numbers Added/i })).toBeVisible({ timeout: 60000 });
});
