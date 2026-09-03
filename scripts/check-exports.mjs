/**
 * Every path in the exports map has to be in the tarball.
 *
 * A stylesheet left out of the files array publishes a package whose own
 * documented import throws on install, and nothing before the publish would
 * notice, because a local checkout has the file whether or not npm ships it.
 *
 * This was an inline script inside publish.yml, and it was broken from the day
 * it was written: it did `v.replace()` over the values of the exports map, and
 * the "." entry is a conditional object rather than a string, so it threw a
 * TypeError on the first entry. Nothing ran it until the first real tag, where
 * it failed the release without ever having checked anything. A check that
 * cannot pass is the same bug as one that cannot fail, and both come from the
 * same place: code with no test on it, which an inline shell script can never
 * have. So it lives here, and test/contract.test.mjs runs it.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Every concrete path the exports map points at, wildcards excluded. */
export function exportedPaths(pkg) {
  const out = [];
  const walk = (name, node) => {
    if (typeof node === 'string') {
      if (!node.includes('*')) out.push([name, node.replace(/^\.\//, '')]);
      return;
    }
    /* A conditional export is an object of condition to target, and it nests:
       { ".": { "types": "...", "import": "..." } }. Every leaf is a path. */
    if (node && typeof node === 'object') for (const value of Object.values(node)) walk(name, value);
  };
  for (const [name, node] of Object.entries(pkg.exports ?? {})) walk(name, node);
  return out;
}

/** The files npm would actually ship, from npm itself rather than from a guess. */
export function packedFiles() {
  const json = execFileSync('npm', ['pack', '--dry-run', '--json'], { cwd: ROOT, encoding: 'utf8' });
  return new Set(JSON.parse(json)[0].files.map((f) => f.path));
}

export function missingFromPack(pkg, files) {
  return exportedPaths(pkg).filter(([, path]) => !files.has(path));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const paths = exportedPaths(pkg);
  if (!paths.length) {
    console.error('the exports map yielded no paths at all, so this checked nothing');
    process.exit(1);
  }
  const missing = missingFromPack(pkg, packedFiles());
  if (missing.length) {
    console.error('exported but not packed:');
    for (const [name, path] of missing) console.error(`  exports["${name}"] -> ${path}`);
    process.exit(1);
  }
  console.log(`exports ok, ${paths.length} paths, all in the tarball`);
}
