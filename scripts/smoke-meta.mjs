// Extended smoke: exercises the retention hub tabs + a full run to game over.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const OUT = 'scripts/shots';
mkdirSync(OUT, { recursive: true });

const exe = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await (await browser.newContext({ viewport: { width: 420, height: 740 }, hasTouch: true })).newPage();

const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('HTML5 SDK')) errors.push('console: ' + m.text()); });

await page.goto(process.env.GAME_URL || 'http://localhost:5177', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const view = page.viewportSize();
const scale = Math.min(view.width / 420, view.height / 720);
const ox = (view.width - 420 * scale) / 2;
const oy = (view.height - 720 * scale) / 2;
const px = (gx, gy) => [ox + gx * scale, oy + gy * scale];
const click = async (gx, gy, wait = 350) => { const [x, y] = px(gx, gy); await page.mouse.click(x, y); await page.waitForTimeout(wait); };

await page.screenshot({ path: `${OUT}/m1-menu.png` });

// Open Rewards hub (button at 214..310, y 478..530)
await click(262, 504, 500);
await page.screenshot({ path: `${OUT}/m2-orders.png` });

// Tabs across y~73: centers ~48,129,210,291,371
const tabX = [48, 129, 210, 291, 371];
const names = ['orders', 'season', 'album', 'shop', 'stats'];
for (let i = 1; i < tabX.length; i++) {
  await click(tabX[i], 73, 350);
  await page.screenshot({ path: `${OUT}/m3-${names[i]}.png` });
}

// Back to menu, then play a full run to game over.
await click(210, 694, 400); // BACK pill ~ y678+
await click(210, 425, 600); // PLAY

// Spam drops at the centre to force an overflow game-over.
for (let i = 0; i < 60; i++) {
  const [x, y] = px(150 + (i % 5) * 30, 300);
  await page.mouse.click(x, y);
  await page.waitForTimeout(180);
}
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/m4-after.png` });
// Dismiss any overlays (level-up / chest) then capture the result screen.
for (let i = 0; i < 4; i++) { await page.mouse.click(...px(210, 360)); await page.waitForTimeout(500); }
await page.screenshot({ path: `${OUT}/m5-result.png` });

const lvl = await page.evaluate(() => {
  const s = window.__state;
  return s ? { level: s.profile.level, coins: s.profile.coins, screen: s.screen, runReward: !!s.runReward } : null;
});
console.log('STATE:', JSON.stringify(lvl));
console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
await browser.close();
