/**
 * The gate that proves the contrast gate fires.
 *
 * test/fixture/fail.tastecheck.json checks the bevel highlight against the
 * 3:1 an edge would need, which it misses at 1.47:1 by design. So the fixture
 * passing means taste-check has stopped measuring, and every green `npm run
 * check` above it means nothing. A gate nobody has watched fail is a gate
 * nobody should believe.
 *
 * This was an inline shell block copied into both workflows, and `npm run
 * release` had no copy at all, because `if npx taste-check ...; then exit 1;
 * fi` does not sit in a package.json script. So a local release skipped the
 * one check that certifies the others. It is a repo script now for the reason
 * check-exports.mjs gives: an inline script cannot have a test on it, and
 * three copies of a gate are three chances for one of them to drift.
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

import { ROOT, report } from './browser.mjs';

export const FIXTURE = 'test/fixture/fail.tastecheck.json';

/** The fixture's exit code, run the way CI runs it. */
export function runFixture(config = FIXTURE) {
  const bin = join(ROOT, 'node_modules', '.bin', 'taste-check');
  const r = spawnSync(bin, ['--config', config], { cwd: ROOT, encoding: 'utf8' });
  if (r.error) return { status: null, output: String(r.error.message) };
  return { status: r.status, output: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

/** Why this run is not acceptable, as lines. */
export function verdict({ status, output }) {
  if (status === null) return [`the fixture did not run at all: ${output.trim().split('\n')[0]}`];
  if (status === 0) return ['the failing fixture passed, so the contrast check is not checking'];
  return [];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const run = runFixture(process.argv[2] ?? FIXTURE);
  const failures = verdict(run);
  if (failures.length) console.error(run.output);
  report('gate', failures, '1 fixture that must fail');
}
