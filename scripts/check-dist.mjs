// Post-build release gate: static HTML content parity, SEO tags, routes, sitemap, internal links and media budget.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const SITE = 'https://kshitijsharma2204.github.io';
const BASE = '/portfolio/';
const errors = [];
const check = (cond, msg) => { if (!cond) errors.push(msg); };
const json = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

if (!existsSync(dist)) {
  console.error('✗ dist/ not found — run npm run build');
  process.exit(1);
}
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
const files = walk(dist);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'");
const page = (rel) => {
  const f = join(dist, rel, 'index.html');
  return existsSync(f) ? readFileSync(f, 'utf8') : null;
};
const text = (html) => decode(html.replace(/<template[\s\S]*?<\/template>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
const attr = (html, re) => decode(html.match(re)?.[1] ?? '');
const canonicalOf = (html) => attr(html, /<link rel="canonical" href="([^"]+)"/);
const ldOf = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => {
    try { return JSON.parse(m[1]); } catch { errors.push('invalid JSON-LD'); return {}; }
  });

const { projects } = json('src/data/projects.json');
const pres = json('src/data/presentation.json').projects;
const { experienceData } = json('src/data/experience.json');
const name = (p) => pres[p.id].displayTitle ?? p.title;
const norm = (s) => s.replace(/\s+/g, ' ').trim();

// --- Deployment basics
check(existsSync(join(dist, '.nojekyll')), 'dist/.nojekyll missing (GitHub Pages would strip _astro/)');
check(existsSync(join(dist, '404.html')), 'dist/404.html missing');
check(existsSync(join(dist, 'robots.txt')), 'dist/robots.txt missing');

// --- Every HTML page: one H1, lang, title, description, canonical
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  const rel = relative(dist, f);
  const legacy = /http-equiv="refresh"/.test(html);
  check(/<html lang="en"/.test(html), `${rel}: missing <html lang>`);
  check(/<title>[^<]+<\/title>/.test(html), `${rel}: missing <title>`);
  const noindex = /<meta name="robots" content="noindex"/.test(html);
  check(noindex || canonicalOf(html).startsWith(SITE + BASE), `${rel}: missing/incorrect canonical`);
  check(!noindex || rel === '404.html', `${rel}: unexpected noindex`);
  if (!legacy) {
    check((html.replace(/<template[\s\S]*?<\/template>/g, '').match(/<h1[\s>]/g) ?? []).length === 1, `${rel}: expected exactly one <h1>`);
    check(/<meta name="description" content="[^"]{20,}"/.test(html), `${rel}: missing meta description`);
    check(/<meta property="og:image" content="https:\/\/[^"]+"/.test(html), `${rel}: missing og:image`);
    ldOf(html);
  }
  // Media budget: GIFs may only be linked (user action), never loaded by <img>/<video>/<source>/preload.
  check(!/(?:src|srcset|poster|data-mp4|data-webm)="[^"]*\.gif/i.test(html), `${rel}: a GIF is loaded without user action`);
  check(!/<link[^>]+rel="preload"[^>]+\.gif/i.test(html), `${rel}: GIF preload`);
}

// --- Home
const home = page('');
check(home, 'home page missing');
if (home) {
  check(/<title>Kshitij Sharma \| Robotics &amp; Perception Software Engineer<\/title>/.test(home), 'home: wrong <title>');
  check(/<h1[^>]*>Kshitij Sharma<\/h1>/.test(home), 'home: H1 must be "Kshitij Sharma"');
  check(
    home.includes('content="Kshitij Sharma is a Perception Software Engineer at Lucid Motors and WPI robotics graduate. Explore projects in LiDAR, SLAM, sensor fusion and motion planning."'),
    'home: meta description mismatch',
  );
  check(canonicalOf(home) === SITE + BASE, 'home: canonical must be the site root');
  const ld = ldOf(home).find((o) => o['@type'] === 'ProfilePage');
  check(ld?.mainEntity?.name === 'Kshitij Sharma' && ld?.mainEntity?.worksFor?.name === 'Lucid Motors', 'home: ProfilePage JSON-LD incomplete');
  for (const id of ['bio', 'projects', 'skills', 'experience']) check(home.includes(`id="${id}"`), `home: #${id} anchor missing`);
  const featured = projects.filter((p) => pres[p.id].featuredRank);
  const cards = (home.match(/<article[^>]+data-project=/g) ?? []).length;
  check(cards === 6, `home: expected 6 featured cards, found ${cards}`);
  const t = text(home);
  for (const p of featured) {
    check(t.includes(name(p)) && t.includes(p.mainDescr), `home: featured ${p.id} title/summary missing`);
    check(home.includes(`href="${p.link}"`), `home: featured ${p.id} GitHub link missing`);
    check(home.includes(`href="${BASE}projects/${pres[p.id].slug}/"`), `home: featured ${p.id} case-study link missing`);
  }
  for (const e of experienceData) check(t.includes(e.role), `home: experience role missing: ${e.role}`);
}

