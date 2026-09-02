/**
 * Writes demo/docs-data.json: every token with its resolved value per theme,
 * and every contrast pair with the ratio the gate actually measured.
 *
 * Generated from the same sources the gate reads, and from the gate itself,
 * so the numbers in the documentation cannot drift from the numbers in the
 * build. A hand-written token table is a second copy of the contract that
 * nothing checks, and a hand-written contrast table is worse: it is a claim
 * about accessibility with no measurement behind it.
 *
 * Publishing the measured ratios is the part no peer kit does. We compute
 * all fifty-four on every run either way; the only work is writing them down
 * where a reader can see them.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  load, parseDeclarations, resolveScopes, resolveValue, runContrast,
} from '@josueavalosjim/taste-check';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

/* Which files hold which axis, and which scope selects each variant. The
   scopes mirror tastecheck.config.json rather than being invented here; if
   they drift, the gate fails first and loudly. */
const GROUPS = [
  { name: 'Colour roles', file: 'css/tokens/semantic.chrome.css',
    variants: [['light', [':root']], ['dark', [':root', '[data-theme="dark"]']]] },
  { name: 'Raw ramp', file: 'css/tokens/primitive.chrome.css',
    variants: [['both', [':root']]] },
  { name: 'Structure', file: 'css/tokens/structural.css',
    variants: [['both', [':root']]] },
  { name: 'Density', file: 'css/tokens/density.css',
    variants: [['comfortable', [':root']], ['compact', ['[data-density="compact"]']]] },
  { name: 'Skin knobs', file: 'css/tokens/skin.chrome.css',
    variants: [['light', [':root']], ['dark', [':root', '[data-theme="dark"]']]] },
  { name: 'Motion', file: 'css/tokens/motion.css',
    variants: [['both', [':root']]] },
];

/* The raw ramp, parsed once. A semantic token's declared value is another
   token's name, and that name lives in a different file, so resolving inside
   one file's own declarations returns nothing every time. The reader wants
   the literal a var() chain lands on. */
const PRIMITIVES = parseDeclarations(
  readFileSync(join(ROOT, 'css/tokens/primitive.chrome.css'), 'utf8'));

function tokensFor(group) {
  const decls = parseDeclarations(readFileSync(join(ROOT, group.file), 'utf8'));
  const rows = new Map();
  for (const [variant, scopes] of group.variants) {
    const own = resolveScopes(decls, scopes);
    const table = new Map([...resolveScopes(PRIMITIVES, [':root']), ...own]);
    for (const [name, decl] of own) {
      if (!name.startsWith('--pw-')) continue;
      const resolved = resolveValue(table, name);
      const row = rows.get(name) ?? { name, values: {} };
      row.values[variant] = {
        declared: decl.value,
        /* The literal a var() chain lands on, which is what a reader wants
           when the declared value is another token's name. */
        resolved: resolved.ok && resolved.value !== decl.value ? resolved.value : null,
      };
      rows.set(name, row);
    }
  }
  return { name: group.name, file: group.file, tokens: [...rows.values()] };
}

const { ok, config, dir, errors } = load(join(ROOT, 'tastecheck.config.json'));
if (!ok) {
  console.error(`tastecheck.config.json is not valid:\n  ${errors.join('\n  ')}`);
  process.exit(1);
}

const contrast = runContrast(config.contrast, dir);
const data = {
  generated: 'scripts/build-docs-data.mjs',
  groups: GROUPS.map(tokensFor),
  contrast: contrast.samples.map((s) => ({
    theme: s.theme, fg: s.fg, bg: s.bg, note: s.note ?? null,
    ratio: Math.round(s.ratio * 100) / 100, min: s.min, pass: s.pass,
  })),
};

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(join(ROOT, 'demo', 'docs-data.json'), `${JSON.stringify(data, null, 1)}\n`);
  const count = data.groups.reduce((a, g) => a + g.tokens.length, 0);
  console.log(`demo/docs-data.json  ${count} tokens, ${data.contrast.length} measured pairs`);
}

export { data };
