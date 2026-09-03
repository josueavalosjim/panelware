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

export function createDemoServer() {
    return createServer((req, res) => {
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
  });
}

/**
 * Start on an ephemeral port and hand back the base URL.
 *
 * The checks use this rather than a fixed port so two of them can run at once,
 * and rather than file:// because demo/index.html boots React through an
 * import map and ES modules do not load over file://. It rendered zero
 * controls there and every width-based check passed, having measured an empty
 * document. See the liveness guard in check-overflow.mjs.
 */
export function startDemoServer(port = 0) {
  return new Promise((resolve) => {
    const server = createDemoServer();
    server.listen(port, '127.0.0.1', () => {
      const { port: actual } = server.address();
      resolve({
        url: `http://127.0.0.1:${actual}`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { url } = await startDemoServer(PORT);
  console.log(`panelware demo  ${url}/demo/index.html`);
  console.log(`                ${url}/demo/states.html`);
}
