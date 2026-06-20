import { test, expect, type Page } from '@playwright/test';
import path from 'path';

const TEST_IMAGES = {
  png: path.join(__dirname, 'images', 'test-pixel.png'),
  jpg: path.join(__dirname, 'images', 'test-pixel.jpg'),
  webp: path.join(__dirname, 'images', 'test-pixel.webp'),
};

const TEST_FILES = {
  pdf: path.join(__dirname, 'files', 'test-document.pdf'),
};

const PDF_TOOL_ROUTES = [
  {
    path: '/tools/pdf-merge',
    heading: 'Merge PDF',
    uploadText: 'Upload PDF documents to collate (multiple allowed)',
  },
  {
    path: '/tools/pdf-split',
    heading: 'Split PDF',
    uploadText: 'Upload PDF document to split',
  },
  {
    path: '/tools/pdf-compress',
    heading: 'Compress PDF',
    uploadText: 'Upload PDF document to compress',
  },
  {
    path: '/tools/pdf-rotate',
    heading: 'Rotate PDF',
    uploadText: 'Upload PDF document to rotate',
  },
  {
    path: '/tools/pdf-metadata-remove',
    heading: 'PDF Metadata Remover',
    uploadText: 'Upload PDF document to scrub metadata',
  },
  {
    path: '/tools/pdf-reorder',
    heading: 'PDF Page Reorder',
    uploadText: 'Upload PDF document to reorder pages',
  },
  {
    path: '/tools/pdf-to-image',
    heading: 'PDF to Image',
    uploadText: 'Upload PDF document to extract as images',
  },
  {
    path: '/tools/image-to-pdf',
    heading: 'Image to PDF',
    uploadText: 'Upload images to compile (JPEG, PNG)',
  },
];

const NEW_IMAGE_TOOL_ROUTES = [
  {
    path: '/tools/image-resize-crop',
    heading: 'Image Resize & Crop',
    uploadText: 'Upload one image to resize and crop',
  },
  {
    path: '/tools/image-metadata-remove',
    heading: 'Image Metadata Remover',
    uploadText: 'Upload images to scrub metadata',
  },
];

const RESPONSIVE_TOOL_ROUTES = [...PDF_TOOL_ROUTES, ...NEW_IMAGE_TOOL_ROUTES];

const RESPONSIVE_VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 800 },
];

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(async () =>
      page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
    )
    .toBe(true);
}

async function uploadFile(page: Page, filePath: string) {
  await page.locator('input[type="file"]').first().setInputFiles(filePath);
}

async function expectDownloadLink(page: Page, name: string | RegExp = /Download/) {
  const link = page.getByRole('link', { name });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', /^blob:/);
}

async function expectProcessingOrComplete(page: Page, processingText: string, completionHeading: string) {
  const processing = page.getByText(processingText);
  const complete = page.getByRole('heading', { name: completionHeading });

  await expect(async () => {
    const isProcessing = await processing.isVisible();
    const isComplete = await complete.isVisible();
    expect(isProcessing || isComplete).toBeTruthy();
  }).toPass({ timeout: 60000 });
}

