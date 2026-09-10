/**
 * The demo's runtime dependencies, bundled into the repo.
 *
 * demo/index.html boots React through an import map, and that map pointed at
 * esm.sh. It made the demo, and therefore six of the eleven checks, depend on
 * a third party being reachable at the moment they ran.
 *
 * That is not theoretical. The 0.7.1 publish workflow failed on check:a11y
 * with nine of twenty-four combinations scanned and ZERO opened surfaces: the
 * React page had not booted, so every interactive element "never appeared".
 * The identical commit had passed the same gate on the main push minutes
 * earlier. A release gate that fails on somebody else's uptime teaches people
 * to re-run it until it goes green, which is how a real failure gets waved
 * through.
 *
 * ── Why a bundler, in a repo that had avoided one ─────────────────────────
 * React 19 ships CommonJS and no browser ESM at all: node_modules/react has no
 * .mjs and its exports map points at an index.js that is require()-shaped. A
 * browser import map cannot use that. Something has to do the transform, and
 * the choice is between a bundler here and a CDN doing it at request time,
 * which is the thing being removed.
 *
 * esbuild rather than fetching esm.sh's output and committing that: this
 * builds from the versions package-lock.json already pins, so the artifact
 * derives from the dependency tree the project resolved rather than from a
 * service's transform of it, and `npm run generate` needs no network.
 *
 * ── One React, and how code splitting keeps it that way ───────────────────
 * A second copy of React is not a bigger download, it is two renderers that
 * cannot see each other's hooks, and the failure is a blank page rather than a
 * warning.
 *
 * The first attempt gave each entry its own bundle and marked the ones below
 * it external, so a bare specifier would go back through the import map. That
 * cannot work from CommonJS sources: esbuild has no way to turn
 * `require("react")` inside react-dom's CJS into a static import, so it emits a
 * shim that throws `Dynamic require of "react" is not supported` the moment the
 * page boots.
 *
 * Splitting is the tool that actually answers this. One build, five entry
 * points, no externals: esbuild lifts everything shared into a chunk both
 * entries import, so react-dom and radix-ui reference the same React rather
 * than carrying one each. The import map names the five entries and the chunks
 * resolve between themselves.
 */
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'demo', 'vendor');

/**
 * The bare specifier the demo imports, and the file it is served from.
 *
 * Every key here has to be a key in demo/index.html's import map, and every
 * key there has to be one of these. A test holds the two lists together,
 * because a specifier in one and not the other is a page that boots to a blank
 * screen with one console line.
 */
export const VENDOR = {
  react: 'react.js',
  'react/jsx-runtime': 'react-jsx-runtime.js',
  'react-dom': 'react-dom.js',
  'react-dom/client': 'react-dom-client.js',
  'radix-ui': 'radix-ui.js',
};

/**
 * Every entry in one splitting build, so shared code is shared rather than
 * duplicated.
 *
 * The entries are handed to esbuild as resolved FILES rather than as bare
 * specifiers. That is a fix rather than a detail: esbuild matches an external
 * package name across its subpaths, so an entry of "react-dom/client" with
 * "react-dom" external externalised itself and emitted 96 bytes re-exporting
 * the specifier it was supposed to be replacing. It also settles the export
 * shape without guessing, which a hand-written entry cannot: radix-ui's ESM
 * build has no default export and re-exporting one was a hard error, while
 * react's CJS needs the interop esbuild adds from a file.
 */
/**
 * A one-line ESM entry per specifier, handed to esbuild as a virtual file.
 *
 * Bundling a CommonJS file directly as an entry point gives a module with a
 * default export and NOTHING else, because esbuild has no reason to guess what
 * `module.exports` will hold. The page then loads five modules successfully and
 * dies on `does not provide an export named 'useLayoutEffect'`. Re-exporting
 * the specifier from an ESM file instead puts esbuild in the interop path it
 * uses for every other CJS import, where it does read the named exports out.
 *
 * A virtual file rather than a temp directory: entry points have to be real
 * paths for splitting, and the alternative is writing scratch files next to the
 * output and remembering to delete them.
 *
 * `export *` does not carry a default, so CommonJS gets one re-exported by
 * hand. ESM does not, and asking for one is a hard build error rather than an
 * empty export: radix-ui ships dist/index.mjs with no default and the first
 * version of this failed on exactly that.
 */
const NS = 'vendor-entry';

/** A name that can be written as a binding in `export const { ... }`. */
const BINDABLE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const RESERVED = new Set(['default', 'import', 'export', 'class', 'function', 'new', 'delete',
  'typeof', 'in', 'of', 'do', 'if', 'else', 'return', 'var', 'let', 'const', 'null', 'true',
  'false', 'this', 'super', 'void', 'with', 'yield', 'await', 'enum']);

