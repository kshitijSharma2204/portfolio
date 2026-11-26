// Writes a readable Markdown copy of each case study from src/data/case-studies.json, so drafts are easy to
// check on GitHub. Edit the JSON, not the .md files; they get overwritten.
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
    `# ${p.title}: case study`,
    '',
    `- **Project:** ${c.projectId} · [/projects/${slug}/](https://kshitijsharma2204.github.io/portfolio/projects/${slug}/) · source: ${p.link}`,
    `- **Status:** \`${c.status}\` ${c.status === 'draft' ? '(not on the site yet)' : '(on the site)'}`,
    `- **Code:** ${ev(c.evidence)}`,
    '- **To publish:** check everything below against the code, sort out the notes, then set `"status": "approved"` for this entry in `src/data/case-studies.json`.',
    '- **Preview:** `npm run preview:drafts`, then open the project page at http://127.0.0.1:4323/portfolio/',
    '',
  ];
  if (c.reviewNotes?.length) md.push('## Notes before publishing', '', ...c.reviewNotes.map((n) => `- [ ] ${n}`), '');
  if (c.problem) md.push('## Problem', '', c.problem, '');
  if (c.approach) md.push('## Approach', '', c.approach, '');
  if (c.pipeline?.length) md.push('### Data flow', '', ...c.pipeline.map((s, i) => `${i + 1}. **${s.step}**: ${s.detail}${s.source ? ` (\`${s.source}\`)` : ''}`), '');
  if (c.decisions?.length) {
    md.push('## Design decisions', '');
    for (const d of c.decisions) md.push(`### ${d.title}`, '', d.explanation, '', `Code: ${ev(d.evidence)}`, '');
  }
  if (c.evaluation?.length) {
    md.push('## Evaluation', '', '| Metric | Value | Unit | How it was measured | Source |', '|---|---|---|---|---|');
    for (const m of c.evaluation) md.push(`| ${m.metric} | ${m.value} | ${m.unit} | ${m.protocol} | ${ev(m.evidence)} |`);
    md.push('');
  } else {
    md.push('## Evaluation', '', '_No measured results in the repo yet._', '');
  }
  if (c.limitations?.length) md.push('## Limitations', '', ...c.limitations.map((l) => `- ${l}`), '');
  if (c.nextSteps?.length) md.push('## Next steps', '', ...c.nextSteps.map((n) => `- ${n}`), '');
  if (c.reproducibility) md.push('## How to reproduce', '', c.reproducibility, '');
  md.push('---', '', '_Generated from `src/data/case-studies.json` with `npm run case-studies:review`._', '');
  writeFileSync(join(outDir, `${slug}.md`), md.join('\n'));
  index.push(`| [${p.title}](./${slug}.md) | \`${c.status}\` | ${c.evaluation?.length ? `${c.evaluation.length} metrics` : 'none yet'} | ${c.reviewNotes?.length ?? 0} |`);
}

writeFileSync(join(outDir, 'README.md'), [
  '# Case studies',
  '',
  'Longer write-ups for the main projects. Each one only describes what the project\'s repo shows at a fixed commit.',
  'Drafts stay off the site until their status is `approved` in `src/data/case-studies.json`.',
  '',
  '| Project | Status | Results | Open notes |',
  '|---|---|---|---|',
  ...index,
  '',
].join('\n'));
console.log(`Wrote ${caseStudies.length} case studies to docs/case-study-review/`);
