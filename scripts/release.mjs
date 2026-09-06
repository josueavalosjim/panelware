/**
 * The last gate before a tag.
 *
 * This does not bump the version, and that is the fix rather than an
 * omission. It used to end in `npm version ${LEVEL:-patch}`, which fought a
 * test: test/contract.test.mjs holds the changelog's top heading to
 * package.json's version, so writing the entry first meant npm version bumped
 * past it, and bumping first meant the suite went red before the script
 * reached the bump. The documented path was unusable, three releases went out
 * around it by hand, and the script sat there looking authoritative. Run after
 * a hand-set version, it would have tagged a number nobody had written notes
 * for.
 *
 * So the version is a hand edit, which it effectively always was: you cannot
 * write "## 0.2.0" in a changelog without having decided on 0.2.0. What this
 * does instead is refuse to tag unless everything that has to agree already
 * does, which is the checklist those three releases were following from
 * memory.
 *
 * The checks themselves run ahead of this in the npm script, so they stay
 * visible in package.json rather than buried here.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();

/** The version the changelog is currently leading with. */
export function changelogVersion(text) {
  return text.match(/^## (.+)$/m)?.[1].trim() ?? null;
}

/**
 * Every reason not to tag, as lines. Pure, so the interesting part has a test
 * on it: this is the file that decides whether a version ships, and a release
 * gate that cannot be exercised is the thing this repo has spent a fortnight
 * removing.
 */
export function blockers({ version, changelog, branch, dirty, unpushed, tagExists, tagOnRemote }) {
  const out = [];
  const tag = `v${version}`;

  if (changelog !== version) {
    out.push(`the changelog leads with ${changelog ?? 'no version heading'} and package.json says `
      + `${version}. Whichever is right, the other is about to be published as if it were.`);
  }
  if (branch !== 'main') {
    out.push(`on ${branch}, and every tag in this repo's history sits on a commit that is on main. `
      + 'A tag off main publishes code the demo never deploys and the next branch never sees.');
  }
  if (dirty) {
    out.push('the working tree has changes. A tag names a commit, so anything uncommitted is not '
      + 'in the release however finished it feels.');
  }
  if (unpushed > 0) {
    out.push(`${unpushed} commit${unpushed === 1 ? '' : 's'} not on origin. The publish workflow `
      + 'checks out the tag from the remote, so it would build something other than what is here.');
  }
  if (tagExists || tagOnRemote) {
    out.push(`${tag} already exists ${tagOnRemote ? 'on origin' : 'locally'}. npm retires a version `
      + 'number permanently, so this one is spent: pick the next one.');
  }
  return out;
}

/** What the repo actually looks like right now. */
export function state() {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const version = pkg.version;
  let tagOnRemote = false;
  try {
    tagOnRemote = git('ls-remote', '--tags', 'origin', `refs/tags/v${version}`).length > 0;
  } catch {
    /* No network is not a reason to refuse; the publish workflow checks the
       registry itself and a re-tag is a no-op there. */
  }
  return {
    version,
    changelog: changelogVersion(readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8')),
    branch: git('rev-parse', '--abbrev-ref', 'HEAD'),
    dirty: git('status', '--porcelain').length > 0,
    unpushed: Number(git('rev-list', '--count', '@{u}..HEAD')),
    tagExists: git('tag', '--list', `v${version}`).length > 0,
    tagOnRemote,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const now = state();
  const reasons = blockers(now);
  const tag = `v${now.version}`;

  if (reasons.length) {
    console.error(`release blocked, ${reasons.length} reason${reasons.length === 1 ? '' : 's'}\n`);
    for (const line of reasons) console.error(`  ${line}`);
    process.exit(1);
  }

  git('tag', '-a', tag, '-m', `Release ${now.version}`);
  git('push', 'origin', tag);
  console.log(`release ok, ${tag} pushed. The publish workflow runs the whole gate again on the `
    + 'tag and only then publishes.');
}
