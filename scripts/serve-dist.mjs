// Minimal static server that mimics GitHub Pages for dist/ (used by Playwright and local QA):
//  - serves dist/ under /portfolio/
//  - /dir → 301 /dir/ when dir/index.html exists (as GitHub Pages does)
//  - unknown paths → 404 status with dist/404.html
// Usage: node scripts/serve-dist.mjs [port]   (DIST_DIR=/path/to/build serves another build, e.g. a frozen baseline)
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = process.env.DIST_DIR ? resolve(process.env.DIST_DIR) : join(new URL('..', import.meta.url).pathname, 'dist');
const port = Number(process.argv[2] ?? process.env.PORT ?? 4322);
const BASE = '/portfolio/';
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.xml': 'application/xml', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.ico': 'image/x-icon',
};

const send = (res, status, file) => {
  const body = readFileSync(file);
  res.writeHead(status, { 'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream', 'Content-Length': body.length });
  res.end(body);
};

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith(BASE)) {
    if (url.pathname === '/portfolio') { res.writeHead(301, { Location: BASE }); return res.end(); }
    return send(res, 404, join(root, '404.html'));
  }
  const rel = normalize(decodeURIComponent(url.pathname.slice(BASE.length))).replace(/^(\.\.[/\\])+/, '');
  const target = join(root, rel);
  if (existsSync(target) && statSync(target).isFile()) return send(res, 200, target);
  if (existsSync(join(target, 'index.html'))) {
    if (!url.pathname.endsWith('/')) { res.writeHead(301, { Location: `${url.pathname}/${url.search}` }); return res.end(); }
    return send(res, 200, join(target, 'index.html'));
  }
  return send(res, 404, join(root, '404.html'));
}).listen(port, '127.0.0.1', () => console.log(`Serving dist/ at http://127.0.0.1:${port}${BASE}`));
