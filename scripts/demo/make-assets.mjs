// Generates demo assets: renders demo-invoice.html to a multi-page PDF.
// Run: node scripts/demo/make-assets.mjs
import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'demo-invoice.html');
const outPath = path.join(__dirname, 'assets', 'invoice.pdf');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'load' });
await page.pdf({
  path: outPath,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
});
await browser.close();
console.log('wrote', outPath);
