// Authentification maison : mots de passe PBKDF2, sessions en cookie HttpOnly.
// Aucun jeton n'est stocké côté navigateur, rien n'est lisible en JavaScript.
import { DB, newId, nowIso } from './db';
import type { Env, SessionUser } from './types';

const COOKIE_NAME = 'bordero_session';
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 100_000;

const encoder = new TextEncoder();

function toB64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromB64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function digestSha256(value: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function normalizeEmail(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}

export function passwordProblem(password: unknown): string | null {
  const value = String(password ?? '');
  if (value.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
  if (value.length > 200) return 'Mot de passe trop long.';
  if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) {
    return 'Le mot de passe doit contenir au moins une lettre et un chiffre.';
  }
  return null;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [scheme, iterationsRaw, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'pbkdf2') return false;
  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations) || iterations < 10_000) return false;
  const expected = fromB64(hashB64);
  const actual = await derive(password, fromB64(saltB64), iterations);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i += 1) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

// --- Sessions -------------------------------------------------------------

export interface SessionRow {
  token_hash: string;
  user_id: string;
  created_date: string;
  expires_date: string;
}

export async function createSession(db: DB, userId: string, userAgent?: string): Promise<{ token: string; expires: Date }> {
  const token = toB64(crypto.getRandomValues(new Uint8Array(32))).replace(/[+/=]/g, '').slice(0, 48);
  const tokenHash = await digestSha256(token);
  const created = new Date();
  const expires = new Date(created.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.run(
    'INSERT INTO sessions (token_hash, user_id, created_date, expires_date, user_agent) VALUES (?, ?, ?, ?, ?)',
    tokenHash,
    userId,
    created.toISOString(),
    expires.toISOString(),
    userAgent ?? null,
  );
  return { token, expires };
}

export async function destroySession(db: DB, token: string | null): Promise<void> {
  if (!token) return;
  const tokenHash = await digestSha256(token);
  await db.run('DELETE FROM sessions WHERE token_hash = ?', tokenHash);
}

export async function destroyUserSessions(db: DB, userId: string): Promise<void> {
  await db.run('DELETE FROM sessions WHERE user_id = ?', userId);
}

export function sessionCookie(token: string, expires: Date, secure = true): string {
  return [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    ...(secure ? ['Secure'] : []),
    'SameSite=Lax',
    `Expires=${expires.toUTCString()}`,
  ].join('; ');
}

export function clearSessionCookie(secure = true): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; ${secure ? 'Secure; ' : ''}SameSite=Lax; Max-Age=0`;
}

export async function hashToken(token: string): Promise<string> {
  return digestSha256(token);
}

export function isLoopback(request: Request): boolean {
  const host = new URL(request.url).hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

export function requestToken(request: Request): string | null {
  const auth = request.headers.get('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim() || null;
  return readCookie(request, COOKIE_NAME);
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  full_name: string | null;
  role: string;
  data: string;
  created_date: string;
  updated_date: string;
}

function parseData(raw: unknown): Record<string, unknown> {
  if (typeof raw !== 'string' || !raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function rowToUser(row: UserRow): SessionUser {
  const data = parseData(row.data);
  return {
    id: row.id,
    email: row.email,
    full_name: data.full_name ?? row.full_name ?? undefined,
    role: row.role as SessionUser['role'],
    data,
    created_date: row.created_date,
    updated_date: row.updated_date,
  };
}

export async function findUserByEmail(db: DB, email: string): Promise<UserRow | null> {
  return db.first<UserRow>('SELECT * FROM users WHERE email = ?', normalizeEmail(email));
}

export async function findUserById(db: DB, id: string): Promise<UserRow | null> {
  return db.first<UserRow>('SELECT * FROM users WHERE id = ?', id);
}

export async function userFromRequest(db: DB, request: Request): Promise<SessionUser | null> {
  const token = requestToken(request);
  if (!token) return null;
  const tokenHash = await digestSha256(token);
  const row = await db.first<SessionRow>('SELECT * FROM sessions WHERE token_hash = ?', tokenHash);
  if (!row) return null;
  if (new Date(row.expires_date).getTime() < Date.now()) {
    await db.run('DELETE FROM sessions WHERE token_hash = ?', tokenHash);
    return null;
  }
  const user = await findUserById(db, row.user_id);
  return user ? rowToUser(user) : null;
}

export function publicUser(user: SessionUser): Record<string, unknown> {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name ?? user.data?.full_name ?? '',
    role: user.role,
    ...user.data,
    created_date: user.created_date,
    updated_date: user.updated_date,
  };
}

export async function saveUserData(db: DB, user: SessionUser, patch: Record<string, unknown>): Promise<SessionUser> {
  const nextData = { ...user.data, ...patch };
  if (typeof patch.full_name === 'string' && patch.full_name.trim()) {
    nextData.full_name = patch.full_name.trim();
  }
  const row = await findUserById(db, user.id);
  if (!row) throw Object.assign(new Error('Compte introuvable'), { status: 404 });

  const nextRole = typeof patch.role === 'string' ? patch.role : user.role;
  await db.run(
    'UPDATE users SET data = ?, full_name = ?, role = ?, updated_date = ? WHERE id = ?',
    JSON.stringify(nextData),
    String(nextData.full_name ?? row.full_name ?? ''),
    nextRole,
    nowIso(),
    user.id,
  );
  return { ...user, role: nextRole, data: nextData, full_name: String(nextData.full_name ?? '') };
}

export async function createUser(
  db: DB,
  input: { email: string; password?: string; full_name?: string; role?: string; data?: Record<string, unknown> },
): Promise<SessionUser> {
  const email = normalizeEmail(input.email);
  const existing = await findUserByEmail(db, email);
  if (existing) throw Object.assign(new Error('Un compte existe déjà avec cette adresse.'), { status: 409 });

  const id = newId();
  const timestamp = nowIso();
  const data: Record<string, unknown> = { ...(input.data ?? {}) };
  if (input.full_name) data.full_name = input.full_name.trim();
  const passwordHash = input.password ? await hashPassword(input.password) : null;

  await db.run(
    'INSERT INTO users (id, email, password_hash, full_name, role, data, created_date, updated_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    id,
    email,
    passwordHash,
    data.full_name ?? '',
    input.role ?? 'lecteur',
    JSON.stringify(data),
    timestamp,
    timestamp,
  );

  await db.run(
    'INSERT INTO audit_log (id, actor_email, action, entity, record_id, detail, created_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    newId(),
    email,
    'user.create',
    'User',
    id,
    null,
    timestamp,
  );

  return {
    id,
    email,
    full_name: String(data.full_name ?? ''),
    role: input.role ?? 'lecteur',
    data,
    created_date: timestamp,
    updated_date: timestamp,
  };
}

// --- Limitation de débit --------------------------------------------------

export async function rateLimit(db: DB, key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const row = await db.first<{ count: number; window_start: string }>(
    'SELECT count, window_start FROM rate_limits WHERE key = ?',
    key,
  );
  if (!row || now - new Date(row.window_start).getTime() > windowMs) {
    await db.run(
      'INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = 1, window_start = excluded.window_start',
      key,
      new Date(now).toISOString(),
    );
    return true;
  }
  if (row.count >= limit) return false;
  await db.run('UPDATE rate_limits SET count = count + 1 WHERE key = ?', key);
  return true;
}

export function clientIp(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ??
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
    'local'
  );
}

// --- Contrôles de requête -------------------------------------------------

export function sameOrigin(request: Request, env: Env): boolean {
  const origin = request.headers.get('Origin');
  if (!origin) {
    // Requêtes sans Origin (curl, cron) : accepté seulement hors navigateur authentifié.
    return request.headers.get('Sec-Fetch-Site') === null;
  }
  const requestUrl = new URL(request.url);
  const allowed = new Set<string>([requestUrl.origin]);
  if (env.APP_ORIGIN) allowed.add(env.APP_ORIGIN.replace(/\/$/, ''));
  return allowed.has(origin);
}

export function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

export function requireUser(user: SessionUser | null): SessionUser {
  if (!user) throw Object.assign(new Error('Connexion requise'), { status: 401 });
  return user;
}

export async function audit(
  db: DB,
  actor: string | null,
  action: string,
  entity: string | null,
  recordId: string | null,
  detail?: unknown,
): Promise<void> {
  await db.run(
    'INSERT INTO audit_log (id, actor_email, action, entity, record_id, detail, created_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    newId(),
    actor,
    action,
    entity,
    recordId,
    detail === undefined ? null : JSON.stringify(detail).slice(0, 2000),
    nowIso(),
  );
}
