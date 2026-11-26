// Script d'export CSV des entités Bordero (base SQLite locale).
// Usage : node scripts/export-csv.mjs [entity] [--out dir]
// Sans entity : exporte toutes les entités dans out/csv/.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), '.data', 'bordero.sqlite');
const OUT_DIR = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : path.join(process.cwd(), 'out', 'csv');

const entityArg = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;

if (!fs.existsSync(DB_PATH)) {
  console.error(`Base introuvable : ${DB_PATH}`);
  process.exit(1);
}

const db = new DatabaseSync(DB_PATH);
fs.mkdirSync(OUT_DIR, { recursive: true });

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCsv(rows) {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const header = keys.map(csvEscape).join(',');
  const body = rows.map((r) => keys.map((k) => csvEscape(r[k])).join(',')).join('\n');
  return header + '\n' + body + '\n';
}

const entities = entityArg
  ? [entityArg]
  : db.prepare("SELECT DISTINCT entity FROM entity_rows ORDER BY entity").all().map((r) => r.entity);

let total = 0;
for (const entity of entities) {
  const rows = db.prepare('SELECT id, doc, created_by, created_by_id, created_date, updated_date FROM entity_rows WHERE entity = ?').all(entity);
  const records = rows.map((r) => {
    let doc = {};
    try { doc = JSON.parse(r.doc); } catch { doc = {}; }
    return { id: r.id, ...doc, created_by: r.created_by, created_by_id: r.created_by_id, created_date: r.created_date, updated_date: r.updated_date };
  });
  const csv = toCsv(records);
  const file = path.join(OUT_DIR, `${entity}.csv`);
  fs.writeFileSync(file, csv, 'utf8');
  console.log(`${entity}: ${records.length} lignes → ${file}`);
  total += records.length;
}

// Users
if (!entityArg || entityArg === 'User') {
  const rows = db.prepare('SELECT * FROM users').all();
  const records = rows.map((r) => {
    let data = {};
    try { data = JSON.parse(r.data || '{}'); } catch { data = {}; }
    return { id: r.id, email: r.email, role: r.role, full_name: r.full_name, ...data, created_date: r.created_date, updated_date: r.updated_date };
  });
  const csv = toCsv(records);
  const file = path.join(OUT_DIR, 'User.csv');
  fs.writeFileSync(file, csv, 'utf8');
  console.log(`User: ${records.length} lignes → ${file}`);
  total += records.length;
}

console.log(`\nTotal : ${total} enregistrements exportés dans ${OUT_DIR}`);
db.close();
