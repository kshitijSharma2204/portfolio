// Records a SHA-256 inventory of the original content baseline (public/ data, media, résumé).
// Usage: node scripts/baseline-inventory.mjs [outFile]
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const pub = join(root, 'public');
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const files = walk(pub)
  .filter((p) => !p.includes(`${join('public', 'media')}`)) // generated derivatives are not baseline
  .sort()
  .map((p) => ({
    path: relative(root, p),
    bytes: statSync(p).size,
    sha256: createHash('sha256').update(readFileSync(p)).digest('hex'),
  }));

const out = process.argv[2] ?? join(root, 'docs/baseline/inventory.json');
const commit = execSync('git rev-parse HEAD', { cwd: root }).toString().trim();
writeFileSync(out, JSON.stringify({ sourceCommit: commit, generatedAt: new Date().toISOString(), files }, null, 2) + '\n');
console.log(`Wrote ${files.length} entries to ${relative(root, out)}`);
