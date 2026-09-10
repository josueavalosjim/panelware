/**
 * The demo's vendored runtime.
 *
 * demo/index.html boots React through an import map, and that map used to
 * point at esm.sh. It made the demo, and therefore six of the checks, depend
 * on a third party being reachable at the moment they ran: the 0.7.1 publish
 * workflow failed on check:a11y with nine of twenty-four combinations scanned
 * and zero opened surfaces, because the React page had not booted. The same
 * commit had passed the same gate minutes earlier.
 *
 * These hold the bundles to the lockfile and the import map to the bundles.
 * Both failures are silent in the browser's own way: a stale bundle renders
 * happily and is not the code anyone reviewed, and a specifier in one list and
 * not the other is a blank page with a single console line.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { VENDOR, bundleVendor } from '../scripts/build-vendor.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

describe('the vendored runtime', () => {
  const dir = join(ROOT, 'demo', 'vendor');
  const committed = readdirSync(dir).filter((f) => f.endsWith('.js')).sort();

  test('the committed bundles are what the bundler writes', async () => {
    /* The same comparison the sprite sheets get, and it only means anything
       because `npm test` compiles but does not regenerate. A bundle built from
       a different React than package-lock.json pins is not the code anyone
       reviewed, and nothing about the page would say so. */
    const built = await bundleVendor();
    assert.deepEqual(built.map(([name]) => name).sort(), committed,
      'the files on disk are not the files the bundler produces');
    for (const [name, code] of built) {
      assert.equal(read(join('demo', 'vendor', name)), code, `${name} has drifted`);
    }
  });

  test('every specifier the import map names has a bundle, and the reverse', () => {
    /* A name in one and not the other is the failure this pair exists for.
       The browser resolves the import map, gets a path, and the module either
       404s or is never mentioned again. */
    const map = JSON.parse(read('demo/index.html').match(
      /<script type="importmap">\s*([\s\S]*?)\s*<\/script>/,
    )[1]).imports;
    assert.deepEqual(Object.keys(map).sort(), Object.keys(VENDOR).sort());
    for (const [spec, file] of Object.entries(VENDOR)) {
      assert.equal(map[spec], `./vendor/${file}`, `${spec} points somewhere else`);
      assert.ok(committed.includes(file), `${spec} names ${file}, which is not committed`);
    }
  });

  test('nothing in the demo reaches for a CDN', () => {
    /* The whole point. A single specifier left pointing at esm.sh puts the
       network back in the release gate, and the page would still work on the
       machine of whoever added it. */
    for (const page of ['demo/index.html', 'demo/states.html']) {
      assert.doesNotMatch(read(page), /esm\.sh|unpkg|cdn\.|jsdelivr/,
        `${page} still names a CDN`);
    }
    for (const file of committed) {
      assert.doesNotMatch(read(join('demo', 'vendor', file)), /https?:\/\/esm\.sh/,
        `${file} still imports from esm.sh`);
    }
  });

  test('there is exactly one React in the bundles', () => {
    /* Two copies is not a bigger download, it is two renderers that cannot see
       each other's hooks, and it presents as a blank page rather than a
       warning. Splitting is what prevents it, so this asserts the shape
       splitting produces: the entries are thin and the shared code is in
       chunks they both import. */
    const entries = Object.values(VENDOR);
    const chunks = committed.filter((f) => !entries.includes(f));
    assert.ok(chunks.length > 0, 'no shared chunk, so each entry carries its own copy');

    const reactEntry = read(join('demo', 'vendor', VENDOR.react));
    assert.ok(reactEntry.length < 2000,
      'the react entry is carrying an implementation rather than importing the shared one');
    assert.match(reactEntry, /from"\.\/chunk-/, 'the react entry imports no shared chunk');
  });

  test('the bundles are the production build', () => {
    /* React's development build is several times the size and warns into a
       console that check:a11y and check:interaction both read. */
    const client = read(join('demo', 'vendor', VENDOR['react-dom/client']));
    assert.doesNotMatch(client, /react-dom\.development|Warning: /,
      'this looks like the development build');
  });

  test('the vendored runtime stays out of the published package', () => {
    /* Half a megabyte of React in a CSS kit's tarball, in every consumer's
       node_modules, for a demo they did not ask for. */
    const files = JSON.parse(read('package.json')).files;
    assert.ok(files.includes('demo'), 'the demo is no longer published at all');
    assert.ok(files.includes('!demo/vendor'), 'demo/vendor is not excluded from the tarball');
  });
});
