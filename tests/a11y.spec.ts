import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Automated accessibility coverage.
 *
 * Konbato has no unit runner, so axe (via @axe-core/playwright) is the one
 * place colour-contrast, landmark, and name/role violations get caught in CI.
 * Serious and critical WCAG A/AA violations fail; best-practice and moderate
 * issues are reported but not gated, since they are not failures.
 */

const PAGES = [
  { path: '/', label: 'home' },
  { path: '/tools', label: 'directory' },
  { path: '/tools/image-convert', label: 'image-convert' },
  { path: '/tools/pdf-merge', label: 'pdf-merge' },
];

for (const target of PAGES) {
  test(`a11y: ${target.label} has no serious violations`, async ({ page }) => {
    await page.goto(target.path);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const serious = results.violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact ?? '')
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}

test('theme toggle switches the light/dark class on <html>', async ({ page }) => {
  await page.goto('/');

  const html = page.locator('html');
  const toggle = page.getByRole('button', { name: /switch to (light|dark) theme/i });

  await expect(toggle).toBeVisible();
  const before = await html.getAttribute('class');

  await toggle.click();

  await expect
    .poll(async () => (await html.getAttribute('class')) !== before, {
      timeout: 5000,
    })
    .toBe(true);
});
