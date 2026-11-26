// Compile le backend autonome en un Worker ES module prêt à déployer.
import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'server-dist');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const localSdk = path.join(root, 'server', 'base44-sdk.ts');
const localStripe = path.join(root, 'server', 'stripe.ts');
const localRuntime = path.join(root, 'server', 'base44-runtime.ts');

const aliasNpm = {
  name: 'alias-npm-specifiers',
  setup(build) {
    build.onResolve({ filter: /^npm:@base44\/sdk/ }, () => ({ path: localSdk }));
    build.onResolve({ filter: /^npm:stripe/ }, () => ({ path: localStripe }));
    build.onResolve({ filter: /^base44:runtime$/ }, () => ({ path: localRuntime }));
    build.onResolve({ filter: /^npm:/ }, (args) => {
      throw new Error(`Dépendance npm non gérée hors adaptateur : ${args.path} (${args.importer})`);
    });
  },
};

const result = await esbuild.build({
  entryPoints: [path.join(root, 'server', 'index.ts')],
  outfile: path.join(outDir, 'worker.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  minify: true,
  sourcemap: false,
  legalComments: 'none',
  plugins: [aliasNpm],
  banner: {
    js: `globalThis.__denoServeHandlers = globalThis.__denoServeHandlers || [];
if (!globalThis.Deno) globalThis.Deno = {};
if (!globalThis.Deno.env) globalThis.Deno.env = { get: function (k) { return (globalThis.__BORDERO_ENV__ || {})[k]; }, set: function () {}, has: function (k) { return !!(globalThis.__BORDERO_ENV__ || {})[k]; } };
if (!globalThis.Deno.serve) globalThis.Deno.serve = function (h) { globalThis.__denoServeHandlers.push(h); return { finished: Promise.resolve() }; };
if (!globalThis.Deno.args) globalThis.Deno.args = [];`,
  },
  metafile: true,
  logLevel: 'warning',
});

const bytes = fs.statSync(path.join(outDir, 'worker.mjs')).size;
const manifest = {
  entrypoint: 'worker.mjs',
  compatibilityDate: '2025-05-01',
  modules: [{ name: 'worker.mjs', type: 'esm', path: './server-dist/worker.mjs' }],
  assetsDirectory: './dist',
  spa: true,
};
fs.writeFileSync(path.join(root, 'sites.manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`worker.mjs : ${(bytes / 1024).toFixed(0)} Ko · ${Object.keys(result.metafile.inputs).length} modules`);
