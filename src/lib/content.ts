/**
 * Single typed source for every surface (home, gallery, quick view, detail pages, sitemap).
 * Original records come from src/data/{projects,experience,bio}.json — exact copies of the v1 public/*.json.
 * Presentation-only fields (slug, featured rank, display title) come from presentation.json, keyed by project ID.
 */
import projectsJson from '../data/projects.json';
import experienceJson from '../data/experience.json';
import bioJson from '../data/bio.json';
import presentationJson from '../data/presentation.json';
import mediaJson from '../data/media.json';
import skillsManifest from '../../public/assets/skills/skills-manifest.json';

/** Shape of an original record in projects.json. Never mutated. */
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
}

export interface Project extends OriginalProject {
  /** Title shown on the page (presentation override or the original title). */
  name: string;
  slug: string;
  featuredRank?: number;
  categorySlug: string;
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
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const presentation = presentationJson.projects as Record<string, PresentationEntry>;
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
    categorySlug: slugify(p.group),
    media: m,
    gallery: p.images.map((img) => {
      const g = media.gallery[img] ?? fail(`media.json has no gallery derivative for ${img}`);
      return { original: img, ...g };
    }),
  };
});

export const featuredProjects = projects
  .filter((p) => p.featuredRank !== undefined)
  .sort((a, b) => (a.featuredRank ?? 0) - (b.featuredRank ?? 0));

/** Filter categories = original `group` values, in order of first appearance. */
export const categories = [...new Set(projects.map((p) => p.group))].map((name) => ({
  name,
  slug: slugify(name),
  count: projects.filter((p) => p.group === name).length,
}));

export const projectBySlug = (slug: string) => projects.find((p) => p.slug === slug);

export function relatedProjects(p: Project, n = 3): Project[] {
  const same = projects.filter((x) => x.id !== p.id && x.group === p.group);
  const others = projects.filter((x) => x.id !== p.id && x.group !== p.group);
  return [...same, ...others].slice(0, n);
}

export const experience: ExperienceEntry[] = experienceJson.experienceData.map((e) => {
  const m = e.company.match(/^(.*?)\s*\((.*)\)\s*$/);
  const employer = m ? m[1].trim() : e.company;
  const note = m ? m[2].trim() : undefined;
  const client = note?.match(/Client:\s*(.+)$/i)?.[1].trim();
  return { ...e, employer, note, client, current: /present/i.test(e.date) };
});

export const currentRole = experience.find((e) => e.current) ?? experience[0];

/** Original biography HTML (contains <br/> line breaks authored by the owner). */
export const bioHtml: string = bioJson.bio;

/** Skill icons from the (unchanged) skills manifest, with optimized derivatives for display. */
export const skillIcons = (skillsManifest as string[]).map((file) => {
  const d = media.skills[file] ?? fail(`media.json has no skill derivative for ${file} — run npm run media`);
  return { file, label: file.replace(/\.(png|jpe?g|svg)$/, ''), ...d };
});

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
  siteUrl: 'https://kshitijsharma2204.github.io/portfolio/',
  description:
    'Kshitij Sharma is a Perception Software Engineer at Lucid Motors and WPI robotics graduate. Explore projects in LiDAR, SLAM, sensor fusion and motion planning.',
};

/** Prefix a site-relative path ("/assets/x.png", "projects/") with the GitHub Pages base ("/portfolio"). */
export const withBase = (path: string) =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

export const formatBytes =(b: number) =>
  b >= 1e6 ? `${(b / 1e6).toFixed(b >= 1e7 ? 0 : 1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`;
