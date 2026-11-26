// Génère les fichiers dérivés du backend :
//  - server/generated/entities.ts  : schémas + règles RLS de chaque entité
//  - server/generated/functions.ts : registre des fonctions serveur existantes
// À relancer après toute modification de base44/entities ou base44/functions.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'server', 'generated');
fs.mkdirSync(outDir, { recursive: true });

// --- Entités -------------------------------------------------------------
const entitiesDir = path.join(root, 'base44', 'entities');
const schemas = {};
for (const file of fs.readdirSync(entitiesDir).filter((f) => f.endsWith('.jsonc'))) {
  const raw = fs.readFileSync(path.join(entitiesDir, file), 'utf8');
  const parsed = JSON.parse(raw);
  schemas[parsed.name] = {
    properties: parsed.properties || {},
    required: parsed.required || [],
    rls: Object.prototype.hasOwnProperty.call(parsed, 'rls') ? parsed.rls : '__absent__',
  };
}

fs.writeFileSync(
  path.join(outDir, 'entities.ts'),
  `// Fichier généré par scripts/gen-server.mjs — ne pas éditer à la main.
export const ENTITY_SCHEMAS = ${JSON.stringify(schemas, null, 2)} as const;

export type EntityName = keyof typeof ENTITY_SCHEMAS;
export const ENTITY_NAMES = Object.keys(ENTITY_SCHEMAS) as EntityName[];
`,
);

// --- Fonctions -----------------------------------------------------------
const fnDir = path.join(root, 'base44', 'functions');
const names = fs
  .readdirSync(fnDir)
  .filter((d) => fs.existsSync(path.join(fnDir, d, 'entry.ts')))
  .sort();

// Les fonctions historiques enveloppent leur logique dans Deno.serve(...) sans
// exporter de default : le shim runtime collecte ces handlers au chargement.
const served = new Map();
for (const name of names) {
  const source = fs.readFileSync(path.join(fnDir, name, 'entry.ts'), 'utf8');
  if (/Deno\.serve\s*\(/.test(source) && !/export\s+default/.test(source)) {
    served.set(name, served.size);
  }
}

const imports = names.map((name, i) =>
  served.has(name)
    ? `import '../../base44/functions/${name}/entry.ts';`
    : `import fn${i} from '../../base44/functions/${name}/entry.ts';`,
);
const entries = names.map((name, i) =>
  served.has(name)
    ? `  ${JSON.stringify(name)}: (__served[${served.get(name)}] ?? fn${i}) as FunctionHandler,`
    : `  ${JSON.stringify(name)}: fn${i} as FunctionHandler,`,
);

fs.writeFileSync(
  path.join(outDir, 'functions.ts'),
  `// Fichier généré par scripts/gen-server.mjs — ne pas éditer à la main.
import '../runtime';
import type { FunctionHandler } from '../types';
${imports.join('\n')}

const __served = ((globalThis as any).__denoServeHandlers ?? []) as FunctionHandler[];

export const FUNCTIONS: Record<string, FunctionHandler> = {
${entries.join('\n')}
};
`,
);

console.log(`entities: ${Object.keys(schemas).length} · functions: ${names.length} (dont ${served.size} via Deno.serve)`);
