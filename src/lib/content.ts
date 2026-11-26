/**
 * Single typed source for every surface (home, gallery, quick view, detail pages, sitemap).
 * Canonical content: src/data/{projects,experience,bio}.json. Presentation-only fields (slug, featured rank,
 * display category, captions, homepage experience summaries) come from presentation.json; optional engineering
 * case studies from case-studies.json (only "approved" entries render publicly).
 */
import projectsJson from '../data/projects.json';
import experienceJson from '../data/experience.json';
import bioJson from '../data/bio.json';
import presentationJson from '../data/presentation.json';
import mediaJson from '../data/media.json';
import caseStudiesJson from '../data/case-studies.json';
import skillsManifest from '../../public/assets/skills/skills-manifest.json';

/** A record in projects.json, as written there. */
export interface OriginalProject {
  id: string;
  title: string;
  mainDescr: string;
  description: string;
  image: string;
  images: string[];
  link: string;
  group: string;
  skills: string[];
  favourite: boolean;
}

interface PresentationEntry {
  slug: string;
  featuredRank?: number;
  displayTitle?: string;
  posterTime?: number;
  displayCategory: string;
  /** Gallery image path → caption verified against the project's own repository. */
  captions?: Record<string, string>;
}

export interface DisplayCategory {
  key: string;
  label: string;
}

export interface ProjectMedia {
  original: { path: string; width: number; height: number; bytes: number; animated: boolean };
  poster: { 640: string; 1280: string; width: number; height: number };
  og: string;
  video: null | {
    mp4: string;
    webm: string;
    width: number;
    height: number;
    duration: number;
    mp4Bytes: number;
    webmBytes: number;
  };
}

export interface GalleryImage {
  original: string;
  src: string;
  width: number;
  height: number;
  originalBytes: number;
  caption?: string;
}

export interface Project extends OriginalProject {
  /** Title shown on the page (presentation override or the original title). */
  name: string;
  slug: string;
  featuredRank?: number;
  /** Display category (gallery filters, card label). */
  category: DisplayCategory;
  /** slugify(original group) — kept so legacy ?category= links keep working. */
  groupSlug: string;
  media: ProjectMedia;
  gallery: GalleryImage[];
}

