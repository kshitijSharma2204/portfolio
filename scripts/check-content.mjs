// Content checks (run before every build). src/data/*.json is the single place to edit site content.
// Catches real mistakes — missing fields, missing media, duplicate slugs, stale media derivatives — without
// blocking legitimate edits. (The migration-era byte-for-byte baseline lock was removed after launch;
// docs/baseline/inventory.json remains as a historical record of the v1 content.)
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p));
const json = (p) => JSON.parse(read(p).toString());
const errors = [];
const check = (cond, msg) => { if (!cond) errors.push(msg); };

// 1. Project records: unique IDs, every field present and non-empty, media exists.
const { projects } = json('src/data/projects.json');
const FIELDS = ['id', 'title', 'mainDescr', 'description', 'image', 'images', 'link', 'group', 'skills', 'favourite'];
check(projects.length > 0, 'projects.json has no projects');
check(new Set(projects.map((p) => p.id)).size === projects.length, 'duplicate project IDs');
for (const p of projects) {
  for (const k of FIELDS) check(k in p, `${p.id} missing field ${k}`);
  for (const k of ['title', 'mainDescr', 'description', 'image', 'group']) check(String(p[k] ?? '').trim(), `${p.id} has an empty ${k}`);
  for (const m of [p.image, ...p.images]) check(existsSync(join(root, 'public', m)), `${p.id} media missing: ${m}`);
  check(/^https:\/\/github\.com\//.test(p.link), `${p.id} link is not a GitHub URL`);
}

// 2. Presentation metadata: one entry per project, unique URL slugs, featured ranks 1..6.
const pres = json('src/data/presentation.json').projects;
const ids = projects.map((p) => p.id);
check(isDeepStrictEqual(Object.keys(pres).sort(), [...ids].sort()),
  'presentation.json must have exactly one entry per project ID (add a slug for new projects, remove deleted ones)');
const slugs = ids.map((id) => pres[id]?.slug);
check(new Set(slugs).size === slugs.length, 'duplicate slugs in presentation.json');
for (const s of slugs) check(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s ?? ''), `invalid slug: ${s}`);
for (const s of slugs) check(!/^project-\d+$/.test(s ?? '') && s !== 'all', `slug collides with a legacy route: ${s}`);
const ranks = ids.map((id) => pres[id]?.featuredRank).filter((r) => r !== undefined).sort((a, b) => a - b);
check(isDeepStrictEqual(ranks, [1, 2, 3, 4, 5, 6]), `featuredRank values must be exactly 1,2,3,4,5,6 (one each), got ${ranks}`);

// 3. Experience: each entry complete.
const { experienceData } = json('src/data/experience.json');
check(experienceData.length > 0, 'experience.json has no entries');
for (const e of experienceData) {
  for (const k of ['date', 'role', 'company', 'description']) check(k in e, `experience entry missing ${k}`);
}

// 4. Media derivatives exist for every project, gallery image and skill icon (run `npm run media` after adding media).
const media = json('src/data/media.json');
const pub = (p) => existsSync(join(root, 'public', p));
for (const p of projects) {
  const m = media.projects[p.id];
  if (!m) { errors.push(`no media derivatives for ${p.id} — run: npm run media`); continue; }
  check(m.original.path === p.image, `${p.id} image changed — run: npm run media -- --only=${p.id}`);
  for (const f of [m.poster[640], m.poster[1280], m.og, m.video?.mp4, m.video?.webm].filter(Boolean)) {
    check(pub(f), `derivative missing: ${f}`);
  }
  check(!p.image.endsWith('.gif') || m.video, `${p.id} animated original has no video derivative`);
  for (const img of p.images) check(media.gallery[img] && pub(media.gallery[img].src), `gallery image not processed: ${img} — run: npm run media`);
}
const skills = json('public/assets/skills/skills-manifest.json');
check(skills.length > 0, 'no skill icons found');
for (const s of skills) {
  check(existsSync(join(root, 'public/assets/skills', s)), `skill icon missing: ${s}`);
  check(media.skills?.[s] && pub(media.skills[s].src), `skill icon not processed: ${s} — run: npm run media`);
}

if (errors.length) {
  console.error(`✗ Content check: ${errors.length} problem(s)\n  - ${errors.join('\n  - ')}`);
  process.exit(1);
}
console.log(
  `✓ Content check: ${projects.length} projects, ${experienceData.length} experience entries, ${skills.length} skill icons OK.`,
);
