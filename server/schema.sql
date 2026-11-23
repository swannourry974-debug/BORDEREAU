-- Schéma D1 du backend Bordero autonome.
-- Les entités "métier" partagent une table générique : le document JSON complet
-- est stocké dans `doc`, les colonnes utiles aux permissions sont dupliquées.

PRAGMA foreign_keys = ON;

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
  user_agent   TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
  used         INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
