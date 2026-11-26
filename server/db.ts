// Accès D1 minimal, abstrait pour tourner sur Workers (env.DB) comme en local (node:sqlite).
import type { D1Like, Env } from './types';

export class DB {
  private d1: D1Like;
  constructor(d1: D1Like) {
    this.d1 = d1;
  }

  async all<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T[]> {
    const result = await this.d1.prepare(sql).bind(...params).all<T>();
    return (result?.results ?? []) as T[];
  }

  async first<T = Record<string, unknown>>(sql: string, ...params: unknown[]): Promise<T | null> {
    return (await this.d1.prepare(sql).bind(...params).first<T>()) ?? null;
  }

  async run(sql: string, ...params: unknown[]): Promise<void> {
    await this.d1.prepare(sql).bind(...params).run();
  }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  full_name     TEXT,
  role          TEXT NOT NULL DEFAULT 'lecteur',
  data          TEXT NOT NULL DEFAULT '{}',
  provider      TEXT NOT NULL DEFAULT 'password',
  provider_id   TEXT,
  created_date  TEXT NOT NULL,
  updated_date  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash   TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  created_date TEXT NOT NULL,
  expires_date TEXT NOT NULL,
  user_agent   TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS entity_rows (
  entity       TEXT NOT NULL,
  id           TEXT NOT NULL,
  doc          TEXT NOT NULL,
  created_by   TEXT,
  created_by_id TEXT,
  created_date TEXT NOT NULL,
  updated_date TEXT NOT NULL,
  PRIMARY KEY (entity, id)
);
CREATE INDEX IF NOT EXISTS idx_entity_rows_entity ON entity_rows(entity);
CREATE INDEX IF NOT EXISTS idx_entity_rows_creator ON entity_rows(entity, created_by_id);
CREATE TABLE IF NOT EXISTS outbox (
  id           TEXT PRIMARY KEY,
  to_email     TEXT NOT NULL,
  from_name    TEXT,
  subject      TEXT,
  body         TEXT,
  status       TEXT NOT NULL DEFAULT 'en_attente',
  error        TEXT,
  created_date TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash   TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  created_date TEXT NOT NULL,
  expires_date TEXT NOT NULL,
  used         INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL DEFAULT 0,
  window_start TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_log (
  id           TEXT PRIMARY KEY,
  actor_email  TEXT,
  action       TEXT NOT NULL,
  entity       TEXT,
  record_id    TEXT,
  detail       TEXT,
  created_date TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_date);
`;

let schemaEnsured = false;

export async function ensureSchema(env: Env): Promise<void> {
  if (schemaEnsured) return;
  const database = env.DB;
  for (const statement of SCHEMA.split(';')) {
    const clean = statement.trim();
    if (clean) await database.prepare(clean).run();
  }
  schemaEnsured = true;
}

export function db(env: Env): DB {
  return new DB(env.DB);
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