// --- All projects gallery: all 13 cards in static HTML (works without JS)
const gallery = page('projects');
check(gallery, 'projects index missing');
if (gallery) {
  const cards = (gallery.match(/<article[^>]+data-project=/g) ?? []).length;
  check(cards === projects.length, `projects: expected ${projects.length} cards, found ${cards}`);
  const t = text(gallery);
  for (const p of projects) {
    check(t.includes(name(p)) && t.includes(p.mainDescr), `projects: ${p.id} title/summary missing`);
    check(gallery.includes(`href="${p.link}"`), `projects: ${p.id} GitHub link missing`);
    check(gallery.includes(`href="${BASE}projects/${pres[p.id].slug}/"`), `projects: ${p.id} case-study link missing`);
  }
  for (const g of new Set(projects.map((p) => p.group))) check(t.includes(g), `projects: category "${g}" missing`);
}

// --- 13 detail pages with full original content + legacy compatibility pages
for (const p of projects) {
  const slug = pres[p.id].slug;
  const html = page(`projects/${slug}`);
  if (!html) { errors.push(`detail page missing: projects/${slug}/`); continue; }
  const t = text(html);
  check(new RegExp(`<h1[^>]*>${name(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/&/g, '&amp;')}</h1>`).test(html), `${slug}: H1 mismatch`);
  check(html.includes(`<title>${name(p).replace(/&/g, '&amp;')} | Kshitij Sharma</title>`), `${slug}: <title> mismatch`);
  check(canonicalOf(html) === `${SITE}${BASE}projects/${slug}/`, `${slug}: canonical mismatch`);
  check(t.includes(p.mainDescr), `${slug}: mainDescr missing`);
  check(t.includes(norm(p.description)), `${slug}: description missing`);
  check(t.includes(p.group), `${slug}: group missing`);
  for (const s of p.skills) check(t.includes(s), `${slug}: skill missing: ${s}`);
  check(html.includes(`href="${p.link}"`), `${slug}: GitHub link missing`);
  check(html.includes(`href="${BASE}${p.image.slice(1)}"`), `${slug}: link to original media missing`);
  for (const img of p.images) check(html.includes(`href="${BASE}${img.slice(1)}"`), `${slug}: original gallery link missing: ${img}`);
  check(p.images.length > 0 || !/id="gallery"/.test(html), `${slug}: empty gallery section rendered`);
  check(ldOf(html).some((o) => o['@type'] === 'BreadcrumbList'), `${slug}: BreadcrumbList JSON-LD missing`);

  const legacy = page(`projects/${p.id}`);
  check(legacy && canonicalOf(legacy) === `${SITE}${BASE}projects/${slug}/` && legacy.includes(`url=${BASE}projects/${slug}/`),
    `legacy route projects/${p.id}/ missing or not pointing to ${slug}`);
}
const all = page('projects/all');
check(all && all.includes(`url=${BASE}projects/`), 'legacy route projects/all/ missing');

// --- Experience + about
const exp = page('experience');
if (exp) {
  const t = text(exp);
  for (const e of experienceData) {
    check(t.includes(e.date) && t.includes(e.role), `experience: ${e.role} missing`);
    for (const d of e.description) check(t.includes(norm(d)), `experience: bullet missing: ${d.slice(0, 50)}…`);
  }
} else errors.push('experience page missing');
const about = page('about');
const bio = json('src/data/bio.json').bio;
check(about && about.includes(bio), 'about: original biography missing or altered');
check(page('contact'), 'contact page missing');

// --- Sitemap: canonical, 200-able URLs only
const sitemapFile = join(dist, 'sitemap.xml');
check(existsSync(sitemapFile), 'sitemap.xml missing');
if (existsSync(sitemapFile)) {
  const locs = [...readFileSync(sitemapFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  check(locs.length === projects.length + 5, `sitemap: expected ${projects.length + 5} URLs, found ${locs.length}`);
  for (const loc of locs) {
    const rel = loc.replace(SITE + BASE, '');
    const html = page(rel);
    check(html, `sitemap: ${loc} has no page`);
    if (html) check(canonicalOf(html) === loc, `sitemap: ${loc} does not match its canonical`);
    check(!/\/project-\d+\/|\/projects\/all\//.test(loc), `sitemap: legacy URL listed: ${loc}`);
  }
}

// --- Internal links / assets resolve under the base path
let linkCount = 0;
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  const refs = [...html.matchAll(/(?:href|src|poster|data-mp4|data-webm|content)="([^"]+)"/g)].map((m) => m[1]);
  for (const s of html.matchAll(/srcset="([^"]+)"/g)) refs.push(...s[1].split(',').map((c) => c.trim().split(/\s+/)[0]));
  for (let ref of refs) {
    ref = decode(ref);
    if (ref.startsWith(SITE)) ref = ref.slice(SITE.length);
    if (!ref.startsWith('/')) continue;
    if (!ref.startsWith(BASE)) { errors.push(`${relative(dist, f)}: link outside base path: ${ref}`); continue; }
    const clean = decodeURIComponent(ref.slice(BASE.length).split(/[?#]/)[0]);
    const target = join(dist, clean);
    const ok = clean === '' ? existsSync(join(dist, 'index.html'))
      : existsSync(target) && (statSync(target).isFile() || existsSync(join(target, 'index.html')));
    check(ok, `${relative(dist, f)}: broken internal reference ${ref}`);
    linkCount++;
  }
}

if (errors.length) {
  console.error(`✗ dist checks: ${errors.length} problem(s)\n  - ${[...new Set(errors)].join('\n  - ')}`);
  process.exit(1);
}
console.log(`✓ dist checks: ${htmlFiles.length} HTML files, ${linkCount} internal references, sitemap, SEO tags, content parity and media budget OK.`);
