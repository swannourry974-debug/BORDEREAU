// Couche d'accès aux entités : stockage générique + RLS + gardes de champs.
import { DB, newId, nowIso } from './db';
import { ENTITY_SCHEMAS, type EntityName } from './generated/entities';
import { canRead, isOpenRule, matchQuery } from './rls';
import {
  filterSelfUserPatch,
  guardWrite,
  isAdmin,
  projectUser,
  ruleOverride,
} from './policies';
import { audit, findUserByEmail, rowToUser, saveUserData } from './auth';
import type { SessionUser } from './types';

export interface EntityContext {
  db: DB;
  user: SessionUser | null;
  service: boolean;
}

interface Row {
  id: string;
  doc: string;
  created_by: string | null;
  created_by_id: string | null;
  created_date: string;
  updated_date: string;
}

type Record_ = Record<string, unknown>;

const WRITE_LIMIT = 1_000;

export class HttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function schemaOf(entity: string) {
  const schema = (ENTITY_SCHEMAS as Record<string, any>)[entity];
  if (!schema) throw new HttpError(`Entité inconnue : ${entity}`, 404);
  return schema;
}

function ruleFor(entity: string, action: 'read' | 'create' | 'update' | 'delete'): unknown {
  const rules = schemaOf(entity).rls;
  if (rules === '__absent__' || rules === undefined) return undefined;
  return (rules as Record<string, unknown>)[action];
}

function withMeta(row: Row): Record_ {
  let doc: Record_ = {};
  try {
    doc = JSON.parse(row.doc) as Record_;
  } catch {
    doc = {};
  }
  return {
    ...doc,
    id: row.id,
    created_by: row.created_by ?? undefined,
    created_by_id: row.created_by_id ?? undefined,
    created_date: row.created_date,
    updated_date: row.updated_date,
  };
}

function applyDefaults(entity: string, data: Record_): Record_ {
  const properties = (schemaOf(entity).properties ?? {}) as Record<string, { default?: unknown }>;
  const out: Record_ = { ...data };
  for (const [field, definition] of Object.entries(properties)) {
    if (out[field] === undefined && definition && Object.prototype.hasOwnProperty.call(definition, 'default')) {
      out[field] = definition.default;
    }
  }
  return out;
}

function validate(entity: string, data: Record_, mode: 'create' | 'update'): void {
  const schema = schemaOf(entity);
  const required = (schema.required ?? []) as string[];
  if (mode === 'create') {
    for (const field of required) {
      const value = data[field];
      if (value === undefined || value === null || value === '') {
        throw new HttpError(`Champ requis manquant : ${field}`);
      }
    }
  }
  const properties = (schema.properties ?? {}) as Record<string, { type?: string; enum?: unknown[] }>;
  for (const [field, definition] of Object.entries(properties)) {
    const value = data[field];
    if (value === undefined || value === null) continue;
    if (definition.type === 'number' && typeof value !== 'number') {
      throw new HttpError(`Le champ ${field} doit être un nombre.`);
    }
    if (definition.type === 'boolean' && typeof value !== 'boolean') {
      throw new HttpError(`Le champ ${field} doit être un booléen.`);
    }
    if (Array.isArray(definition.enum) && !definition.enum.includes(value)) {
      throw new HttpError(`Valeur invalide pour ${field}.`);
    }
  }
}

function allowedByRule(entity: string, action: 'read' | 'create' | 'update' | 'delete', record: Record_, ctx: EntityContext): boolean {
  if (ctx.service) return true;
  if (entity === 'User') {
    const override = ruleOverride('User', action, record, ctx.user);
    return override ?? false;
  }
  const override = ruleOverride(entity, action, record, ctx.user);
  if (override !== undefined) return override;

  const rule = ruleFor(entity, action);
  if (rule === undefined) return false;
  if (action === 'read') return canRead(rule, record, ctx.user);
  if (isOpenRule(rule)) return true;
  return canRead(rule, record, ctx.user);
}

