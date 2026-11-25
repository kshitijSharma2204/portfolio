// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages project site: https://kshitijsharma2204.github.io/portfolio/
export default defineConfig({
  site: 'https://kshitijsharma2204.github.io',
  base: '/portfolio',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // `npm run preview:drafts` builds a separate, never-deployed copy with draft case studies visible.
  outDir: process.env.CASE_STUDY_DRAFTS === '1' ? './dist-drafts' : './dist',
  compressHTML: true,
  devToolbar: { enabled: false },
});
