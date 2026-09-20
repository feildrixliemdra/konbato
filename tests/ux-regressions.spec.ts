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

  test.describe('responsive', () => {
    test('nothing overflows the viewport across the gauntlet', async ({ page }) => {
      for (const width of [320, 768, 1440, 2560]) {
        for (const route of ['/', '/tools']) {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(route);
          const overflow = await page.evaluate(() => {
            const de = document.documentElement;
            return de.scrollWidth - de.clientWidth;
          });
          expect(overflow, `${route} overflows at ${width}px`).toBeLessThanOrEqual(1);
        }
      }
    });

    test('the viewport meta allows zoom and covers safe areas', async ({ page }) => {
      await page.goto('/');
      const content = await page.locator('meta[name="viewport"]').getAttribute('content');

      // `viewport-fit=cover` exposes env(safe-area-inset-*), which the shell uses.
      expect(content).toContain('viewport-fit=cover');
      // Capping scale would disable pinch-zoom for everyone.
      expect(content).not.toContain('maximum-scale');
      expect(content).not.toContain('user-scalable=no');
    });

    test('header controls are comfortable touch targets', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 812 },
        hasTouch: true,
        isMobile: true,
      });
      const page = await context.newPage();

      const measure = () =>
        page.evaluate(() =>
          Array.from(document.querySelectorAll('button, a[href]'))
            .map((el) => {
              const label =
                el.getAttribute('aria-label') || (el.textContent || '').trim();
              if (!/^(All|Image|PDF|Switch to (dark|light) theme|Toggle navigation menu)$/.test(label))
                return null;
              const r = el.getBoundingClientRect();
              return { label, min: Math.round(Math.min(r.width, r.height)) };
            })
            .filter((x): x is { label: string; min: number } => x !== null)
        );

      // The shell controls exist on every page.
      for (const route of ['/', '/tools']) {
        await page.goto(route);
        const sizes = await measure();
        const labels = sizes.map((s) => s.label);
        expect(labels, `shell controls missing on ${route}`).toContain('Toggle navigation menu');
        expect(
          labels.some((l) => l.startsWith('Switch to')),
          `theme toggle missing on ${route}`
        ).toBe(true);
        for (const { label, min } of sizes) {
          expect(min, `"${label}" is ${min}px on ${route}`).toBeGreaterThanOrEqual(44);
        }
      }

      // The category filters only exist on the directory.
      await page.goto('/tools');
      const filters = await measure();
      for (const name of ['All', 'Image', 'PDF']) {
        const found = filters.find((f) => f.label === name);
        expect(found, `filter "${name}" not found`).toBeDefined();
        expect(found!.min, `filter "${name}"`).toBeGreaterThanOrEqual(44);
      }

      await context.close();
    });

    test('hover-only reveals stay visible on touch pointers', async ({ browser }) => {
      test.setTimeout(90000);
      // On a coarse pointer `(hover: hover)` is false, so anything gated behind
      // group-hover alone would be permanently invisible.
      const context = await browser.newContext({
        viewport: { width: 375, height: 812 },
        hasTouch: true,
        isMobile: true,
      });
      const page = await context.newPage();

      await page.goto('/');
      const stepDetail = page
        .locator('#how-it-works p', { hasText: 'Drag & drop or click to browse' })
        .locator('..');
      await stepDetail.scrollIntoViewIfNeeded();
      await expect(stepDetail).toHaveCSS('opacity', '1');

      await page.goto('/tools/pdf-rotate');
      await uploadWhenHydrated(
        page,
        path.join(__dirname, 'files', 'test-document.pdf'),
        page.getByText('Workspace pages')
      );
      const rotate = page.getByRole('button', { name: 'Rotate page 1 counter-clockwise' });
      await expect(rotate.locator('..')).toHaveCSS('opacity', '1');

      await context.close();
    });

    test('the drag handle spans the card and grows to a touch target', async ({ browser }) => {
      test.setTimeout(90000);
      const context = await browser.newContext({
        viewport: { width: 375, height: 812 },
        hasTouch: true,
        isMobile: true,
      });
      const page = await context.newPage();
      await page.goto('/tools/pdf-reorder');
      await uploadWhenHydrated(
        page,
        path.join(__dirname, 'files', 'test-document.pdf'),
        page.getByText('Page reorder workspace')
      );

      const handle = await page.evaluate(() => {
        const el = document.querySelector('[aria-label="Drag to reorder"]');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { width: Math.round(r.width), height: Math.round(r.height) };
      });

      expect(handle, 'drag handle not found').not.toBeNull();
      // A ~18px glyph is not a usable target, so the whole bar is the handle.
      expect(handle!.width).toBeGreaterThan(60);
      expect(handle!.height).toBeGreaterThanOrEqual(44);

      await context.close();
    });
  });

  test.describe('surface system', () => {
    test('card surfaces are borderless and carry elevation instead', async ({ page }) => {
      const offenders: string[] = [];
      for (const route of ['/', '/tools', '/tools/image-compress']) {
        await page.goto(route);
        await page.waitForTimeout(300);
        const rows = await page.evaluate(() =>
          Array.from(document.querySelectorAll<HTMLElement>('[data-slot="card"]')).map((el) => {
            const cs = getComputedStyle(el);
            return {
              border: cs.borderTopWidth,
              shadow: cs.boxShadow,
              bg: cs.backgroundColor,
            };
          })
        );
        expect(rows.length, `no card surfaces found on ${route}`).toBeGreaterThan(0);
        for (const r of rows) {
          if (parseFloat(r.border) > 0) offenders.push(`${route}: still bordered`);
          if (r.shadow === 'none') offenders.push(`${route}: no elevation`);
          // A translucent card would let the canvas bleed through, which is
          // what made the old outline load-bearing in the first place.
          if (/\/ 0?\.\d+\)|rgba\([^)]*,\s*0?\.\d+\)/.test(r.bg)) {
            offenders.push(`${route}: translucent card (${r.bg})`);
          }
        }
      }
      expect(offenders, offenders.join('\n')).toEqual([]);
    });

    test('controls keep their edge even though cards have none', async ({ page }) => {
      // The borderless rule applies to containers, not to things you operate.
      // If this ever inverts, inputs and drop zones lose their affordance.
      await page.goto('/tools/image-compress');
      await uploadWhenHydrated(page, TEST_IMAGES.png, page.getByText('Selected Files (1)'));

      const probes = await page.evaluate(() => {
        const input = document.querySelector<HTMLInputElement>('input[type="number"]');
        return {
          inputBorder: input ? getComputedStyle(input).borderTopWidth : 'missing',
        };
      });
      expect(parseFloat(probes.inputBorder)).toBe(1);
    });

    test('fields keep the iOS zoom guard below sm', async ({ page }) => {
      await page.goto('/tools/image-compress');
      await uploadWhenHydrated(page, TEST_IMAGES.png, page.getByText('Selected Files (1)'));

      // Under 640px the base size must win, or iOS Safari zooms the viewport on
      // focus. Above it, the intended smaller size applies.
      for (const [width, expected] of [
        [375, 16],
        [1440, 12],
      ] as const) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(300);
        const sizes = await page.evaluate(() =>
          Array.from(document.querySelectorAll<HTMLInputElement>('input[type="number"]')).map(
            (el) => getComputedStyle(el).fontSize
          )
        );
        expect(sizes.length, 'no numeric fields found').toBeGreaterThan(0);
        for (const size of sizes) {
          expect(size, `at ${width}px`).toBe(`${expected}px`);
        }
      }
    });
  });

  test.describe('motion', () => {
    test('no element animates every property', async ({ page }) => {
      const offenders: string[] = [];
      for (const route of ['/', '/tools', '/tools/image-compress']) {
        await page.goto(route);
        await page.waitForTimeout(300);
        const found = await page.evaluate(() => {
          const out: string[] = [];
          document.querySelectorAll('*').forEach((el) => {
            const cs = getComputedStyle(el);
            // `all` is the CSS initial value, so it only matters when the
            // element also has a non-zero duration. Without that second
            // condition every element in the document is a false positive.
            const animates = cs.transitionDuration
              .split(',')
              .some((d) => parseFloat(d) > 0);
            if (cs.transitionProperty === 'all' && animates) {
              const cls = typeof el.className === 'string' ? el.className : '';
              out.push(`${el.tagName.toLowerCase()}.${cls.slice(0, 70)}`);
            }
          });
          return out;
        });
        found.forEach((f) => offenders.push(`${route}  ${f}`));
      }
      expect(offenders, `transition-all on: ${offenders.join(', ')}`).toEqual([]);
    });

    test('perpetual motion stays confined to the background plane', async ({ page }) => {
      await page.goto('/');
      // Walk the page so every `whileInView` reveal has triggered, then let
      // the entrances finish before sampling.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(2000);

      const sample = () =>
        page.evaluate(() =>
          Array.from(document.querySelectorAll('*')).map((el) => {
            const cs = getComputedStyle(el);
            return `${cs.transform}|${cs.scale}|${cs.opacity}`;
          })
        );

      const a = await sample();
      await page.waitForTimeout(700);
      const b = await sample();
      const moving = a.filter((v, i) => v !== b[i]);

      // Only the hero's two blurred background glows and the privacy section's
      // aura may still loop: all heavily blurred, both on the background plane,
      // neither carrying an information claim.
      expect(
        moving.length,
        `${moving.length} elements are still moving on their own`
      ).toBeLessThanOrEqual(3);
    });

    test('buttons answer a press', async ({ page, browserName }) => {
      // Known engine gap: WebKit matches `:active` on the button and the only
      // scale rule in the sheet is `.active\:scale-\[0\.98\]:active{scale:.98}`,
      // but it leaves computed `scale` at 1. A hand-authored stylesheet with the
      // same declaration applies fine in WebKit, so the cause is Tailwind's
      // emitted context rather than the declaration itself. Chromium, which runs
      // the worker tools, applies it. Asserted there only.
      test.skip(browserName === 'webkit', 'WebKit does not apply the :active scale');

      await page.goto('/');
      const button = page.locator('[data-slot="button"]').first();
      await button.scrollIntoViewIfNeeded();

      expect(
        await button.evaluate((el) => getComputedStyle(el).transitionProperty)
      ).toContain('scale');

      const box = await button.boundingBox();
      expect(box).not.toBeNull();
      await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
      await page.waitForTimeout(200);
      const resting = await button.evaluate((el) => getComputedStyle(el).scale);

      await page.mouse.down();
      await page.waitForTimeout(200);
      const pressed = await button.evaluate((el) => getComputedStyle(el).scale);
      await page.mouse.up();

      // Tailwind v4 writes `scale` as its own property rather than composing it
      // into `transform`, so this is where the feedback shows up.
      const n = parseFloat(pressed);
      expect(n, `pressed scale was ${pressed}`).toBeLessThan(1);
      expect(n).toBeGreaterThan(0.95);
      expect(pressed).not.toBe(resting);
    });

    test('the result surface is animated, not popped in', async ({ page }) => {
      test.setTimeout(90000);
      await page.goto('/tools/pdf-compress');
      await uploadWhenHydrated(
        page,
        path.join(__dirname, 'files', 'test-document.pdf'),
        page.getByText('Selected Files (1)')
      );
      await page.getByRole('button', { name: /Compress|Process/ }).first().click();
      const heading = page.getByRole('heading', {
        name: /Compression (Complete|Finished)/,
      });
      await heading.waitFor({ timeout: 60000 });

      // Framer leaves inline styles on the wrappers it drives. Before the
      // motion pass the result card had none: it appeared between frames.
      const parts = await page.evaluate(() => {
        const h2 = Array.from(document.querySelectorAll('h2')).find((el) =>
          /Compression (Complete|Finished)/.test(el.textContent || '')
        );
        if (!h2) return null;
        const textBlock = h2.parentElement;
        return {
          text: textBlock?.getAttribute('style') || '',
          icon: textBlock?.previousElementSibling?.getAttribute('style') || '',
          card: textBlock?.parentElement?.getAttribute('style') || '',
        };
      });

      expect(parts, 'result card not found').not.toBeNull();
      Object.entries(parts!).forEach(([part, style]) =>
        expect(style, `the ${part} wrapper is not animated`).toMatch(
          /opacity|transform|translate|scale/
        )
      );
      await expect(heading).toHaveCSS('opacity', '1');
    });

    test('reduced motion drops the movement but keeps the spinner', async ({ browser }) => {
      test.setTimeout(60000);
      const context = await browser.newContext({ reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto('/');
      await page.waitForTimeout(1200);

      // The spatial half is gone: no leftover translation on the hero heading.
      const h1 = page.locator('h1');
      await expect(h1).toHaveCSS('opacity', '1');
      const transform = await h1.evaluate((el) => getComputedStyle(el).transform);
      expect(transform === 'none' || /matrix\(1, 0, 0, 1, 0, 0\)/.test(transform)).toBe(true);

      // Functional signals survive: the spinner is the interface proving it is
      // still working, so the global kill switch explicitly exempts it.
      const spin = await page.evaluate(() => {
        const el = document.createElement('div');
        el.className = 'animate-spin';
        document.body.appendChild(el);
        const cs = getComputedStyle(el);
        return {
          name: cs.animationName,
          iterations: cs.animationIterationCount,
        };
      });
      expect(spin.name).not.toBe('none');
      expect(spin.iterations).toBe('infinite');

      await context.close();
    });
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
