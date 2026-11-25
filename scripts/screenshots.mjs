// Captures every page type in both themes at mobile and desktop widths.
// Usage: npm run preview (in another terminal), then: node scripts/screenshots.mjs [baseUrl] [outDir]
//   baseUrl defaults to http://127.0.0.1:4321/portfolio/ ; pass https://kshitijsharma2204.github.io/portfolio/ for the live site.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.argv[2] ?? 'http://127.0.0.1:4321/portfolio/';
const out = process.argv[3] ?? 'reports/screenshots';
const pages = (process.env.PAGES ?? '/,projects/,projects/lidar-odometry-slam-stack/,projects/kitti-semantic-segmentation/,experience/,about/,contact/,404-check/')
  .split(',');
const widths = (process.env.WIDTHS ?? '390,1440').split(',').map(Number);
const themes = (process.env.THEMES ?? 'dark,light').split(',');
const fullPage = process.env.FULL !== '0';

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const theme of themes) {
  for (const width of widths) {
    const ctx = await browser.newContext({
      viewport: { width, height: width < 600 ? 844 : 900 },
      colorScheme: theme,
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    for (const p of pages) {
      const url = new URL(p === '/' ? '' : p, base).href;
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const name = (p.replace(/\/$/, '').replace(/[^a-z0-9]+/gi, '_') || 'home') + `_${width}_${theme}.png`;
      await page.screenshot({ path: join(out, name), fullPage });
      console.log('saved', join(out, name));
    }
    await ctx.close();
  }
}
await browser.close();