export interface ExperienceEntry {
  date: string;
  role: string;
  company: string;
  description: string[];
  /** Employer name, split from `company` for display only, e.g. "Kforce, Inc". */
  employer: string;
  /** Parenthetical note from `company`, e.g. "Contract, Client: Path Robotics". */
  note?: string;
  /** Client name when the note names one. */
  client?: string;
  current: boolean;
  /** Stable anchor on the Experience page, e.g. "lucid-motors". */
  anchor: string;
  /** Short homepage summary derived from the bullets (presentation.json → experience). */
  summary?: string;
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const presentation = presentationJson.projects as Record<string, PresentationEntry>;
export const displayCategories: DisplayCategory[] = presentationJson.displayCategories;
const experienceSummaries = presentationJson.experience as Record<string, string>;
const media = mediaJson as unknown as {
  projects: Record<string, ProjectMedia>;
  gallery: Record<string, Omit<GalleryImage, 'original'>>;
  skills: Record<string, { src: string; width: number; height: number }>;
};

function fail(msg: string): never {
  throw new Error(`[content] ${msg}`);
}

export const projects: Project[] = (projectsJson.projects as OriginalProject[]).map((p) => {
  const pres = presentation[p.id] ?? fail(`presentation.json has no entry for ${p.id}`);
  const m = media.projects[p.id] ?? fail(`media.json has no entry for ${p.id} — run npm run media`);
  return {
    ...p,
    name: pres.displayTitle ?? p.title,
    slug: pres.slug,
    featuredRank: pres.featuredRank,
    category:
      displayCategories.find((c) => c.key === pres.displayCategory) ??
      fail(`${p.id} has unknown displayCategory "${pres.displayCategory}"`),
    groupSlug: slugify(p.group),
    media: m,
    gallery: p.images.map((img) => {
      const g = media.gallery[img] ?? fail(`media.json has no gallery derivative for ${img}`);
      return { original: img, ...g, caption: pres.captions?.[img] };
    }),
  };
});

export const featuredProjects = projects
  .filter((p) => p.featuredRank !== undefined)
  .sort((a, b) => (a.featuredRank ?? 0) - (b.featuredRank ?? 0));

/** Gallery filter chips: display categories with live counts. */
export const categories = displayCategories.map((c) => ({
  name: c.label,
  slug: c.key,
  count: projects.filter((p) => p.category.key === c.key).length,
}));

/** Original groups, so bookmarked v2.0 links like ?category=robotics still filter correctly. */
export const legacyCategories = [...new Set(projects.map((p) => p.group))].map((name) => ({ name, slug: slugify(name) }));

export const projectBySlug = (slug: string) => projects.find((p) => p.slug === slug);

export function relatedProjects(p: Project, n = 3): Project[] {
  const same = projects.filter((x) => x.id !== p.id && x.category.key === p.category.key);
  const others = projects.filter((x) => x.id !== p.id && x.category.key !== p.category.key);
  return [...same, ...others].slice(0, n);
}

export const experience: ExperienceEntry[] = experienceJson.experienceData.map((e) => {
  const m = e.company.match(/^(.*?)\s*\((.*)\)\s*$/);
  const employer = m ? m[1].trim() : e.company;
  const note = m ? m[2].trim() : undefined;
  const client = note?.match(/Client:\s*(.+)$/i)?.[1].trim();
  return {
    ...e,
    employer,
    note,
    client,
    current: /present/i.test(e.date),
    anchor: slugify(employer),
    summary: experienceSummaries[employer],
  };
});

export const currentRole = experience.find((e) => e.current) ?? experience[0];

/** Bio HTML from bio.json (paragraphs separated by <br/><br/>). */
export const bioHtml: string = bioJson.bio;

/** Skill icons from the (unchanged) skills manifest, with optimized derivatives for display. */
export const skillIcons = (skillsManifest as string[]).map((file) => {
  const d = media.skills[file] ?? fail(`media.json has no skill derivative for ${file} — run npm run media`);
  return { file, label: file.replace(/\.(png|jpe?g|svg)$/, ''), ...d };
});

/**
 * Homepage expertise summary. Every item must be supported by projects.json or experience.json:
 * scripts/check-content.mjs fails the build if an item's `match` text (default: the label) is not found there.
 */
export const expertiseDomains: { label: string; items: { label: string; match?: string }[] }[] = [
  {
    label: 'Perception & 3D Vision',
    items: [
      { label: 'LiDAR perception pipelines', match: 'LiDAR perception pipeline' },
      { label: 'Point cloud registration' },
      { label: 'Semantic segmentation' },
      { label: '3D reconstruction' },
      { label: 'Object detection', match: 'YOLOv5' },
      { label: 'Camera calibration' },
    ],
  },
  {
    label: 'Localization & Mapping',
    items: [
      { label: 'LiDAR odometry' },
      { label: 'Occupancy grid mapping' },
      { label: 'Extended Kalman Filter' },
      { label: 'Sensor fusion (RTK GPS, visual odometry, IMU)', match: 'Real-Time Kinematic (RTK) GPS' },
    ],
  },
  {
    label: 'Motion Planning & Control',
    items: [
      { label: 'Hybrid A*' },
      { label: 'Frenet-frame trajectories', match: 'Frenet' },
      { label: 'Sliding mode control', match: 'Sliding Mode' },
      { label: 'Joint-space control', match: 'Joint Space Control' },
      { label: 'Nav2' },
    ],
  },
  {
    label: 'Modern C++ & Systems',
    items: [
      { label: 'C++', match: 'C++' },
      { label: 'Multithreading' },
      { label: 'ROS 2', match: 'ROS2' },
      { label: 'RTI DDS' },
      { label: 'GoogleTest / GMock', match: 'GMock' },
      { label: 'CMake' },
    ],
  },
  {
    label: 'Machine Learning',
    items: [
      { label: 'PyTorch' },
      { label: 'UNet' },
      { label: 'YOLOv5' },
      { label: 'Deep Q-Networks', match: 'DQN' },
      { label: 'Siamese networks', match: 'Siamese' },
    ],
  },
];

/** Skills section of the public résumé (public/resume.pdf), verbatim. */
export const resumeSkills = [
  { label: 'Expertise', items: ['Path Planning', 'Sensor Fusion', 'SLAM', 'Controls', '3D Reconstruction', 'System Design'] },
  { label: 'Languages and Platforms', items: ['C++', 'Python', 'Linux', 'Git', 'ROS2', 'Docker', 'JIRA'] },
  {
    label: 'Libraries and Frameworks',
    items: ['Nav2', 'MoveIt', 'OMPL', 'Eigen', 'OpenCV', 'PyTorch', 'TensorFlow', 'GTest', 'GMock'],
  },
];

/** Education, as listed on the public résumé (public/resume.pdf). */
export const education = [
  {
    school: 'Worcester Polytechnic Institute',
    degree: 'M.S. Robotics Engineering',
    dates: 'Aug 2021 – May 2023',
    detail: 'Coursework: Motion Planning, Sensor Fusion, Robot Localization, Robot Dynamics, Robot Perception',
  },
  {
    school: 'I.T.S. Engineering College, India',
    degree: 'Bachelor’s in Mechanical Engineering',
    dates: 'Aug 2010 – Jun 2014',
  },
];

export const profile = {
  name: 'Kshitij Sharma',
  title: 'Robotics & Perception Software Engineer',
  github: 'https://github.com/kshitijSharma2204',
  linkedin: 'https://www.linkedin.com/in/kshitijsharma1992/',
  email: 'kshitijj.sharma@gmail.com',
  /** Profile photo (400×400). */
  photo: { src: '/profile.jpg', width: 400, height: 400 },
  siteUrl: 'https://kshitijsharma2204.github.io/portfolio/',
  /** Share image for the main pages. Project pages use their own image instead. */
  ogImage: {
    src: '/media/og/portfolio.jpg',
    width: 1200,
    height: 630,
    type: 'image/jpeg',
    alt: 'Kshitij Sharma — Robotics & Perception Software Engineer, with a stylized LiDAR city map',
  },
  /** Meta description and structured data for the homepage. */
  description:
    'Kshitij Sharma is a Perception Software Engineer at Lucid Motors with a robotics Master’s from WPI, working on LiDAR, SLAM, sensor fusion and motion planning.',
  /** Intro line under the name on the homepage. */
  intro:
    'I work on LiDAR, SLAM, sensor fusion and motion planning. Below are the places I’ve worked and some of the projects I’ve built.',
};

/** Prefix a site-relative path ("/assets/x.png", "projects/") with the GitHub Pages base ("/portfolio"). */
export const withBase = (path: string) =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

/** Files above this size get their size shown next to download links, so nobody pulls 50 MB by accident. */
export const LARGE_FILE_BYTES = 2e6;
/** " (52 MB)" for large files, "" otherwise. */
export const sizeNote = (bytes: number) => (bytes > LARGE_FILE_BYTES ? ` (${formatBytes(bytes)})` : '');

export const formatBytes = (b: number) =>
  b >= 1e6 ? `${(b / 1e6).toFixed(b >= 1e7 ? 0 : 1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`;

/* ---------------------------------------------------------------- Case studies */

export interface EvidenceRef {
  url: string;
  commit?: string;
  note?: string;
}
export interface CaseStudy {
  projectId: string;
  status: 'draft' | 'approved';
  problem?: string;
  approach?: string;
  pipeline?: { step: string; detail: string; source?: string }[];
  decisions?: { title: string; explanation: string; evidence: EvidenceRef[] }[];
  evaluation?: { metric: string; value: number; unit: string; protocol: string; evidence: EvidenceRef[] }[];
  limitations?: string[];
  nextSteps?: string[];
  reproducibility?: string;
  evidence: EvidenceRef[];
  /** Internal review notes; never rendered. */
  reviewNotes?: string[];
}

/** CASE_STUDY_DRAFTS=1 (npm run preview:drafts) shows drafts too. Only for local previews. */
export const showDraftCaseStudies = process.env.CASE_STUDY_DRAFTS === '1';
const caseStudyList = caseStudiesJson.caseStudies as CaseStudy[];

/** The case study to render for a project: approved entries only, unless the local drafts preview is on. */
export const caseStudyFor = (projectId: string): CaseStudy | undefined =>
  caseStudyList.find((c) => c.projectId === projectId && (c.status === 'approved' || showDraftCaseStudies));
