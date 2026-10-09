// Captures the real Image Compress flow (empty -> loaded -> result), cropped to the app chrome only.
const { chromium } = require('@playwright/test');
const path = require('path');

const out = path.join(__dirname, 'assets');
const clip = { x: 0, y: 0, width: 1440, height: 700 };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000/tools/image-compress');
  // Hide the Next dev overlay so footage looks like production.
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  await page.waitForTimeout(1200);
  await page.setInputFiles('input[type=file]', path.join(out, 'sunset-shoot.jpg'));
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Compress Images' }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(out, '04-processing.png'), clip });
  await page.waitForTimeout(6000);
  await page.screenshot({ path: path.join(out, '05-result.png'), clip });
  await page.screenshot({ path: path.join(out, '05-result-full.png') });
  console.log(await page.locator('main').innerText());
  await browser.close();
})();
