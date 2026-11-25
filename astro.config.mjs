// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages project site: https://kshitijsharma2204.github.io/portfolio/
export default defineConfig({
  site: 'https://kshitijsharma2204.github.io',
  base: '/portfolio',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  compressHTML: true,
  devToolbar: { enabled: false },
});
