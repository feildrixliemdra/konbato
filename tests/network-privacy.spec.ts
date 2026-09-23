import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Proves the product's core claim with a runtime assertion: a full tool run
 * issues no request to any host other than the app's own origin. The only
 * network the worker touches is the same-origin pdfjs worker bundle, so the
 * `external` list must stay empty end-to-end.
 *
 * No upload bytes leave the machine; this guards against a future dependency
 * silently phoning home (e.g. a CDN-hosted WASM or a telemetry beacon).
 */
test('no bytes leave the device during a full tool run', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Skip worker-based tests on Webkit');

  const external: string[] = [];
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.host !== 'localhost:3000') {
      external.push(route.request().url());
    }
    await route.continue();
  });

  await page.goto('/tools/image-convert');
  await page.locator('input[type="file"]').first().setInputFiles(
    path.join(__dirname, 'images', 'test-pixel.png')
  );
  await expect(page.getByText('Selected Files (1)').first()).toBeVisible({ timeout: 30000 });

  await page.getByRole('button', { name: 'Convert Images' }).click();
  await expect(page.getByRole('heading', { name: 'Conversion Complete' })).toBeVisible({
    timeout: 60000,
  });

  expect(external).toEqual([]);
});
