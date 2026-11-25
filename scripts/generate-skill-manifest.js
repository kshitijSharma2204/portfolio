// scripts/generate-skill-manifest.js
// Writes public/assets/skills/skills-manifest.json listing the skill icon images.
// The homepage #skills section reads this manifest at build time (the v1 site fetched it at runtime).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'skills');
const out = path.join(dir, 'skills-manifest.json');

let files;
try {
  files = fs.readdirSync(dir);
} catch (err) {
  console.error('Could not read skills folder:', err);
  process.exit(1);
}
// Keep only images; byte-order sort keeps output stable across filesystems.
const imgs = files.filter((f) => /\.(png|jpe?g|svg)$/.test(f)).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
fs.writeFileSync(out, JSON.stringify(imgs, null, 2));
console.log(`Wrote ${imgs.length} entries to skills-manifest.json`);
