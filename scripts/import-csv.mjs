// Script d'import CSV dans la base Bordero (SQLite locale) via upsertRaw.
// Usage : node scripts/import-csv.mjs <entity> <fichier.csv> [--id-col id]
// Préserve les identifiants d'origine pour garder les liens entre entités.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), '.data', 'bordero.sqlite');
const entity = process.argv[2];
const file = process.argv[3];
const idCol = process.argv.includes('--id-col') ? process.argv[process.argv.indexOf('--id-col') + 1] : 'id';

if (!entity || !file) {
  console.error('Usage : node scripts/import-csv.mjs <entity> <fichier.csv> [--id-col id]');
  process.exit(1);
}
if (!fs.existsSync(file)) {
  console.error(`Fichier introuvable : ${file}`);
  process.exit(1);
}
if (!fs.existsSync(DB_PATH)) {
  console.error(`Base introuvable : ${DB_PATH}. Lancez d'abord le serveur pour créer le schéma.`);
  process.exit(1);
}

// Parse CSV simple (gère les guillemets)
function parseCsv(text) {
  const lines = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === '\n' && !inQuotes) {
      lines.push(current);
      current = '';
    } else if (ch === '\r' && !inQuotes) {
      // skip
    } else {
      current += ch;
    }
  }
  if (current) lines.push(current);

  const rows = [];
  const header = splitLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const vals = splitLine(lines[i]);
    const obj = {};
    header.forEach((h, idx) => {
      let v = vals[idx] ?? '';
      // Tenter de parser JSON pour les objets/tableaux
      if (v.startsWith('{') || v.startsWith('[')) {
        try { v = JSON.parse(v); } catch { /* garde la chaîne */ }
      }
      // Convertir les nombres
      if (typeof v === 'string' && v !== '' && !isNaN(Number(v)) && !/^\d{4}-/.test(v)) {
        v = Number(v);
      }
      // Convertir les booléens
      if (v === 'true') v = true;
      if (v === 'false') v = false;
      obj[h] = v;
    });
    rows.push(obj);
  }
  return { header, rows };
}

function splitLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

const db = new DatabaseSync(DB_PATH);
const text = fs.readFileSync(file, 'utf8');
const { header, rows } = parseCsv(text);

console.log(`Import de ${rows.length} lignes dans ${entity}...`);

const now = new Date().toISOString();
let ok = 0, err = 0;
for (const row of rows) {
  const id = row[idCol] || row.id;
  const clean = { ...row };
  delete clean[idCol];
  if (idCol !== 'id') delete clean.id;
  const meta = {
    id: id ? String(id) : undefined,
    created_by: row.created_by ?? null,
    created_by_id: row.created_by_id ?? null,
    created_date: row.created_date || now,
  };
  try {
    db.prepare(`INSERT INTO entity_rows (entity, id, doc, created_by, created_by_id, created_date, updated_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(entity, id) DO UPDATE SET doc = excluded.doc, updated_date = excluded.updated_date`).run(
      entity,
      meta.id,
      JSON.stringify(clean),
      meta.created_by,
      meta.created_by_id,
      meta.created_date,
      now,
    );
    ok++;
  } catch (e) {
    console.error(`  Erreur ligne ${ok + err + 1}: ${e.message}`);
    err++;
  }
}

console.log(`Terminé : ${ok} importés, ${err} erreurs.`);
db.close();