// --- Lecture --------------------------------------------------------------

export interface ListOptions {
  query?: unknown;
  order?: string;
  limit?: number;
}

export async function listEntity(ctx: EntityContext, entity: string, options: ListOptions = {}): Promise<Record_[]> {
  schemaOf(entity);
  if (entity === 'User') return listUsers(ctx, options);

  const rows = await ctx.db.all<Row>(
    'SELECT id, doc, created_by, created_by_id, created_date, updated_date FROM entity_rows WHERE entity = ?',
    entity,
  );

  const cap = ctx.service ? 5000 : WRITE_LIMIT;
  const limit = Math.min(Math.max(Number(options.limit) || 200, 1), cap);

  let records = rows.map(withMeta).filter((record) => matchQuery(options.query, record));
  if (!ctx.service) {
    records = records.filter((record) => allowedByRule(entity, 'read', record, ctx));
  }

  const order = options.order || '-created_date';
  const descending = order.startsWith('-');
  const field = descending ? order.slice(1) : order;
  records.sort((a, b) => {
    const left = a[field];
    const right = b[field];
    if (left === right) return 0;
    if (left === undefined || left === null) return 1;
    if (right === undefined || right === null) return -1;
    return (left < right ? -1 : 1) * (descending ? -1 : 1);
  });

  return records.slice(0, limit);
}

export async function getEntity(ctx: EntityContext, entity: string, id: string): Promise<Record_> {
  schemaOf(entity);
  if (entity === 'User') {
    const row = await ctx.db.first<{ id: string }>('SELECT id FROM users WHERE id = ?', id);
    if (!row) throw new HttpError('Introuvable', 404);
    const user = await userRecord(ctx, id);
    if (!allowedByRule('User', 'read', user, ctx)) throw new HttpError('Accès refusé', 403);
    return projectUser(user, ctx.user);
  }

  const row = await ctx.db.first<Row>(
    'SELECT id, doc, created_by, created_by_id, created_date, updated_date FROM entity_rows WHERE entity = ? AND id = ?',
    entity,
    id,
  );
  if (!row) throw new HttpError('Introuvable', 404);
  const record = withMeta(row);
  if (!allowedByRule(entity, 'read', record, ctx)) throw new HttpError('Accès refusé', 403);
  return record;
}

export async function countEntity(ctx: EntityContext, entity: string, query: unknown): Promise<number> {
  const records = await listEntity(ctx, entity, { query, limit: ctx.service ? 5000 : WRITE_LIMIT });
  return records.length;
}

