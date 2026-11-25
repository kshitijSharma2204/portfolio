# Portfolio 2.0 — owner review items

**Status (2026-11-25):** reviewed by the owner. Decisions:

- A1 résumé PDF stays public as is · A2 Lucid bullets fine · A3 new bio **applied** · A4 GitHub photo **added** (About, homepage, structured data) · A5 3D Scene Reconstruction moved to featured #2 · A6 email **shown** (Contact, homepage, footer) · A7 deployed.
- Berkshire Grey metric changed to **70%**; other résumé mismatches (§3) left for the owner to update later.
- All §4 text corrections **applied**, except "upto", which is only in the résumé PDF.
- The migration content lock was removed; `src/data/` is now the single place to edit content.

The original review notes follow for reference.

## 1. Approvals required by the plan

| # | Item | Current state in v2 |
|---|---|---|
| A1 | Résumé PDF (`public/resume.pdf`) is public and contains your phone number and personal email. GitHub Pages cannot noindex a PDF; the only way to keep these out of search is to edit the PDF. | Unchanged, linked from header/footer/contact. |
| A2 | Lucid Motors experience bullets cleared for public display (already published on v1). | Shown verbatim on Home (role only) and Experience. |
| A3 | Updated biography (draft in §2). | About shows the **original** bio until approved. |
| A4 | Profile photo. `avatar.jpg` has an **#OPENTOWORK** frame, which conflicts with the current Lucid Motors role. | Not displayed anywhere and not in JSON-LD. Supply a new photo if you want one (it also helps name disambiguation in search). |
| A5 | Featured order (LiDAR SLAM, Hybrid A*, KITTI segmentation, Frenet, 3D reconstruction, EKF). | Used as the working default. |
| A6 | Optional public contact email. | None shown; Contact = LinkedIn, GitHub, résumé. |
| A7 | Production deploy to `gh-pages`. | **Not deployed.** |

## 2. Draft biography (facts only from bio.json, experience.json and the résumé)

> I'm Kshitij Sharma, a Perception Software Engineer at Lucid Motors, where I build real-time LiDAR and ultrasonic sensor-fusion and occupancy-mapping software running on production vehicles. I work mainly in C++ and Python across perception, sensor fusion, SLAM and motion planning, with ROS/ROS2 experience on autonomous mobile robots and multi-robot systems.
>
> I hold a Master's in Robotics Engineering from Worcester Polytechnic Institute, where I focused on SLAM, path planning and robot perception. Before Lucid, I worked on multi-arm robotic welding software for Path Robotics, robotics software quality for Berkshire Grey, and outdoor AMR localization fusing RTK GPS, visual odometry and IMU at Void Robotics. Earlier, I spent several years building machine-vision and automation systems at Nagarro Software and Automation Systems and Solution.

Why: the original bio says "Robotics Software Engineer with more than four years of experience" and does not mention Lucid Motors, which conflicts with the new homepage hero and the structured data.

## 3. Résumé ↔ `experience.json` mismatches

| Entry | Résumé | experience.json |
|---|---|---|
| Path Robotics | "C++ Software **Developer**, Path Robotics (Contract)" | "C++ Software **Engineer**", "Kforce, Inc (Contract, Client: Path Robotics)" |
| Berkshire Grey | "Robotics Software Quality Engineer, Berkshire Grey (Contract)" | same title, "VueData LLC (Contract, Client: Berkshire Grey)" |
| Berkshire Grey metric | "reducing warehouse management time by **70%**"; "boosting system throughput upto 98%" | "reducing warehouse management time by **30%**"; no throughput claim |
| Nagarro | "Team Lead, **Associate Staff Engineer**" | "Team Lead, **Design Engineer**" |
| WPI MER Lab | Research Assistant, Aug 2022 – Dec 2022 | **missing** |
| Degree name | "Masters in Robotics Engineering" (v2 uses this) | v1 sidebar said "Mechatronics, Robotics, and Automation Engineering" |
| v1 sidebar role | — | "Robotics Software Developer" (v2 uses "Robotics & Perception Software Engineer" per plan) |

## 4. Suggested text corrections (not applied)

