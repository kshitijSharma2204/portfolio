// XML sitemap of canonical, indexable pages only (legacy compatibility routes and 404 are excluded).
import type { APIRoute } from 'astro';
import { projects, withBase } from '../lib/content';

export const sitemapPaths = [
  '',
  'projects/',
  ...projects.map((p) => `projects/${p.slug}/`),
  'experience/',
  'about/',
  'contact/',
];

export const GET: APIRoute = ({ site }) => {
  const urls = sitemapPaths.map((p) => `  <url><loc>${new URL(withBase(p), site).href}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
