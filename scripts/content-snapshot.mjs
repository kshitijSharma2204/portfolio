// Content snapshot + reviewable diff (not a lock — legitimate edits are expected; this makes them visible).
//   node scripts/content-snapshot.mjs           → write docs/v2.2-content-snapshot.json from current data
//   node scripts/content-snapshot.mjs --diff    → print field-level changes vs. the snapshot (exit 0 either way)
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const SNAP = join(root, 'docs/v2.2-content-snapshot.json');
const json = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const sha = (p) => createHash('sha256').update(readFileSync(join(root, 'public', p))).digest('hex');
const FIELDS = ['title', 'mainDescr', 'description', 'image', 'images', 'link', 'group', 'skills'];

function current() {
  const { projects } = json('src/data/projects.json');
  const pres = json('src/data/presentation.json').projects;
  return {
    projects: Object.fromEntries(projects.map((p) => [p.id, {
      ...Object.fromEntries(FIELDS.map((k) => [k, p[k]])),
      slug: pres[p.id]?.slug,
      featuredRank: pres[p.id]?.featuredRank ?? null,
      media: Object.fromEntries([p.image, ...p.images].map((m) => [m, existsSync(join(root, 'public', m)) ? sha(m) : 'MISSING'])),
    }])),
    experience: json('src/data/experience.json').experienceData,
    bio: json('src/data/bio.json').bio,
  };
}

if (!process.argv.includes('--diff')) {
  const commit = execSync('git rev-parse HEAD', { cwd: root }).toString().trim();
  writeFileSync(SNAP, JSON.stringify({ sourceCommit: commit, takenAt: new Date().toISOString(), ...current() }, null, 2) + '\n');
  console.log(`Wrote ${SNAP.replace(root, '')} (${Object.keys(current().projects).length} projects) at ${commit.slice(0, 7)}`);
  process.exit(0);
}

const snap = JSON.parse(readFileSync(SNAP, 'utf8'));
const now = current();
const out = [];
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
for (const id of new Set([...Object.keys(snap.projects), ...Object.keys(now.projects)])) {
  const a = snap.projects[id], b = now.projects[id];
  if (!a) { out.push(`+ ${id} added (${b.title})`); continue; }
  if (!b) { out.push(`- ${id} removed (${a.title})`); continue; }
  for (const k of [...FIELDS, 'slug', 'featuredRank', 'media']) {
    if (!eq(a[k], b[k])) out.push(`~ ${id}.${k}\n    was: ${JSON.stringify(a[k])}\n    now: ${JSON.stringify(b[k])}`);
  }
}
snap.experience.forEach((e, i) => { if (!eq(e, now.experience[i])) out.push(`~ experience[${i}] (${e.company}) changed`); });
if (now.experience.length !== snap.experience.length) out.push(`~ experience count ${snap.experience.length} → ${now.experience.length}`);
if (snap.bio !== now.bio) out.push('~ bio changed');
console.log(out.length
  ? `Content changes since snapshot ${snap.sourceCommit.slice(0, 7)} (review before publishing):\n${out.join('\n')}`
  : `No content changes since snapshot ${snap.sourceCommit.slice(0, 7)}.`);
