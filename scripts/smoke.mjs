// Browser smoke test: drives the game through menu → play → drops/merges
// → pause → dex, taking screenshots along the way.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const OUT = 'scripts/shots';
mkdirSync(OUT, { recursive: true });

const exe = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await (await browser.newContext({
  viewport: { width: 420, height: 740 },
  hasTouch: true,
})).newPage();

const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(process.env.GAME_URL || 'http://localhost:5175', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/1-menu.png` });

// Game-space (420x720) → client px. Canvas fills viewport, letterboxed.
const view = page.viewportSize();
const scale = Math.min(view.width / 420, view.height / 720);
const ox = (view.width - 420 * scale) / 2;
const oy = (view.height - 720 * scale) / 2;
const px = (gx, gy) => [ox + gx * scale, oy + gy * scale];

// Tap PLAY (110,392,200x66 → center 210,425)
let [x, y] = px(210, 425);
await page.mouse.click(x, y);
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/2-play-start.png` });

// Drop several animals near the center so same tiers meet and merge
const spots = [200, 220, 210, 205, 215, 210, 200, 220, 210, 208];
for (const gx of spots) {
  [x, y] = px(gx, 400);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(620);
}
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/3-after-drops.png` });

// Read game state for assertions
const snap = await page.evaluate(() => {
  // state is module-scoped; sniff via canvas presence + localStorage profile
  return {
    profile: localStorage.getItem('dropimals_profile_v2'),
  };
});

// Pause screen
[x, y] = px(36, 36);
await page.mouse.click(x, y);
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/4-pause.png` });

// Resume → back to menu via pause
[x, y] = px(210, 446); // toMenu (110,420,200x52)
await page.mouse.click(x, y);
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/5-menu-again.png` });

// Dropidex
[x, y] = px(210, 504); // dex button (110,478,200x52)
await page.mouse.click(x, y);
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/6-dex.png` });

console.log('PROFILE:', snap.profile);
console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
await browser.close();
