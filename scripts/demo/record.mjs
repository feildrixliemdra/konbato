// Automated Konbato promo capture: drives the real app, bakes in captions,
// and captures smooth frames via CDP screencast. Encode afterwards with ffmpeg.
// Run: node scripts/demo/record.mjs   (requires the app serving on :3000)
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, 'assets');
const FRAMES = path.join(__dirname, 'frames');
const PROFILE = path.join(__dirname, '.profile');
const BASE = 'http://localhost:3000';
const W = 1280;
const H = 720;

const CAPTION_CSS = `
#demo-caption { position: fixed; left:0; right:0; bottom:36px; display:flex; justify-content:center; z-index:99999; pointer-events:none; }
#demo-caption .pill { background: rgba(8,10,16,0.86); color:#fff; font-family:'Segoe UI',system-ui,-apple-system,sans-serif; font-size:26px; font-weight:600; letter-spacing:0.2px; padding:14px 30px; border-radius:999px; box-shadow:0 10px 40px rgba(0,0,0,0.4); backdrop-filter:blur(8px); text-align:center; max-width:88%; transition:opacity .25s ease; }
`;

fs.rmSync(FRAMES, { recursive: true, force: true });
fs.mkdirSync(FRAMES, { recursive: true });

const browser = await chromium.launchPersistentContext(PROFILE, {
  headless: true,
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
});
const page = browser.pages()[0] ?? (await browser.newPage());
await page.setViewportSize({ width: W, height: H });

// --- screencast capture ---
let frameIndex = 0;
const cdp = await page.context().newCDPSession(page);
await cdp.send('Page.startScreencast', {
  format: 'jpeg',
  quality: 82,
  maxWidth: W,
  maxHeight: H,
  everyNthFrame: 1,
});
cdp.on('Page.screencastFrame', async (ev) => {
  const { data, sessionId } = ev;
  fs.writeFileSync(
    path.join(FRAMES, `frame_${String(frameIndex++).padStart(5, '0')}.jpg`),
    Buffer.from(data, 'base64')
  );
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});

const startedAt = Date.now();

// --- helpers ---
const sleep = (ms) => page.waitForTimeout(ms);

async function injectChrome() {
  await page.addStyleTag({ content: CAPTION_CSS });
  await page.evaluate(() => {
    const el = document.createElement('div');
    el.id = 'demo-caption';
    el.innerHTML = '<div class="pill" id="demo-caption-pill"></div>';
    document.body.appendChild(el);
  });
}

async function goto(url) {
  await page.goto(BASE + url, { waitUntil: 'load' });
  await sleep(350);
  await injectChrome();
}

async function caption(text) {
  await page.evaluate((t) => {
    const pill = document.getElementById('demo-caption-pill');
    if (pill) pill.textContent = t;
  }, text);
}

async function upload(filePath) {
  await page.locator('input[type=file]').first().setInputFiles(filePath);
}

// --- beat 0: intro ---
console.log('beat 0: intro');
await goto('/');
await caption('Image & PDF tools that never leave your device');
await sleep(3400);

// --- beat 1: remove background ---
console.log('beat 1: remove background');
await goto('/tools/image-remove-bg');
await caption('Remove any background — on-device AI');
await sleep(1200);
await upload(path.join(ASSETS, 'product.jpg'));
await page.getByRole('button', { name: 'Remove Background' }).waitFor({ timeout: 15000 });
await sleep(600);
await page.getByRole('button', { name: 'Remove Background' }).click();
// first run downloads the ~25MB model; a confirm dialog appears
const dl = page.getByRole('button', { name: 'Download & Process' });
if (await dl.isVisible({ timeout: 2500 }).catch(() => false)) {
  await dl.click();
}
await page.getByText('Background Removed').waitFor({ timeout: 120000 });
await caption('A local model. Zero uploads.');
await sleep(1400);
// smooth swipe across the before/after comparison
const box = await page.locator('#comparison-container').boundingBox();
if (box) {
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.12, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.88, y, { steps: 30 });
  await page.mouse.up();
}
await sleep(1800);

// --- beat 2: compress image ---
console.log('beat 2: compress image');
await goto('/tools/image-compress');
await caption('Compress images — watch the size drop');
await sleep(1200);
await upload(path.join(ASSETS, 'photo-large.jpg'));
await page.getByRole('button', { name: 'Compress Images' }).waitFor({ timeout: 15000 });
await sleep(500);
await page.getByRole('button', { name: 'Compress Images' }).click();
await page.getByText('Compression Complete').waitFor({ timeout: 30000 });
await caption('Optimized locally, in milliseconds');
await sleep(2600);

// --- beat 3: watermark ---
console.log('beat 3: watermark');
await goto('/tools/pdf-watermark');
await caption('Add a watermark with live preview');
await sleep(1200);
await upload(path.join(ASSETS, 'invoice.pdf'));
await page.getByRole('heading', { name: 'Preview' }).waitFor({ timeout: 20000 });
await sleep(1600);
await page.getByRole('button', { name: 'Apply Watermark' }).click();
await page.getByRole('heading', { name: 'Watermark Applied' }).waitFor({ timeout: 60000 });
await caption('Flattened, so it can\u2019t be removed');
await sleep(2600);

// --- beat 4: outro ---
console.log('beat 4: outro');
await goto('/');
await caption('No uploads. No accounts.');
await sleep(1800);
await caption('konbato.vercel.app');
await sleep(2600);

await sleep(400);
const durationSec = (Date.now() - startedAt) / 1000;
await cdp.send('Page.stopScreencast').catch(() => {});
await browser.close();

const fps = (frameIndex / durationSec).toFixed(2);
console.log(`\nDONE frames=${frameIndex} duration=${durationSec.toFixed(2)}s fps=${fps}`);
console.log(`encode: ffmpeg -framerate ${fps} -i frames/frame_%05d.jpg -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart demo.mp4`);