| Where | Current | Suggestion |
|---|---|---|
| project-13 title | "Automatic Camera Caliberation" | Data fix to "Calibration" (v2 already *displays* the pre-approved override) |
| project-4 `mainDescr` | no trailing period | add "." |
| project-5/6/7 text | " - " used as a dash | " — " |
| VueData bullet (résumé) | "upto" | "up to" |
| Kforce bullet 4 | "Collaborate cross-functionally…" (present tense) | "Collaborated…" |
| Void Robotics bullet 3 | "Rviz" | "RViz" |
| project-11 title | "Joint Space Control of SCARA arm" | "…SCARA Arm" |

## 5. Decisions made within the plan (documented deviations)

- **No React islands.** Filters, search, list toggle, Quick View, theme and menu are small vanilla TypeScript scripts that enhance server-rendered HTML (no framework runtime shipped; every page works without JS).
- **npm instead of pnpm** (pnpm was not installed; `package-lock.json` pins versions). `pnpm-lock.yaml` and the CRA files (`src/`, `.env`, `public/index.html`, `manifest.json`, React-logo favicons) were removed.
- **Custom sitemap endpoint** (`src/pages/sitemap.xml.ts`) → `/portfolio/sitemap.xml`, so legacy pages are excluded and no lastmod dates are invented.
- **Descriptions with line breaks** (projects 6–8 etc.) are displayed with their original line breaks (`white-space: pre-line`); v1 collapsed them.
- **Skills lists** on Home/About come verbatim from the résumé's Skills section; education from its Education section.
- Quick View and grid/list toggle were built in the same pass as the gallery; the core gallery, filters and detail pages pass all gates independently of them, including with JavaScript disabled.
- WebKit tests could not run on this machine (missing system library `libavif16`; needs `sudo npx playwright install-deps`). They run in CI.

---

## Decision log

### 2026-11-25 — Portfolio 2.2 (branch `portfolio-v2.2`)

Already approved and preserved (no re-approval needed): new biography, profile photo (home ~112 px, About ~220 px), public email and résumé, 70% Berkshire Grey metric, featured order (LiDAR SLAM, 3D Reconstruction, Hybrid A*, KITTI Segmentation, Frenet, EKF), text corrections, "View project" / "View full project" labels, friendlier media labels.

Changes made in v2.2 that use existing approved content only:
- Homepage experience cards show one-line summaries derived from the approved bullets (copy proposed in the v2.2 plan; please confirm the wording).
- Portrait moved from the lower homepage About section into the hero, same size.
- Gallery display categories (presentation only; original `group` values unchanged and still searchable; old `?category=` links still work).
- Branded share image (owner-supplied banner) for Home, Projects, Experience, About and Contact. Earlier you chose not to publish it; the v2.2 plan asks for it, so it is in this pull request; say so and it will be removed.
- Gallery captions for the LiDAR project, taken from that repository's README and checked against the images.

Awaiting owner decision (not changed on the site):

| Item | Question |
|---|---|
| Case studies | Review the four drafts in `docs/case-study-review/` (or `npm run preview:drafts`). Each becomes public only when its status is changed to `approved`. |
| LiDAR project title | The repository describes pure LiDAR odometry (no loop closure). Keep "LiDAR Odometry & SLAM Stack" or rename (e.g. "LiDAR Odometry Stack")? |
| 3D Scene Reconstruction | The description mentions an SfM pipeline that is not in the linked NeRF repository. Provide the SfM source, or keep the description as-is? |
| KITTI Semantic Segmentation | "Achieves robust performance" has no recorded metric. Supply a logged validation mIoU, or soften the wording? |
| Hybrid A* | `params.yaml` reverse_penalty 1.5 vs. hard-coded kReverseCost 10.0 — which applies? |
| One-Shot Object Detection | The notebook trains Ultralytics YOLOv5 (s, m variants; 30 epochs) on basketball footage; "one-shot" appears nowhere. Proposed title: **Basketball Object Detection with YOLOv5** (URL slug unchanged). The description also lists n/s/m/l variants and an ">85% AP" goal; only s/m training appears in the notebook source. |
| Path Robotics title | Résumé "C++ Software Developer" vs. site "C++ Software Engineer" (Kforce contract, client Path Robotics). |
| Nagarro title | Résumé "Team Lead, Associate Staff Engineer" vs. site "Team Lead, Design Engineer". |
| WPI MER Lab | Research Assistant, Aug–Dec 2022 (résumé) — add to Experience? |
| Berkshire Grey throughput | Résumé "boosting system throughput upto 98%" is not on the site — add (with evidence), or leave out? Also "upto" → "up to" in the résumé PDF. |
