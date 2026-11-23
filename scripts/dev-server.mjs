// Serveur local du backend autonome : D1 émulé par node:sqlite, fichiers sur disque.
// Permet de tester l'app sans Base44 : `npm run server:dev` (port 8787).
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const dataDir = path.join(root, '.data');
fs.mkdirSync(dataDir, { recursive: true });

const dbFile = process.env.BORDERO_DB || path.join(dataDir, 'bordero.sqlite');
const sqlite = new DatabaseSync(dbFile);
sqlite.exec('PRAGMA journal_mode = WAL;');
sqlite.exec('PRAGMA foreign_keys = ON;');

const schema = fs.readFileSync(path.join(root, 'server', 'schema.sql'), 'utf8');
for (const statement of schema.split(/;\s*(?:\r?\n|$)/)) {
  const clean = statement.replace(/^\s*--.*$/gm, '').trim();
  if (clean) sqlite.exec(clean);
}

function sanitize(value) {
  if (value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return value;
}

class Stmt {
  constructor(sql) {
    this.sql = sql;
    this.params = [];
  }
  bind(...values) {
    this.params = values.map(sanitize);
    return this;
  }
  async all() {
    return { results: sqlite.prepare(this.sql).all(...this.params) };
  }
  async first() {
    return sqlite.prepare(this.sql).get(...this.params) ?? null;
  }
  async run() {
    sqlite.prepare(this.sql).run(...this.params);
    return { success: true };
  }
}

const D1 = {
  prepare: (sql) => new Stmt(sql),
  exec: async (sql) => sqlite.exec(sql),
};

// Stockage local des fichiers (R2 en production).
const filesDir = path.join(dataDir, 'files');
fs.mkdirSync(filesDir, { recursive: true });
const FILES = {
  async put(key, value, options = {}) {
    const target = path.join(filesDir, key);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const buffer = value instanceof ArrayBuffer ? Buffer.from(value) : Buffer.from(String(value));
    fs.writeFileSync(target, buffer);
    fs.writeFileSync(`${target}.meta.json`, JSON.stringify(options.httpMetadata ?? {}));
  },
  async get(key) {
    const target = path.join(filesDir, key);
    if (!fs.existsSync(target)) return null;
    const body = fs.readFileSync(target);
    const meta = fs.existsSync(`${target}.meta.json`) ? JSON.parse(fs.readFileSync(`${target}.meta.json`, 'utf8')) : {};
    return { body: new Response(body).body, httpMetadata: meta };
  },
  async delete(key) {
    fs.rmSync(path.join(filesDir, key), { force: true });
  },
};

const port = Number(process.env.PORT || 8787);
const env = {
  DB: D1,
  FILES,
  APP_ORIGIN: process.env.APP_ORIGIN || `http://localhost:${port}`,
  CRON_SECRET: process.env.CRON_SECRET || 'dev-cron-secret',
  ADMIN_EMAILS: process.env.ADMIN_EMAILS || '',
  ALLOW_SIGNUP: process.env.ALLOW_SIGNUP || 'true',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  MAIL_FROM: process.env.MAIL_FROM || 'Bordero <noreply@thebordero.com>',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
};

const worker = (await import(pathToFileURL(path.join(root, 'server-dist', 'worker.mjs')).href)).default;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

const dist = path.join(root, 'dist');

function serveStatic(request, response, url) {
  let filePath = path.join(dist, decodeURIComponent(url.pathname));
  if (!filePath.startsWith(dist)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    if (path.extname(url.pathname)) {
      response.writeHead(404).end('Not found');
      return;
    }
    filePath = path.join(dist, 'index.html');
  }
  if (!fs.existsSync(filePath)) {
    response.writeHead(404).end('Not found');
    return;
  }
  response.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] ?? 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  if (!url.pathname.startsWith('/api/')) {
    serveStatic(req, res, url);
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const request = new Request(url, {
    method: req.method,
    headers: req.headers,
    ...(body && req.method !== 'GET' && req.method !== 'HEAD' ? { body } : {}),
    duplex: 'half',
  });

  try {
    const response = await worker.fetch(request, env);
    const headers = Object.fromEntries(response.headers.entries());
    const payload = Buffer.from(await response.arrayBuffer());
    res.writeHead(response.status, headers);
    res.end(payload);
  } catch (error) {
    console.error('[dev-server]', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Erreur serveur local' }));
  }
});

server.listen(port, () => {
  console.log(`Backend Bordero local : http://localhost:${port} · base ${dbFile}`);
});
