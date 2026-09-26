import { test, expect } from '@playwright/test';
import path from 'path';

test('extracts a PDF as Markdown', async ({ page }) => {
  await page.goto('/tools/pdf-to-markdown');
  await page.locator('input[type="file"]').first().setInputFiles(path.join(__dirname, 'files', 'text-document.pdf'));
  await expect(page.getByText(/Konbato Test Document/i).first()).toBeVisible({ timeout: 60000 });
});
