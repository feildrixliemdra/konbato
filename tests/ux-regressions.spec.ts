import { test, expect, type Locator, type Page } from '@playwright/test';
import path from 'path';

const TEST_IMAGES = {
  png: path.join(__dirname, 'images', 'test-pixel.png'),
};

/** A "png" that isn't one, so the image worker throws while decoding it. */
const CORRUPT_PNG = {
  name: 'broken.png',
  mimeType: 'image/png',
  buffer: Buffer.from('this is definitely not a valid png file'),
};

const HEADER_ONLY_TOOLS = ['PDF to Image', 'Image to PDF'];

/**
 * Uploads through the hidden file input, retrying until the page has hydrated.
 * The input is present in the server HTML before React attaches its change
 * handler, so an upload fired too early is silently dropped.
 */
async function uploadWhenHydrated(
  page: Page,
  files: Parameters<Locator['setInputFiles']>[0],
  settled: Locator
) {
  await expect(async () => {
    await page.locator('input[type="file"]').first().setInputFiles(files);
    await expect(settled).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 30000 });
}

test.describe('UX regressions', () => {
  test.describe.configure({ mode: 'serial' });

  test('upload rejections are surfaced to the user', async ({ page }) => {
    await page.goto('/tools/image-convert');

    const main = page.locator('#main');

    // A .txt is not accepted by an image-only tool.
    await uploadWhenHydrated(
      page,
      { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') },
      main.getByText(/could not be added/)
    );

    // Inline notice, inside the page itself.
    await expect(main.getByText('notes.txt')).toBeVisible();
    await expect(main.getByText('Unsupported file type')).toBeVisible();

    // And a toast, so the rejection is noticed even when scrolled away.
    await expect(page.getByText('1 file skipped')).toBeVisible();

    // The rejected file must not be accepted as a selection.
    await expect(main.getByText('Selected Files (1)')).toHaveCount(0);
  });

  test('processing failures stay visible after the overlay closes', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === 'webkit', 'Worker flows are Chromium-only here');
    await page.goto('/tools/image-convert');

    const main = page.locator('#main');
    await uploadWhenHydrated(page, CORRUPT_PNG, main.getByText('Selected Files (1)'));

    await page.getByRole('button', { name: 'Convert Images' }).click();

    // Regression guard: the failure message used to live only inside the
    // processing overlay, which unmounted in the same `finally` block.
    await expect(main.getByText('Processing failed')).toBeVisible({ timeout: 60000 });
    await expect(main.getByText('Conversion failed')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Convert Images' })).toBeEnabled();
  });

  test('every tool is reachable from the header menu', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    await page.getByRole('banner').getByRole('button', { name: 'Tools', exact: true }).click();

    const header = page.getByRole('banner');
    for (const name of HEADER_ONLY_TOOLS) {
      await expect(header.getByRole('link', { name, exact: true })).toBeVisible();
    }
  });

  test('the mobile menu reports its expanded state', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const toggle = page.getByRole('button', { name: 'Toggle navigation menu' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeAttached();

    // Activate by keyboard: the drawer animates its height, so pointer clicks
    // can never satisfy Playwright's "stable" actionability check.
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    const header = page.getByRole('banner');
    for (const name of HEADER_ONLY_TOOLS) {
      await expect(header.getByRole('link', { name, exact: true })).toBeVisible();
    }

    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('search and category filters are labelled', async ({ page }) => {
    await page.goto('/tools');

    await expect(page.getByRole('searchbox', { name: 'Search tools' })).toBeVisible();

    const imageFilter = page.getByRole('button', { name: 'Image' });
    await expect(imageFilter).toHaveAttribute('aria-pressed', 'false');

    await imageFilter.click();
    await expect(imageFilter).toHaveAttribute('aria-pressed', 'true');

    // Filtering by Image hides the PDF-only tools.
    await expect(page.getByRole('heading', { name: 'Merge PDF' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Image Compress' })).toBeVisible();
  });

  test('range sliders expose an accessible name', async ({ page }) => {
    await page.goto('/tools/image-compress');

    await expect(page.getByRole('slider', { name: 'Quality' })).toBeVisible();

    await page.goto('/tools/pdf-compress');
    await page.locator('input[type="file"]').first().setInputFiles(
      path.join(__dirname, 'files', 'test-document.pdf')
    );
    await page.getByRole('button', { name: 'Deep (Rasterize)' }).click();

    await expect(page.getByRole('slider', { name: 'Image Quality:' })).toBeVisible();
    await expect(
      page.getByRole('slider', { name: 'Rendering DPI (Resolution):' })
    ).toBeVisible();
  });

  test('the theme toggle switches and persists', async ({ page }) => {
    await page.goto('/');

    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);

    // The label names the action, so it flips with the current theme.
    const toDark = page.getByRole('button', { name: 'Switch to dark theme' });
    await expect(toDark).toBeVisible();
    await toDark.click();

    await expect(html).toHaveClass(/dark/);
    await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();

    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('the theme toggle stays settled on load', async ({ page }) => {
    await page.goto('/');

    const icon = page.locator('header button[aria-label$="theme"] span span');
    await expect(icon).toHaveCount(1);

    // The icon swap must only play for a theme the visitor chose — never as an
    // entrance animation once the icon has hydrated in.
    const samples = await page.evaluate(async () => {
      const read = () => {
        const btn = [...document.querySelectorAll('header button')].find((b) =>
          /Switch to .* theme/.test(b.getAttribute('aria-label') ?? '')
        );
        const span = btn?.querySelector('span span');
        return span ? getComputedStyle(span).opacity : 'missing';
      };
      const seen: string[] = [];
      for (let i = 0; i < 10; i += 1) {
        seen.push(read());
        await new Promise((resolve) => setTimeout(resolve, 40));
      }
      return seen;
    });

    // A tween would show a ramp of intermediate opacities here.
    expect(new Set(samples).size, `opacity varied: ${samples.join(',')}`).toBe(1);
    expect(samples[0]).toBe('1');
  });

  test('unknown routes render the not-found page', async ({ page }) => {
    await page.goto('/tools/this-tool-does-not-exist');

    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Browse Tools/ })).toBeVisible();
  });

  test('the header and footer render once per page', async ({ page }) => {
    await page.goto('/tools/image-compress');

    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('contentinfo')).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
  });

  test('a finished conversion is announced and downloadable', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === 'webkit', 'Worker flows are Chromium-only here');
    await page.goto('/tools/image-compress');

    await page.locator('input[type="file"]').first().setInputFiles(TEST_IMAGES.png);
    await expect(page.getByText('Selected Files (1)')).toBeVisible();

    await page.getByRole('button', { name: 'Compress Images' }).click();
    await expect(
      page.getByRole('heading', { name: 'Compression Complete' })
    ).toBeVisible({ timeout: 60000 });

    const download = page.getByRole('link', { name: 'Download' }).first();
    await expect(download).toHaveAttribute('href', /^blob:/);
  });
});
