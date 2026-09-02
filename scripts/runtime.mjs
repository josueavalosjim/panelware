/**
 * The rendered-page half of the palette gate.
 *
 * This exists as a script rather than as an `npx taste-check runtime` because
 * of one mechanical detail: runtime.url is handed straight to page.goto with
 * no resolution against the config file's directory, so a portable relative
 * file:// URL cannot be written in JSON. The absolute one has to be computed
 * where the repo root is known.
 *
 * No server. demo/states.html has no JavaScript, so file:// is enough, and a
 * check that needed a server would be a check nobody runs locally.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { failed, findBrowser, load, runtime, toText } from '@josueavalosjim/taste-check';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* A missing Chromium must not read as a clean run. taste-check's own CI makes
   the same guard explicit for the same reason: a check that silently skips is
   worse than one that fails, because only one of the two gets fixed. */
if (!findBrowser()) {
  console.error('no Chromium found, so the runtime check would skip rather than run');
  console.error('set CHROME_PATH, or install a Chromium');
  process.exit(1);
}

const { ok, config, errors } = load(join(ROOT, 'tastecheck.config.json'));
if (!ok) {
  console.error(`tastecheck.config.json is not valid:\n  ${errors.join('\n  ')}`);
  process.exit(1);
}

config.runtime.url = pathToFileURL(join(ROOT, 'demo', 'states.html')).href;

const results = await runtime(config, ROOT);
console.log(toText(results));
process.exit(failed(results) ? 1 : 0);
