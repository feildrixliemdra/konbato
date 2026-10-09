// One-off capture of the real Image Compress flow, used as footage for the promo.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const out = path.join(__dirname, 'assets');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();

  // Build a detailed, photo-like JPEG so compression visibly saves bytes.
  await page.goto('http://localhost:3000/');
  const dataUrl = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 3000; c.height = 2000;
    const g = c.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, 2000);
    sky.addColorStop(0, '#ff9a5a'); sky.addColorStop(0.5, '#f4c27a'); sky.addColorStop(1, '#2b3a67');
    g.fillStyle = sky; g.fillRect(0, 0, 3000, 2000);
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 2500; i++) {
      g.fillStyle = `hsla(${r() * 360},60%,${30 + r() * 40}%,${0.15 + r() * 0.3})`;
      g.beginPath(); g.arc(r() * 3000, r() * 2000, 10 + r() * 120, 0, 7); g.fill();
    }
    g.fillStyle = '#10182e';
    g.beginPath(); g.moveTo(0, 1500);
    for (let x = 0; x <= 3000; x += 60) g.lineTo(x, 1250 + Math.sin(x / 210) * 160 + r() * 90);
    g.lineTo(3000, 2000); g.lineTo(0, 2000); g.fill();
    const img = g.getImageData(0, 0, 3000, 2000);
    for (let i = 0; i < img.data.length; i += 4) { const n = (r() - 0.5) * 36; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; }
    g.putImageData(img, 0, 0);
    return c.toDataURL('image/jpeg', 1.0);
  });
  const photo = path.join(out, 'sunset-shoot.jpg');
  fs.writeFileSync(photo, Buffer.from(dataUrl.split(',')[1], 'base64'));
  console.log('photo bytes', fs.statSync(photo).size);

  await page.screenshot({ path: path.join(out, '01-home.png') });
  await page.goto('http://localhost:3000/tools/image-compress');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(out, '02-empty.png') });
  await page.setInputFiles('input[type=file]', photo);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: path.join(out, '03-loaded.png') });
  console.log(await page.locator('button').allInnerTexts());
  await browser.close();
})();
