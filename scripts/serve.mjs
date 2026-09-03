/**
 * The demo server.
 *
 * It exists for one header. The demo was being served by `python -m
 * http.server`, which sends no Cache-Control at all, so browsers fall back to
 * heuristic caching and hold a stylesheet across an edit. That produced a
 * round trip where a fixed layout bug was reported as still broken, it was
 * still broken on the screen, and the file on disk was correct: the browser
 * was showing CSS from before the fix. Every other check in this repo reads
 * the file or drives a fresh browser, so none of them could see it.
 *
 * no-store rather than no-cache: no-cache still stores and revalidates, which
 * is fine until the revalidation is the thing that is wrong.
 *
 * Static files only, no directory listing, no dependencies.
 */
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT ?? 4173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.map': 'application/json; charset=utf-8',
};

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let path = decodeURIComponent(url.pathname);
  if (path === '/') path = '/demo/index.html';
  /* normalize before joining, so ../ cannot walk out of the repo */
  const file = join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('no'); return; }
  let stat;
  try { stat = statSync(file); } catch { res.writeHead(404).end('not found'); return; }
  if (stat.isDirectory()) { res.writeHead(404).end('not found'); return; }
  res.writeHead(200, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    'content-length': stat.size,
    'cache-control': 'no-store, max-age=0',
  });
  createReadStream(file).pipe(res);
}).listen(PORT, '127.0.0.1', () => {
  console.log(`panelware demo  http://127.0.0.1:${PORT}/demo/index.html`);
  console.log(`                http://127.0.0.1:${PORT}/demo/states.html`);
});
