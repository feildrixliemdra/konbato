import { test, expect } from '@playwright/test';
import path from 'path';

test('converts a PDF to Word', async ({ page }) => {
  await page.goto('/tools/pdf-to-word');
  await page.locator('input[type="file"]').first().setInputFiles(path.join(__dirname, 'files', 'text-document.pdf'));
  await expect(page.getByRole('heading', { name: /Word Document Ready/i })).toBeVisible({ timeout: 60000 });
});