test.describe('Tools app coverage', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER CONSOLE] [${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => console.error('[BROWSER EXCEPTION]', err));
    page.on('request', request => {
      if (request.url().includes('worker') || request.url().includes('wasm') || request.url().includes('img.ly')) {
        console.log(`[BROWSER REQ] ${request.method()} ${request.url()}`);
      }
    });
    page.on('response', response => {
      if (response.url().includes('worker') || response.url().includes('wasm') || response.url().includes('img.ly')) {
        console.log(`[BROWSER RES] ${response.status()} ${response.url()}`);
      }
    });
  });

  test('Directory Page Navigation & Layout', async ({ page }) => {
    // Navigate to tools directory
    await page.goto('/tools');

    // Verify page hero
    await expect(page.getByRole('heading', { name: 'Client-Side Tools Directory' })).toBeVisible();

    // Verify Phase 1 Tool cards are present
    const compressCard = page.getByRole('heading', { name: 'Image Compress' });
    const imageConverterCard = page.getByRole('heading', { name: 'Image Converter' });
    const resizeCropCard = page.getByRole('heading', { name: 'Image Resize & Crop' });
    const imageMetadataCard = page.getByRole('heading', { name: 'Image Metadata Remover' });
    const removeBgCard = page.getByRole('heading', { name: 'Remove Background' });

    await expect(compressCard).toBeVisible();
    await expect(imageConverterCard).toBeVisible();
    await expect(resizeCropCard).toBeVisible();
    await expect(imageMetadataCard).toBeVisible();
    await expect(removeBgCard).toBeVisible();

    for (const tool of PDF_TOOL_ROUTES) {
      await expect(page.getByRole('heading', { name: tool.heading })).toBeVisible();
    }

    // Verify navigation by clicking the Image Compress card
    await page.locator('main a[href="/tools/image-compress"]').click();
    await expect(page).toHaveURL('/tools/image-compress');
    await expect(page.getByRole('heading', { name: 'Image Compress', exact: true })).toBeVisible();
  });

  test('Image Converter handles JPG and WEBP inputs', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip worker-based tests on Webkit');
    await page.goto('/tools/image-convert');

    await expect(page.getByRole('heading', { name: 'Image Converter', exact: true })).toBeVisible();

    // Upload multiple legacy converter inputs; default target format is PNG.
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([TEST_IMAGES.jpg, TEST_IMAGES.webp]);

    await expect(page.getByRole('button', { name: 'Convert Images' })).toBeEnabled();

    // Click convert
    await page.getByRole('button', { name: 'Convert Images' }).click();

    // Wait for completion
    await expect(page.getByRole('heading', { name: 'Conversion Complete' })).toBeVisible();

    // Verify both legacy input formats convert through the unified Image Converter route.
    await expect(page.getByText('test-pixel.png')).toHaveCount(2);
    await expect(page.getByRole('link', { name: 'Download' })).toHaveCount(2);
  });

  test('Remove Background Tool upload flow', async ({ page }) => {
    await page.goto('/tools/image-remove-bg');

    await expect(page.getByRole('heading', { name: 'Remove Background', exact: true })).toBeVisible();

    // Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGES.png);

    await expect(page.getByText('Selected Files (1)').first()).toBeVisible();
    await expect(page.getByText('test-pixel.png').first()).toBeVisible();

    // Click Remove Background button
    const removeBgButton = page.getByRole('button', { name: 'Remove Background' });
    await expect(removeBgButton).toBeEnabled();
  });

  test('Image Resize & Crop transforms an uploaded image', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip worker-based tests on Webkit');
    await page.goto('/tools/image-resize-crop');

    await expect(page.getByRole('heading', { name: 'Image Resize & Crop', exact: true })).toBeVisible();
    await uploadFile(page, TEST_IMAGES.png);

    await expect(page.getByText('Source:')).toBeVisible();
    await page.getByLabel('Target width').fill('1');
    await page.getByLabel('Target height').fill('1');
    await page.getByRole('button', { name: 'Resize & Crop' }).click();

    await expect(page.getByRole('heading', { name: 'Image Ready' })).toBeVisible({ timeout: 60000 });
    await expectDownloadLink(page, 'Download Image');
  });

  test('Image Metadata Remover re-encodes uploaded images', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip worker-based tests on Webkit');
    await page.goto('/tools/image-metadata-remove');

    await expect(page.getByRole('heading', { name: 'Image Metadata Remover', exact: true })).toBeVisible();
    await uploadFile(page, TEST_IMAGES.png);

    await expect(page.getByText('Selected Files (1)').first()).toBeVisible();
    await expect(page.getByText('test-pixel.png').first()).toBeVisible();
    await page.getByRole('button', { name: 'Remove Metadata' }).click();

    await expect(page.getByRole('heading', { name: 'Metadata Removed' })).toBeVisible({ timeout: 60000 });
    await expectDownloadLink(page, 'Download');
  });

  test('Merge PDF processes an uploaded PDF', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip worker-based PDF processing on Webkit');
    test.setTimeout(90000);
    await page.goto('/tools/pdf-merge');

    await expect(page.getByRole('heading', { name: 'Merge PDF', exact: true })).toBeVisible();
    await uploadFile(page, TEST_FILES.pdf);

    await expect(page.getByText('Light Table Collation')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('test-document.pdf').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Collate & Merge' })).toBeEnabled();

    await page.getByRole('button', { name: 'Collate & Merge' }).click();
    await expect(page.getByRole('heading', { name: 'Collation Complete' })).toBeVisible({ timeout: 60000 });
    await expectDownloadLink(page, 'Download PDF');
  });

  test('Split PDF starts extracting pages from an uploaded PDF', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip worker-based PDF processing on Webkit');
    test.setTimeout(90000);
    await page.goto('/tools/pdf-split');

    await expect(page.getByRole('heading', { name: 'Split PDF', exact: true })).toBeVisible();
    await uploadFile(page, TEST_FILES.pdf);

    await expect(page.getByText('Select Pages to Keep')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Total Pages:')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Extract 2 Pages' })).toBeEnabled();
    await page.getByRole('button', { name: 'Extract 2 Pages' }).click();

    await expectProcessingOrComplete(page, 'Extracting selected pages...', 'Extraction Complete');
  });

  test('Compress PDF starts processing an uploaded PDF', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip worker-based PDF processing on Webkit');
    test.setTimeout(90000);
    await page.goto('/tools/pdf-compress');

    await expect(page.getByRole('heading', { name: 'Compress PDF', exact: true })).toBeVisible();
    await uploadFile(page, TEST_FILES.pdf);

    await expect(page.getByText('Document Details')).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: 'Deep (Rasterize)' }).click();
    await expect(page.getByRole('button', { name: 'Start Compression' })).toBeEnabled();
    await page.getByRole('button', { name: 'Start Compression' }).click();

    await expect(page.getByText('Rasterizing and compressing pages...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Compression' })).toBeDisabled();
  });

  test('Rotate PDF starts exporting rotated pages from an uploaded PDF', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip worker-based PDF processing on Webkit');
    test.setTimeout(90000);
    await page.goto('/tools/pdf-rotate');

    await expect(page.getByRole('heading', { name: 'Rotate PDF', exact: true })).toBeVisible();
    await uploadFile(page, TEST_FILES.pdf);

    await expect(page.getByText('Workspace pages')).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('button', { name: /Rotate All 90/ })).toBeEnabled();
    await page.getByRole('button', { name: /Rotate All 90/ }).click();
    await page.getByRole('button', { name: 'Save & Export' }).click();

    await expectProcessingOrComplete(page, 'Compiling rotations...', 'Page Rotation Saved');
  });

  test('PDF Metadata Remover scrubs an uploaded PDF', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip worker-based PDF processing on Webkit');
    test.setTimeout(90000);
    await page.goto('/tools/pdf-metadata-remove');

    await expect(page.getByRole('heading', { name: 'PDF Metadata Remover', exact: true })).toBeVisible();
    await uploadFile(page, TEST_FILES.pdf);

    await expect(page.getByText('File Details')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('test-document.pdf')).toBeVisible();
    await page.getByRole('button', { name: 'Remove Metadata' }).click();

    await expect(page.getByRole('heading', { name: 'Metadata Removed' })).toBeVisible({ timeout: 60000 });
    await expectDownloadLink(page, 'Download PDF');
  });

  test('PDF Page Reorder exports uploaded PDF pages', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip worker-based PDF processing on Webkit');
    test.setTimeout(90000);
    await page.goto('/tools/pdf-reorder');

    await expect(page.getByRole('heading', { name: 'PDF Page Reorder', exact: true })).toBeVisible();
    await uploadFile(page, TEST_FILES.pdf);

    await expect(page.getByText('Page reorder workspace')).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('button', { name: 'Export Reordered PDF' })).toBeEnabled();
    await page.getByRole('button', { name: 'Export Reordered PDF' }).click();

    await expect(page.getByRole('heading', { name: 'Reorder Complete' })).toBeVisible({ timeout: 60000 });
    await expectDownloadLink(page, 'Download PDF');
  });

  test('PDF to Image starts converting an uploaded PDF into images', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip worker-based PDF processing on Webkit');
    test.setTimeout(90000);
    await page.goto('/tools/pdf-to-image');

    await expect(page.getByRole('heading', { name: 'PDF to Image', exact: true })).toBeVisible();
    await uploadFile(page, TEST_FILES.pdf);

    await expect(page.getByText('Document details')).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('button', { name: 'Convert PDF Pages' })).toBeEnabled();
    await page.getByRole('button', { name: 'Convert PDF Pages' }).click();

    await expect(page.getByText('Initializing page conversion...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Convert PDF Pages' })).toBeDisabled();
  });

  test('Image to PDF starts compiling uploaded images into a PDF', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Skip worker-based PDF processing on Webkit');
    test.setTimeout(90000);
    await page.goto('/tools/image-to-pdf');

    await expect(page.getByRole('heading', { name: 'Image to PDF', exact: true })).toBeVisible();
    await uploadFile(page, TEST_IMAGES.png);

    await expect(page.getByText('Images collation')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('test-pixel.png')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Compile PDF' })).toBeEnabled();
    await page.getByRole('button', { name: 'Compile PDF' }).click();

    await expectProcessingOrComplete(page, 'Compiling images into PDF pages...', 'PDF Compiled');
  });

  for (const tool of RESPONSIVE_TOOL_ROUTES) {
    test(`${tool.heading} page is responsive`, async ({ page }) => {
      for (const viewport of RESPONSIVE_VIEWPORTS) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(tool.path);

        await expect(page).toHaveURL(tool.path);
        await expect(page.getByRole('heading', { name: tool.heading, exact: true })).toBeVisible();
        await expect(page.getByText(tool.uploadText)).toBeVisible();
        await expectNoHorizontalOverflow(page);
      }
    });
  }
});
