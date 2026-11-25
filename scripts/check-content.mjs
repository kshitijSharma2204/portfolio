// Content-integrity release gate (runs before every build).
// Fails if any original content drifted from the recorded baseline or if presentation/media metadata is incomplete.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(join(root, p));
const json = (p) => JSON.parse(read(p).toString());
const errors = [];
const check = (cond, msg) => { if (!cond) errors.push(msg); };

// 1. Original files are byte-identical to the baseline inventory.
const baseline = json('docs/baseline/inventory.json');
const CONTENT = /^public\/((projects|experience|bio)\.json|assets\/.+|resume\.pdf|avatar\.jpg|left_nav_bg\.jpg)$/;
const contentFiles = baseline.files.filter((f) => CONTENT.test(f.path));
for (const f of contentFiles) {
  if (!existsSync(join(root, f.path))) { errors.push(`missing original file: ${f.path}`); continue; }
  const sha = createHash('sha256').update(read(f.path)).digest('hex');
  check(sha === f.sha256, `original file changed since baseline ${baseline.sourceCommit.slice(0, 7)}: ${f.path}`);
}

// 2. Build inputs in src/data are exact copies of the originals.
for (const name of ['projects.json', 'experience.json', 'bio.json']) {
  check(read(`src/data/${name}`).equals(read(`public/${name}`)), `src/data/${name} differs from public/${name}`);
}

// 3. Project records: 13, unique IDs, every field present, media exists.
const { projects } = json('src/data/projects.json');
const FIELDS = ['id', 'title', 'mainDescr', 'description', 'image', 'images', 'link', 'group', 'skills', 'favourite'];
check(projects.length === 13, `expected 13 projects, found ${projects.length}`);
check(new Set(projects.map((p) => p.id)).size === projects.length, 'duplicate project IDs');
for (const p of projects) {
  for (const k of FIELDS) check(k in p, `${p.id} missing field ${k}`);
  for (const m of [p.image, ...p.images]) check(existsSync(join(root, 'public', m)), `${p.id} media missing: ${m}`);
  check(/^https:\/\/github\.com\//.test(p.link), `${p.id} link is not a GitHub URL`);
}

// 4. Presentation metadata: keyed by original ID, complete, unique slugs, six featured ranks 1..6.
const pres = json('src/data/presentation.json').projects;
const ids = projects.map((p) => p.id);
check(isDeepStrictEqual(Object.keys(pres).sort(), [...ids].sort()), 'presentation.json keys must match project IDs exactly');
const slugs = ids.map((id) => pres[id]?.slug);
check(new Set(slugs).size === slugs.length, 'duplicate slugs in presentation.json');
for (const s of slugs) check(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s ?? ''), `invalid slug: ${s}`);
for (const s of slugs) check(!/^project-\d+$/.test(s ?? '') && s !== 'all', `slug collides with a legacy route: ${s}`);
const ranks = ids.map((id) => pres[id]?.featuredRank).filter((r) => r !== undefined).sort((a, b) => a - b);
check(isDeepStrictEqual(ranks, [1, 2, 3, 4, 5, 6]), `featured ranks must be exactly 1..6, got ${ranks}`);
// Display-title overrides require owner approval; only the pre-approved one is allowed.
const APPROVED_TITLES = { 'project-13': 'Automatic Camera Calibration' };
for (const id of ids) {
  if (pres[id]?.displayTitle !== undefined) {
    check(APPROVED_TITLES[id] === pres[id].displayTitle, `unapproved displayTitle for ${id}: ${pres[id].displayTitle}`);
  }
}

// 5. Experience: six entries, each complete.
const { experienceData } = json('src/data/experience.json');
check(experienceData.length === 6, `expected 6 experience entries, found ${experienceData.length}`);
for (const e of experienceData) {
  for (const k of ['date', 'role', 'company', 'description']) check(k in e, `experience entry missing ${k}`);
}

// 6. Media derivatives exist for every project, gallery image and skill icon.
const media = json('src/data/media.json');
const pub = (p) => existsSync(join(root, 'public', p));
for (const p of projects) {
  const m = media.projects[p.id];
  if (!m) { errors.push(`media.json missing ${p.id} (run npm run media)`); continue; }
  check(m.original.path === p.image, `media.json ${p.id} original path is stale`);
  for (const f of [m.poster[640], m.poster[1280], m.og, m.video?.mp4, m.video?.webm].filter(Boolean)) {
    check(pub(f), `derivative missing: ${f}`);
  }
  check(!p.image.endsWith('.gif') || m.video, `${p.id} animated original has no video derivative`);
  for (const img of p.images) check(media.gallery[img] && pub(media.gallery[img].src), `gallery derivative missing: ${img}`);
}
const skills = json('public/assets/skills/skills-manifest.json');
check(skills.length === 9, `expected 9 skill icons, found ${skills.length}`);
for (const s of skills) {
  check(existsSync(join(root, 'public/assets/skills', s)), `skill icon missing: ${s}`);
  check(media.skills?.[s] && pub(media.skills[s].src), `skill derivative missing: ${s}`);
}

if (errors.length) {
  console.error(`✗ Content integrity: ${errors.length} problem(s)\n  - ${errors.join('\n  - ')}`);
  process.exit(1);
}
console.log(
  `✓ Content integrity: ${contentFiles.length} original files match baseline ${baseline.sourceCommit.slice(0, 7)}; ` +
    `${projects.length} projects, ${experienceData.length} experience entries, ${skills.length} skill icons verified.`,
);
