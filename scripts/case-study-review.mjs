// Generates owner-review documents from src/data/case-studies.json (single source; never edit the .md by hand).
// Usage: npm run case-studies:review   → docs/case-study-review/<slug>.md + README.md
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const json = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const { caseStudies } = json('src/data/case-studies.json');
const { projects } = json('src/data/projects.json');
const pres = json('src/data/presentation.json').projects;
const outDir = join(root, 'docs/case-study-review');
mkdirSync(outDir, { recursive: true });

const ev = (refs = []) => refs.map((r) => `[${r.note ?? r.url.replace('https://github.com/kshitijSharma2204/', '')}](${r.url})`).join(' · ');
const index = [];

for (const c of caseStudies) {
  const p = projects.find((x) => x.id === c.projectId);
  const slug = pres[c.projectId].slug;
  const md = [
    `# Case study review — ${p.title}`,
    '',
    `- **Project:** ${c.projectId} · [/projects/${slug}/](https://kshitijsharma2204.github.io/portfolio/projects/${slug}/) · source: ${p.link}`,
    `- **Status:** \`${c.status}\` ${c.status === 'draft' ? '— not shown on the public site' : '— published'}`,
    `- **Evidence snapshot:** ${ev(c.evidence)}`,
    '- **To publish:** confirm every statement below is accurate and publishable, resolve the review notes, then change `"status": "draft"` to `"approved"` for this entry in `src/data/case-studies.json`.',
    '- **Preview locally:** `npm run preview:drafts`, then open the project page at http://127.0.0.1:4323/portfolio/',
    '',
  ];
  if (c.reviewNotes?.length) md.push('## Review notes (owner decision needed)', '', ...c.reviewNotes.map((n) => `- [ ] ${n}`), '');
  if (c.problem) md.push('## Problem', '', c.problem, '');
  if (c.approach) md.push('## Approach', '', c.approach, '');
  if (c.pipeline?.length) md.push('### Data flow', '', ...c.pipeline.map((s, i) => `${i + 1}. **${s.step}** — ${s.detail}${s.source ? ` (\`${s.source}\`)` : ''}`), '');
  if (c.decisions?.length) {
    md.push('## Engineering decisions', '');
    for (const d of c.decisions) md.push(`### ${d.title}`, '', d.explanation, '', `Evidence: ${ev(d.evidence)}`, '');
  }
  if (c.evaluation?.length) {
    md.push('## Evaluation', '', '| Metric | Value | Unit | Protocol | Evidence |', '|---|---|---|---|---|');
    for (const m of c.evaluation) md.push(`| ${m.metric} | ${m.value} | ${m.unit} | ${m.protocol} | ${ev(m.evidence)} |`);
    md.push('');
  } else {
    md.push('## Evaluation', '', '_No recorded, verifiable metrics in the repository — none will be published._', '');
  }
  if (c.limitations?.length) md.push('## Limitations', '', ...c.limitations.map((l) => `- ${l}`), '');
  if (c.nextSteps?.length) md.push('## Next steps', '', ...c.nextSteps.map((n) => `- ${n}`), '');
  if (c.reproducibility) md.push('## Reproducibility', '', c.reproducibility, '');
  md.push('---', '', '_Generated from `src/data/case-studies.json` by `npm run case-studies:review`._', '');
  writeFileSync(join(outDir, `${slug}.md`), md.join('\n'));
  index.push(`| [${p.title}](./${slug}.md) | \`${c.status}\` | ${c.evaluation?.length ? `${c.evaluation.length} metrics` : 'no metrics'} | ${c.reviewNotes?.length ?? 0} |`);
}

writeFileSync(join(outDir, 'README.md'), [
  '# Case study review',
  '',
  'Draft engineering case studies for the flagship projects, written only from evidence in each project\'s own repository at a fixed commit.',
  'Nothing here is public until its status is changed to `approved` in `src/data/case-studies.json`.',
  '',
  '| Project | Status | Evaluation | Open review notes |',
  '|---|---|---|---|',
  ...index,
  '',
  'Stretch candidates not drafted in this release: Frenet trajectory generation (project-6), EKF localization (project-7).',
  '',
].join('\n'));
console.log(`Wrote ${caseStudies.length} review documents to docs/case-study-review/`);
