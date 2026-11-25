# SEO handoff — Portfolio 2.2

Site: https://kshitijsharma2204.github.io/portfolio/ · Search Console property type: URL prefix.
Goal: be the primary destination for searches about the engineer Kshitij Sharma. Ranking is decided by Google; nothing here guarantees indexing, position or timing.

## 1. Technical validation (automated, every build)

`npm run build` fails unless all of these hold (see `scripts/check-dist.mjs`):

| Check | Status in this release |
|---|---|
| One `<h1>` per page; unique `<title>`, meta description, absolute canonical | ✓ all 18 canonical pages |
| Home title `Kshitij Sharma \| Robotics & Perception Software Engineer`, H1 `Kshitij Sharma` | ✓ |
| `ProfilePage` → `Person` (`@id …/portfolio/#person`): name, jobTitle, worksFor Lucid Motors, alumniOf WPI, image = `profile.jpg`, sameAs GitHub + LinkedIn | ✓ |
| `AboutPage` on /about/ references the same `#person` entity | ✓ (new) |
| Project pages: `BreadcrumbList` + `SoftwareSourceCode` | ✓ 13/13 |
| Share images: branded `media/og/portfolio.jpg` (1200×630 JPEG, 301 KB) on Home, Projects, Experience, About, Contact; each project page keeps `media/og/project-N.jpg`; `og:image:type`, width, height, alt and Twitter tags present | ✓ (new) |
| Sitemap: exactly the 18 canonical URLs; no filter states, legacy aliases, 404 or drafts; no invented `lastmod` | ✓ |
| Legacy aliases (`/projects/project-N/`, `/projects/all/`) carry canonical + meta refresh to the new URL and stay out of the sitemap (GitHub Pages cannot send HTTP 301) | ✓ |
| `404.html` is `noindex`; no canonical page is `noindex` | ✓ |
| `google0642a7ae8ef66a2c.html` present and byte-identical to source | ✓ |
| All internal links and media resolve under `/portfolio/`; no GIF loaded without a user action | ✓ |

Live checks (2026-11-25): all 18 sitemap URLs return 200; verification file returns 200. Host-root `https://kshitijsharma2204.github.io/robots.txt` returns 404 and no root site exists, so nothing blocks crawling. `/portfolio/robots.txt` is documentation only; crawlers do not read robots files in sub-paths. If a root Pages site is ever created, add `Sitemap: https://kshitijsharma2204.github.io/portfolio/sitemap.xml` to its robots.txt.

## 2. Search Console — status reported by the owner (screenshots, 2026-11-25)

| Step | Status |
|---|---|
| URL-prefix property added | Done |
| Ownership verification (HTML file method) | **Verified** — keep `public/google0642a7ae8ef66a2c.html` forever |
| Sitemap `sitemap.xml` submitted | Submitted; first status "Couldn't fetch" with no "Last read" date (common for brand-new properties; the file is valid XML with 18 URLs). Re-check after a few days; if still failing after ~3 days, remove and resubmit. |
| URL Inspection → Test live URL (home) | "URL is available to Google"; crawl and indexing allowed; Profile page: 1 valid item |
| Request indexing (home) | Owner was asked to request it; confirm in the next check-in |
| Indexed pages / Google-selected canonical | Unknown (not yet reported) |

## 3. Owner checklist (recurring)

1. After each deploy that changes a page meaningfully: URL Inspection → Test live URL → Request indexing for that page only. Google rate-limits requests; don't repeat daily.
2. Week 1–2: Sitemaps report should show **Success** and 18 discovered URLs. "Discovered" ≠ "indexed".
3. Pages → Page indexing: read exclusion reasons. Legacy aliases being "Alternate page with proper canonical" is expected and fine.
4. Validate structured data occasionally: https://search.google.com/test/rich-results (home: ProfilePage) and https://validator.schema.org/ (project pages: BreadcrumbList, SoftwareSourceCode). A valid item does not guarantee a rich result.
5. Core Web Vitals report will likely say "not enough data" for a low-traffic site; lab Lighthouse scores are not a substitute.
6. Record numbers in `docs/seo-baseline.md` at the check-ins (≈2, 4, 8, 12 weeks after deploy, then monthly if useful).

## 4. Identity signals (owner-controlled)

Already done by the owner: LinkedIn contact-info website + Featured link card (custom thumbnail uploaded), GitHub profile website field.

Suggested consistent wording everywhere: **Kshitij Sharma — Robotics & Perception Software Engineer · Perception Software Engineer at Lucid Motors**, linking to `https://kshitijsharma2204.github.io/portfolio/`.

Optional, only if the owner wants (not done automatically):
- Add a one-line "Portfolio and write-up: <project page URL>" to the README of each flagship repository (cpp_slam_stack, NERF-Project, hybrid_astar, semantic-segmentation). Useful for readers, and a genuine link back.
- GitHub profile README with the same name, role and link.
- WPI alumni directory or course pages only where participation is real and listing is permitted.

Not recommended: directory submissions, link exchanges, keyword pages, or associating same-name researchers' publications with this profile.

## 5. Optional later: custom domain

A custom domain helps memorability, not ranking by itself. If chosen: buy and configure DNS + HTTPS, set `site`/`base` in `astro.config.mjs`, update canonical/OG/sitemap/profile URLs, add a new Search Console property, and keep the old URLs redirecting. Not part of v2.2.