export async function aggregateEntity(
  ctx: EntityContext,
  entity: string,
  options: { query?: unknown; groupBy?: string },
): Promise<{ rows: Array<Record<string, unknown>> }> {
  const records = await listEntity(ctx, entity, { query: options.query, limit: ctx.service ? 5000 : WRITE_LIMIT });
  const groupBy = options.groupBy;
  if (!groupBy) return { rows: [{ count: records.length }] };
  const counts = new Map<unknown, number>();
  for (const record of records) {
    const key = record[groupBy];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return {
    rows: Array.from(counts.entries()).map(([key, count]) => ({ [groupBy]: key ?? null, count, key: key ?? null })),
  };
}

// --- Écriture -------------------------------------------------------------

export async function createEntity(ctx: EntityContext, entity: string, input: unknown): Promise<Record_> {
  schemaOf(entity);
  if (entity === 'User') throw new HttpError('Création de compte via /api/auth/signup', 400);

  const raw = (input ?? {}) as Record_;
  const guarded = guardWrite(entity, ctx.user, raw, 'create');
  if (guarded.blocked.length && !ctx.service) {
    throw new HttpError(`Champs interdits : ${guarded.blocked.join(', ')}`, 403);
  }

  const data = applyDefaults(entity, guarded.patch);
  validate(entity, data, 'create');

  const record: Record_ = {
    ...data,
    created_by: ctx.user?.email ?? null,
    created_by_id: ctx.user?.id ?? null,
  };
  if (!allowedByRule(entity, 'create', record, ctx)) throw new HttpError('Création non autorisée', 403);

  const id = newId();
  const timestamp = nowIso();
  await ctx.db.run(
    'INSERT INTO entity_rows (entity, id, doc, created_by, created_by_id, created_date, updated_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    entity,
    id,
    JSON.stringify(data),
    record.created_by,
    record.created_by_id,
    timestamp,
    timestamp,
  );
  await audit(ctx.db, ctx.user?.email ?? 'service', 'entity.create', entity, id);
  return { ...data, id, created_by: record.created_by ?? undefined, created_by_id: record.created_by_id ?? undefined, created_date: timestamp, updated_date: timestamp };
}

export async function updateEntity(ctx: EntityContext, entity: string, id: string, input: unknown): Promise<Record_> {
  schemaOf(entity);
  if (entity === 'User') return updateUserEntity(ctx, id, input);

  const row = await ctx.db.first<Row>(
    'SELECT id, doc, created_by, created_by_id, created_date, updated_date FROM entity_rows WHERE entity = ? AND id = ?',
    entity,
    id,
  );
  if (!row) throw new HttpError('Introuvable', 404);
  const existing = withMeta(row);
  if (!allowedByRule(entity, 'update', existing, ctx)) throw new HttpError('Modification non autorisée', 403);

  const guarded = guardWrite(entity, ctx.user, (input ?? {}) as Record_, 'update');
  if (guarded.blocked.length && !ctx.service) {
    throw new HttpError(`Champs réservés au serveur : ${guarded.blocked.join(', ')}`, 403);
  }

  let doc: Record_ = {};
  try {
    doc = JSON.parse(row.doc) as Record_;
  } catch {
    doc = {};
  }
  const patch = { ...guarded.patch };
  delete patch.id;
  const merged = applyDefaults(entity, { ...doc, ...patch });
  validate(entity, { ...merged, ...patch }, 'update');

  const updated = { ...doc, ...patch };
  const timestamp = nowIso();
  await ctx.db.run(
    'UPDATE entity_rows SET doc = ?, updated_date = ? WHERE entity = ? AND id = ?',
    JSON.stringify(updated),
    timestamp,
    entity,
    id,
  );
  if (guarded.revalidate) {
    await audit(ctx.db, ctx.user?.email ?? 'service', 'entity.revalidate', entity, id, Object.keys(patch));
  }
  return { ...updated, ...projectMeta(row), updated_date: timestamp };
}

function projectMeta(row: Row) {
  return {
    id: row.id,
    created_by: row.created_by ?? undefined,
    created_by_id: row.created_by_id ?? undefined,
    created_date: row.created_date,
  };
}

export async function deleteEntity(ctx: EntityContext, entity: string, id: string): Promise<{ ok: true }> {
  schemaOf(entity);
  if (entity === 'User') {
    if (!ctx.service && ctx.user?.role !== 'admin') throw new HttpError('Suppression non autorisée', 403);
    await ctx.db.run('DELETE FROM users WHERE id = ?', id);
    await ctx.db.run('DELETE FROM sessions WHERE user_id = ?', id);
    await audit(ctx.db, ctx.user?.email ?? 'service', 'user.delete', 'User', id);
    return { ok: true };
  }

  const row = await ctx.db.first<Row>(
    'SELECT id, doc, created_by, created_by_id, created_date, updated_date FROM entity_rows WHERE entity = ? AND id = ?',
    entity,
    id,
  );
  if (!row) throw new HttpError('Introuvable', 404);
  if (!allowedByRule(entity, 'delete', withMeta(row), ctx)) throw new HttpError('Suppression non autorisée', 403);
  await ctx.db.run('DELETE FROM entity_rows WHERE entity = ? AND id = ?', entity, id);
  await audit(ctx.db, ctx.user?.email ?? 'service', 'entity.delete', entity, id);
  return { ok: true };
}

export async function bulkCreateEntity(ctx: EntityContext, entity: string, inputs: unknown[]): Promise<Record_[]> {
  const out: Record_[] = [];
  for (const input of inputs) out.push(await createEntity(ctx, entity, input));
  return out;
}

export async function bulkUpdateEntity(
  ctx: EntityContext,
  entity: string,
  updates: Array<{ id: string; data: Record_ }>,
): Promise<Record_[]> {
  const out: Record_[] = [];
  for (const update of updates) out.push(await updateEntity(ctx, entity, update.id, update.data));
  return out;
}

// --- Utilisateurs ---------------------------------------------------------

async function userRecord(ctx: EntityContext, id: string): Promise<Record_> {
  const row = await ctx.db.first<any>('SELECT * FROM users WHERE id = ?', id);
  if (!row) throw new HttpError('Introuvable', 404);
  const user = rowToUser(row);
  return { ...user.data, id: user.id, email: user.email, role: user.role, full_name: user.full_name ?? '', created_date: user.created_date, updated_date: user.updated_date };
}

async function listUsers(ctx: EntityContext, options: ListOptions): Promise<Record_[]> {
  if (!ctx.service && !ctx.user) throw new HttpError('Connexion requise', 401);
  const rows = await ctx.db.all<any>('SELECT * FROM users');
  let records = rows.map((row) => {
    const user = rowToUser(row);
    return { ...user.data, id: user.id, email: user.email, role: user.role, full_name: user.full_name ?? '', created_date: user.created_date, updated_date: user.updated_date };
  });

  if (!ctx.service && !isAdmin(ctx.user)) {
    const email = ctx.user?.email?.toLowerCase();
    records = email
      ? records.filter((record) => String(record.email).toLowerCase() === email)
      : [];
  }
  records = records.filter((record) => matchQuery(options.query, record));
  return records.slice(0, Math.min(Number(options.limit) || 200, 5000));
}

async function updateUserEntity(ctx: EntityContext, id: string, input: unknown): Promise<Record_> {
  const row = await ctx.db.first<any>('SELECT * FROM users WHERE id = ?', id);
  if (!row) throw new HttpError('Introuvable', 404);
  const current = rowToUser(row);
  const record = await userRecord(ctx, id);
  if (!allowedByRule('User', 'update', { ...record, id: current.id }, ctx)) {
    throw new HttpError('Modification non autorisée', 403);
  }

  const patch = (input ?? {}) as Record_;
  if (!isAdmin(ctx.user) && ctx.user?.id !== id) throw new HttpError('Modification non autorisée', 403);

  let allowed = patch;
  if (!isAdmin(ctx.user)) {
    const filtered = filterSelfUserPatch(current, patch);
    if (filtered.rejected.length) {
      throw new HttpError(`Champs non modifiables : ${filtered.rejected.join(', ')}`, 403);
    }
    allowed = filtered.patch;
  }
  const updated = await saveUserData(ctx.db, current, allowed);
  return { ...updated.data, id: updated.id, email: updated.email, role: updated.role, full_name: updated.full_name ?? '' };
}

// --- Migration / seed -----------------------------------------------------

export async function upsertRaw(
  db: DB,
  entity: string,
  doc: Record_,
  meta: { id?: string; created_by?: string | null; created_by_id?: string | null; created_date?: string },
): Promise<string> {
  const id = meta.id || String(doc.id || newId());
  const timestamp = meta.created_date || nowIso();
  const clean = { ...doc };
  delete clean.id;
  delete clean.created_by;
  delete clean.created_by_id;
  delete clean.created_date;
  delete clean.updated_date;
  await db.run(
    'INSERT INTO entity_rows (entity, id, doc, created_by, created_by_id, created_date, updated_date) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(entity, id) DO UPDATE SET doc = excluded.doc, updated_date = excluded.updated_date',
    entity,
    id,
    JSON.stringify(clean),
    meta.created_by ?? null,
    meta.created_by_id ?? null,
    timestamp,
    timestamp,
  );
  return id;
}

export { findUserByEmail };
export type { EntityName };
