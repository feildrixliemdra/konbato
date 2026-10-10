import { test, expect, type Locator, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe.configure({ mode: 'serial' });

const PDF = path.join(__dirname, 'files', 'test-document.pdf');

/** See ux-regressions.spec.ts: an upload fired before hydration is dropped. */
async function uploadWhenHydrated(page: Page, settled: Locator) {
  await expect(async () => {
    await page.locator('input[type="file"]').first().setInputFiles(PDF);
    await expect(settled).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 30000 });
}

async function openWorkspace(page: Page) {
  await page.goto('/tools/pdf-sign');
  await uploadWhenHydrated(page, page.getByText('Page 1 of 2'));
  await expect(page.getByRole('img', { name: 'Page 1 preview' })).toBeVisible({ timeout: 30000 });
}

async function placeTypedSignature(page: Page) {
  await page.getByRole('button', { name: 'Type', exact: true }).click();
  await page.getByRole('textbox', { name: 'Type your signature' }).fill('Jane Doe');
  const add = page.getByRole('button', { name: 'Add to this page' });
  await expect(add).toBeEnabled({ timeout: 10000 });
  await add.click();
  return page.getByRole('group', { name: /^Signature 1 on page 1/ });
}

test('signs a PDF with a typed signature, keeping the document intact', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'worker-heavy test');
  test.setTimeout(90000);
  await openWorkspace(page);

  const box = await placeTypedSignature(page);
  await expect(box).toBeVisible();
  await expect(page.getByText('Placed (1)')).toBeVisible();

  // Keyboard placement: focus the box and nudge it.
  const before = await box.evaluate((el) => (el as HTMLElement).style.left);
  await box.focus();
  await page.keyboard.press('Shift+ArrowRight');
  await expect.poll(() => box.evaluate((el) => (el as HTMLElement).style.left)).not.toBe(before);

  await page.getByRole('button', { name: 'Sign PDF' }).click();
  await expect(page.getByRole('heading', { name: 'PDF Signed' })).toBeVisible({ timeout: 60000 });

  const link = page.getByRole('link', { name: 'Download PDF' });
  await expect(link).toHaveAttribute('href', /^blob:/);
  await expect(link).toHaveAttribute('download', 'signed_test-document.pdf');

  const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
  const bytes = fs.readFileSync(await download.path());

  // Incremental save: the original file is an untouched prefix of the output,
  // which is what keeps existing digital signatures valid.
  const original = fs.readFileSync(PDF);
  expect(bytes.subarray(0, original.length).equals(original)).toBe(true);

  // Open the result with the same engine the worker uses and check that only
  // page 1 gained the signature image.
  const mupdf = await import('mupdf');
  const doc = mupdf.Document.openDocument(bytes, 'application/pdf').asPDF();
  expect(doc).not.toBeNull();
  expect(doc!.countPages()).toBe(2);
  const xobjects = (index: number) =>
    (doc!.loadPage(index) as InstanceType<typeof mupdf.PDFPage>)
      .getObject()
      .getInheritable('Resources')
      .get('XObject');
  const page1 = xobjects(0);
  expect(page1.isNull()).toBe(false);
  expect(page1.get('KonbatoSig').get('Subtype').asName()).toBe('Image');
  expect(xobjects(1).isNull() || xobjects(1).get('KonbatoSig').isNull()).toBe(true);
});

test('drawing on the pad enables placement', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'worker-heavy test');
  await openWorkspace(page);

  const add = page.getByRole('button', { name: 'Add to this page' });
  await expect(add).toBeDisabled();

  const pad = page.getByRole('img', { name: /Signature drawing pad/ });
  const rect = (await pad.boundingBox())!;
  await page.mouse.move(rect.x + 20, rect.y + rect.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(rect.x + 20 + i * 15, rect.y + rect.height / 2 + (i % 2 ? -20 : 20));
  }
  await page.mouse.up();

  await expect(add).toBeEnabled({ timeout: 5000 });
  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(add).toBeDisabled();
});

test('an uploaded signature image is prepared in the worker', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'worker-heavy test');
  await openWorkspace(page);
  await page.getByRole('button', { name: 'Upload', exact: true }).click();
  // The fixture is a single opaque pixel; keep it rather than treating it as paper.
  await page.getByRole('checkbox', { name: 'Remove white background' }).uncheck();
  await page.locator('input[type="file"][accept^="image/"]').setInputFiles(path.join(__dirname, 'images', 'test-pixel.png'));
  await expect(page.getByRole('button', { name: 'Add to this page' })).toBeEnabled({ timeout: 10000 });
});

test('signing workspace fits a phone screen', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'worker-heavy test');
  await page.setViewportSize({ width: 390, height: 844 });
  await openWorkspace(page);
  await expect(await placeTypedSignature(page)).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1))
    .toBe(true);
});