/**
 * What a specifier actually exports, asked of Node rather than guessed.
 *
 * This is the part that took three attempts. A browser needs STATIC named
 * exports, and none of the obvious routes produce them from CommonJS:
 *
 *   Bundling the CJS file as the entry gives a default and nothing else, so
 *   the page dies on `does not provide an export named 'useLayoutEffect'`.
 *
 *   `export * from "react"` looks like it fixes that and does not. esbuild
 *   compiles it to a runtime copy onto the namespace object, which is invisible
 *   to the browser's static import checking, so the module still declares only
 *   a default and the same error survives with more bytes behind it.
 *
 * Naming each export is what makes them static. Node already does the
 * CommonJS export detection this needs, so the list comes from importing the
 * module here rather than from a guess about how React writes its exports.
 *
 * `module.exports` turns up as a literal key on react-dom, which is not
 * something that can be written as a binding, so anything unbindable is
 * dropped rather than emitted as a syntax error.
 */
async function namedExports(spec) {
  const mod = await import(spec);
  return Object.keys(mod)
    .filter((k) => k !== 'default' && BINDABLE.test(k) && !RESERVED.has(k))
    .sort();
}

function entryPlugin(exportsBySpec) {
  return {
    name: NS,
    setup(pluginBuild) {
      pluginBuild.onResolve({ filter: new RegExp(`^${NS}:`) }, (args) => ({
        path: args.path.slice(NS.length + 1),
        namespace: NS,
      }));
      pluginBuild.onLoad({ filter: /.*/, namespace: NS }, (args) => {
        const spec = JSON.stringify(args.path);
        const names = exportsBySpec.get(args.path);
        return {
          /* The namespace as the default's fallback needs no detection of
             which packages have one. react is CommonJS and esbuild synthesises
             a default for it; radix-ui ships real ESM with none, and asking
             for one unconditionally is a hard build error.

             Detecting which is which by resolving the specifier does not work
             and is worth writing down: require.resolve follows the `require`
             condition to radix-ui's dist/index.js while esbuild follows
             `import` to dist/index.mjs, so the check answered for a file the
             bundle never read. */
          contents: `import * as all from ${spec};\n`
            + `export default all.default ?? all;\n`
            + (names.length ? `export const { ${names.join(', ')} } = all;\n` : ''),
          resolveDir: ROOT,
          loader: 'js',
        };
      });
    },
  };
}

/**
 * Every entry in one splitting build, so shared code is shared rather than
 * duplicated.
 *
 * The entries are handed to esbuild as resolved FILES rather than as bare
 * specifiers. That is a fix rather than a detail: esbuild matches an external
 * package name across its subpaths, so an entry of "react-dom/client" with
 * "react-dom" external externalised itself and emitted 96 bytes re-exporting
 * the specifier it was supposed to be replacing. It also settles the export
 * shape without guessing, which a hand-written entry cannot: radix-ui's ESM
 * build has no default export and re-exporting one was a hard error, while
 * react's CJS needs the interop esbuild adds from a file.
 */
/**
 * Every entry in one splitting build, so shared code is shared rather than
 * duplicated and there is exactly one React.
 */
export async function bundleVendor() {
  const exportsBySpec = new Map(
    await Promise.all(Object.keys(VENDOR).map(async (spec) => [spec, await namedExports(spec)])),
  );
  const result = await build({
    entryPoints: Object.fromEntries(
      Object.entries(VENDOR).map(([spec, file]) => [file.replace(/\.js$/, ''), `${NS}:${spec}`]),
    ),
    outdir: OUT,
    bundle: true,
    splitting: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    minify: true,
    write: false,
    plugins: [entryPlugin(exportsBySpec)],
    /* Content-derived, so a rebuild of unchanged input is byte identical and
       the drift test can compare rather than trust. */
    chunkNames: 'chunk-[hash]',
    /* The production branch. Without this React ships its development build,
       which is several times the size and warns into a console the checks
       read. */
    define: { 'process.env.NODE_ENV': '"production"' },
    legalComments: 'inline',
  });
  return result.outputFiles
    .map((f) => [f.path.slice(OUT.length + 1), f.text])
    .sort(([a], [b]) => a.localeCompare(b));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  mkdirSync(OUT, { recursive: true });
  const files = await bundleVendor();
  let total = 0;
  for (const [name, code] of files) {
    writeFileSync(join(OUT, name), code);
    total += code.length;
  }
  const entries = Object.keys(VENDOR).length;
  console.log(`demo/vendor            ${entries} entries, ${files.length - entries} shared `
    + `chunk${files.length - entries === 1 ? '' : 's'}, ${(total / 1024).toFixed(1)}kB`);
}
