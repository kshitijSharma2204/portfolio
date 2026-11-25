// Lab performance measurement: N Lighthouse runs per page × form factor, reported as medians.
// Usage: node scripts/lighthouse.mjs <baseUrl> <outPrefix> [runs=3]
//   e.g. node scripts/lighthouse.mjs http://127.0.0.1:4322/portfolio/ reports/v2.2/lighthouse-candidate 3
// Needs Chrome/Chromium (set CHROME_PATH if not auto-detected). Lab numbers are not field (CrUX) data.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const [base = 'http://127.0.0.1:4322/portfolio/', outPrefix = 'reports/lighthouse', runsArg = '3'] = process.argv.slice(2);
const runs = Number(runsArg);
const LH = 'lighthouse@13.6.0';
const pages = ['', 'projects/', 'projects/lidar-odometry-slam-stack/'];
const forms = ['mobile', 'desktop'];
const tmp = `${outPrefix}-runs`;
mkdirSync(tmp, { recursive: true });

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const kb = (b) => Math.round(b / 1024);

const results = [];
for (const page of pages) {
  for (const form of forms) {
    const samples = [];
    for (let i = 1; i <= runs; i++) {
      const out = join(tmp, `${(page || 'home').replace(/\W+/g, '_')}-${form}-${i}.json`);
      const args = ['-y', LH, base + page, '--quiet', '--output=json', `--output-path=${out}`,
        '--chrome-flags=--headless=new --no-sandbox'];
      if (form === 'desktop') args.push('--preset=desktop'); else args.push('--form-factor=mobile');
      execFileSync('npx', args, { stdio: 'ignore', env: process.env });
      const r = JSON.parse(readFileSync(out, 'utf8'));
      const reqs = r.audits['network-requests']?.details?.items ?? [];
      const by = (t) => reqs.filter((q) => q.resourceType === t).reduce((a, q) => a + (q.transferSize || 0), 0);
      samples.push({
        performance: r.categories.performance.score * 100,
        accessibility: r.categories.accessibility.score * 100,
        bestPractices: r.categories['best-practices'].score * 100,
        seo: r.categories.seo.score * 100,
        lcpMs: r.audits['largest-contentful-paint'].numericValue,
        cls: r.audits['cumulative-layout-shift'].numericValue,
        tbtMs: r.audits['total-blocking-time'].numericValue,
        transferKB: kb(r.audits['total-byte-weight'].numericValue),
        requests: reqs.length,
        htmlKB: kb(by('Document')), jsKB: kb(by('Script')), cssKB: kb(by('Stylesheet')),
        imgKB: kb(by('Image')), fontKB: kb(by('Font')), mediaKB: kb(by('Media')),
        gifRequests: reqs.filter((q) => /\.gif(\?|$)/i.test(q.url)).length,
        lighthouse: r.lighthouseVersion, chrome: r.environment?.hostUserAgent?.match(/Chrome\/[\d.]+/)?.[0],
      });
      process.stdout.write('.');
    }
    const keys = Object.keys(samples[0]).filter((k) => typeof samples[0][k] === 'number');
    const med = Object.fromEntries(keys.map((k) => [k, median(samples.map((s) => s[k]))]));
    const spread = Object.fromEntries(['performance', 'lcpMs'].map((k) => [k, [Math.min(...samples.map((s) => s[k])), Math.max(...samples.map((s) => s[k]))]]));
    results.push({ page: page || '/', form, runs, median: med, range: spread, lighthouse: samples[0].lighthouse, chrome: samples[0].chrome });
  }
}
process.stdout.write('\n');

mkdirSync(dirname(outPrefix), { recursive: true });
writeFileSync(`${outPrefix}.json`, JSON.stringify({ base, measuredAt: new Date().toISOString(), results }, null, 2) + '\n');
const row = (r) => {
  const m = r.median;
  return `| ${r.page} | ${r.form} | ${m.performance} (${r.range.performance.join('–')}) | ${m.accessibility} | ${m.bestPractices} | ${m.seo} | ${(m.lcpMs / 1000).toFixed(2)} s | ${m.cls.toFixed(3)} | ${Math.round(m.tbtMs)} ms | ${m.transferKB} | ${m.requests} | ${m.htmlKB}/${m.cssKB}/${m.jsKB} | ${m.gifRequests} |`;
};
const md = [
  `Lighthouse ${results[0].lighthouse}, ${results[0].chrome}, ${runs} runs each (median; performance range in brackets). Base: ${base}`,
  '',
  '| Page | Device | Perf | A11y | BP | SEO | LCP | CLS | TBT | Transfer KB | Requests | HTML/CSS/JS KB | GIF reqs |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|---|',
  ...results.map(row),
].join('\n');
writeFileSync(`${outPrefix}.md`, md + '\n');
console.log(md);
