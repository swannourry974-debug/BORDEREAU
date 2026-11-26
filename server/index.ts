// Point d'entrée du backend Bordero autonome (Worker compatible Cloudflare / Node).
import { setRuntimeEnv } from './runtime';
import { DB, db, ensureSchema, newId, nowIso } from './db';
import {
  audit,
  clearSessionCookie,
  clientIp,
  createSession,
  createUser,
  destroySession,
  destroyUserSessions,
  findUserByEmail,
  hashPassword,
  hashToken,
  isEmail,
  isLoopback,
  normalizeEmail,
  passwordProblem,
  publicUser,
  rateLimit,
  requireUser,
  rowToUser,
  sameOrigin,
  saveUserData,
  sessionCookie,
  userFromRequest,
  verifyPassword,
} from './auth';
import {
  aggregateEntity,
  bulkCreateEntity,
  bulkUpdateEntity,
  countEntity,
  createEntity,
  deleteEntity,
  getEntity,
  listEntity,
  updateEntity,
} from './entities';
import { filterSelfUserPatch, isAdmin } from './policies';
import { FUNCTIONS } from './generated/functions';
import { bindFunctionContext } from './sdk';
import { sendMail } from './mail';
import type { Env, SessionUser } from './types';

const MAX_BODY_BYTES = 2 * 1024 * 1024;

class Failure extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function securityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(self), camera=(self), microphone=()');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'no-store');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data ?? null), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

function fail(error: unknown): Response {
  const status = (error as { status?: number })?.status;
  const message = error instanceof Error ? error.message : 'Erreur serveur';
  if (status && status >= 400 && status < 500) return json({ error: message }, status);
  console.error('[bordero]', error);
  return json({ error: 'Erreur serveur. Réessayez dans un instant.' }, 500);
}

async function readJson(request: Request): Promise<any> {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) throw new Failure('Requête trop volumineuse', 413);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Failure('Corps de requête invalide', 400);
  }
}

function cookieFor(request: Request, token: string, expires: Date): string {
  return sessionCookie(token, expires, !isLoopback(request));
}

function startSession(db: DB, request: Request, user: SessionUser): Promise<Response> {
  return createSession(db, user.id, request.headers.get('User-Agent') ?? undefined).then(({ token, expires }) =>
    json(
      { user: publicUser(user) },
      200,
      { 'Set-Cookie': cookieFor(request, token, expires) },
    ),
  );
}

function paramInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function handleAuth(db: DB, env: Env, request: Request, path: string, method: string): Promise<Response | null> {
  const ip = clientIp(request);

  if (path === '/api/auth/signup' && method === 'POST') {
    if (env.ALLOW_SIGNUP === 'false') throw new Failure('Les inscriptions sont fermées.', 403);
    if (!(await rateLimit(db, `signup:${ip}`, 10, 3600_000))) throw new Failure('Trop de tentatives. Réessayez plus tard.', 429);
    const body = await readJson(request);
    const email = normalizeEmail(body.email);
    if (!isEmail(email)) throw new Failure('Adresse e-mail invalide.');
    const problem = passwordProblem(body.password);
    if (problem) throw new Failure(problem);
    const admins = String(env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((entry) => normalizeEmail(entry))
      .filter(Boolean);
    const requestedRole = ['lecteur', 'voyageur', 'relais'].includes(body.role) ? body.role : 'lecteur';
    const user = await createUser(db, {
      email,
      password: body.password,
      full_name: typeof body.full_name === 'string' ? body.full_name : '',
      role: admins.includes(email) ? 'admin' : requestedRole,
    });
    return startSession(db, request, user);
  }

  if (path === '/api/auth/login' && method === 'POST') {
    if (!(await rateLimit(db, `login:${ip}`, 20, 900_000))) {
      throw new Failure('Trop de tentatives de connexion. Réessayez dans quelques minutes.', 429);
    }
    const body = await readJson(request);
    const email = normalizeEmail(body.email);
    if (!(await rateLimit(db, `login-email:${email}`, 10, 900_000))) {
      throw new Failure('Trop de tentatives de connexion. Réessayez dans quelques minutes.', 429);
    }
    const row = await findUserByEmail(db, email);
    const ok = row ? await verifyPassword(String(body.password ?? ''), row.password_hash) : false;
    if (!row || !ok) throw new Failure('E-mail ou mot de passe incorrect.', 401);
    const user = rowToUser(row);
    await audit(db, user.email, 'auth.login', 'User', user.id);
    return startSession(db, request, user);
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    const token = request.headers.get('Cookie') ?? '';
    const raw = token.match(/bordero_session=([^;]+)/)?.[1] ?? null;
    await destroySession(db, raw);
    return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie(!isLoopback(request)) });
  }

  if (path === '/api/auth/me' && method === 'GET') {
    const user = await userFromRequest(db, request);
    if (!user) return json({ error: 'Connexion requise' }, 401);
    return json({ user: publicUser(user) });
  }

  if (path === '/api/auth/me' && (method === 'PATCH' || method === 'PUT')) {
    const user = requireUser(await userFromRequest(db, request));
    const body = await readJson(request);
    let allowed = body;
    if (!isAdmin(user)) {
      const filtered = filterSelfUserPatch(user, body);
      if (filtered.rejected.length) {
        throw new Failure(`Champs non modifiables : ${filtered.rejected.join(', ')}`, 403);
      }
      allowed = filtered.patch;
    }
    const updated = await saveUserData(db, user, allowed);
    return json({ user: publicUser(updated) });
  }

  if (path === '/api/auth/password' && method === 'POST') {
    const user = requireUser(await userFromRequest(db, request));
    const body = await readJson(request);
    const row = await findUserByEmail(db, user.email);
    if (!row || !(await verifyPassword(String(body.current ?? ''), row.password_hash))) {
      throw new Failure('Mot de passe actuel incorrect.', 401);
    }
    const problem = passwordProblem(body.next);
    if (problem) throw new Failure(problem);
    const hash = await hashPassword(String(body.next));
    await db.run('UPDATE users SET password_hash = ?, updated_date = ? WHERE id = ?', hash, nowIso(), user.id);
    await destroyUserSessions(db, user.id);
    const fresh = await createSession(db, user.id);
    return json({ ok: true }, 200, { 'Set-Cookie': cookieFor(request, fresh.token, fresh.expires) });
  }

  if (path === '/api/auth/forgot' && method === 'POST') {
    if (!(await rateLimit(db, `forgot:${ip}`, 10, 3600_000))) throw new Failure('Trop de demandes. Réessayez plus tard.', 429);
    const body = await readJson(request);
    const email = normalizeEmail(body.email);
    const row = await findUserByEmail(db, email);
    if (row) {
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const expires = new Date(Date.now() + 60 * 60 * 1000);
      await db.run(
        'INSERT INTO password_resets (token_hash, user_id, created_date, expires_date, used) VALUES (?, ?, ?, ?, 0)',
        await hashToken(token),
        row.id,
        nowIso(),
        expires.toISOString(),
      );
      const origin = env.APP_ORIGIN || new URL(request.url).origin;
      await sendMail(env, db, {
        to: email,
        subject: 'Réinitialiser votre mot de passe Bordero',
        body: `Vous avez demandé à réinitialiser votre mot de passe.\n\nOuvrez ce lien (valable 1 heure) :\n${origin}/login?reset=${token}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.`,
        from_name: 'Bordero',
      });
    }
    return json({ ok: true });
  }

  if (path === '/api/auth/reset' && method === 'POST') {
    const body = await readJson(request);
    const token = String(body.token ?? '');
    if (!token) throw new Failure('Lien invalide.');
    const problem = passwordProblem(body.password);
    if (problem) throw new Failure(problem);
    const tokenHash = await hashToken(token);
    const reset = await db.first<any>('SELECT * FROM password_resets WHERE token_hash = ?', tokenHash);
    if (!reset || reset.used || new Date(reset.expires_date).getTime() < Date.now()) {
      throw new Failure('Lien expiré ou déjà utilisé.', 400);
    }
    const row = await db.first<any>('SELECT * FROM users WHERE id = ?', reset.user_id);
    if (!row) throw new Failure('Lien invalide.', 400);
    const hash = await hashPassword(String(body.password));
    await db.run('UPDATE users SET password_hash = ?, updated_date = ? WHERE id = ?', hash, nowIso(), row.id);
    await db.run('UPDATE password_resets SET used = 1 WHERE token_hash = ?', tokenHash);
    await destroyUserSessions(db, row.id);
    const user = rowToUser(row);
    await audit(db, user.email, 'auth.reset', 'User', user.id);
    return startSession(db, request, user);
  }

  return null;
}

async function handleEntities(db: DB, request: Request, method: string, parts: string[]): Promise<Response | null> {
  // parts: ['entities', name, ...]
  const [, entity, ...rest] = parts;
  if (!entity) return null;
  const user = await userFromRequest(db, request);
  const ctx = { db, user, service: false };

  if (rest.length === 0) {
    if (method === 'GET') {
      const url = new URL(request.url);
      const queryRaw = url.searchParams.get('query');
      let query: unknown;
      if (queryRaw) {
        try {
          query = JSON.parse(queryRaw);
        } catch {
          throw new Failure('Filtre de requête invalide', 400);
        }
      }
      const records = await listEntity(ctx, entity, {
        query,
        order: url.searchParams.get('order') ?? undefined,
        limit: paramInt(url.searchParams.get('limit')),
      });
      return json(records);
    }
    if (method === 'POST') {
      requireUser(user);
      const body = await readJson(request);
      if (Array.isArray(body)) return json(await bulkCreateEntity(ctx, entity, body), 201);
      return json(await createEntity(ctx, entity, body), 201);
    }
    return null;
  }

  if (rest.length === 1 && rest[0] === 'count' && method === 'POST') {
    const body = await readJson(request);
    return json({ count: await countEntity(ctx, entity, body.query ?? body) });
  }
  if (rest.length === 1 && rest[0] === 'aggregate' && method === 'POST') {
    const body = await readJson(request);
    return json(await aggregateEntity(ctx, entity, { query: body.query, groupBy: body.groupBy }));
  }
  if (rest.length === 1 && rest[0] === 'bulk' && method === 'POST') {
    const body = await readJson(request);
    if (!Array.isArray(body)) throw new Failure('Liste attendue', 400);
    return json(await bulkCreateEntity(ctx, entity, body), 201);
  }
  if (rest.length === 1 && rest[0] === 'bulk-update' && method === 'POST') {
    requireUser(user);
    const body = await readJson(request);
    if (!Array.isArray(body)) throw new Failure('Liste attendue', 400);
    return json(await bulkUpdateEntity(ctx, entity, body));
  }

  const id = rest[0];
  if (method === 'GET') return json(await getEntity(ctx, entity, id));
  if (method === 'PATCH' || method === 'PUT') {
    requireUser(user);
    return json(await updateEntity(ctx, entity, id, await readJson(request)));
  }
  if (method === 'DELETE') {
    requireUser(user);
    return json(await deleteEntity(ctx, entity, id));
  }
  return null;
}

async function handleFiles(db: DB, env: Env, request: Request, parts: string[]): Promise<Response | null> {
  if (parts[0] !== 'files') return null;
  const key = parts.slice(1).join('/');
  if (!key) return null;
  if (key.startsWith('private/')) {
    const user = await userFromRequest(db, request);
    if (!user) return json({ error: 'Connexion requise' }, 401);
  }
  if (!env.FILES) return json({ error: 'Stockage non configuré' }, 501);
  const object = await env.FILES.get(key);
  if (!object) return json({ error: 'Fichier introuvable' }, 404);
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': key.startsWith('private/') ? 'private, no-store' : 'public, max-age=3600',
      'Content-Disposition': 'inline',
    },
  });
}

async function handle(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  const path = url.pathname;
  await ensureSchema(env);
  const database = db(env);

  if (!path.startsWith('/api/')) {
    if (!env.ASSETS) return json({ error: 'Non trouvé' }, 404);
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) return asset;
    return env.ASSETS.fetch(new Request(new URL('/index.html', url.origin), request));
  }

  if (method === 'OPTIONS') {
    return securityHeaders(
      new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': request.headers.get('Origin') ?? '',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }),
    );
  }

  if (method !== 'GET' && method !== 'HEAD' && !sameOrigin(request, env)) {
    return securityHeaders(json({ error: 'Origine non autorisée' }, 403));
  }

  const segments = path.replace(/^\/+/, '').split('/').slice(1); // retire « api »

  if (path === '/api/health') {
    return securityHeaders(json({ ok: true, service: 'bordero', time: nowIso() }));
  }

  // Télémétrie héritée du SDK : acceptée sans effet, pour ne pas polluer la console.
  if (segments[0] === 'app-logs') {
    return securityHeaders(new Response(null, { status: 204 }));
  }

  if (segments[0] === 'auth') {
    const response = await handleAuth(database, env, request, path, method);
    if (response) return securityHeaders(response);
  }

  if (segments[0] === 'entities' && segments.length >= 2) {
    const response = await handleEntities(database, request, method, segments);
    if (response) return securityHeaders(response);
  }

  if (segments[0] === 'files') {
    const response = await handleFiles(database, env, request, segments);
    if (response) return securityHeaders(response);
  }

  if (segments[0] === 'storage' && segments[1] === 'upload' && method === 'POST') {
    const user = requireUser(await userFromRequest(database, request));
    if (!env.FILES) throw new Failure('Stockage non configuré', 501);
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw new Failure('Fichier manquant', 400);
    if (file.size > 15 * 1024 * 1024) throw new Failure('Fichier trop volumineux (15 Mo max).', 413);
    const isPrivate = url.searchParams.get('private') === '1';
    const safeName = String(file.name || 'fichier').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const key = `${isPrivate ? 'private' : 'public'}/${newId()}-${safeName}`;
    await env.FILES.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
    });
    await audit(database, user.email, 'storage.upload', null, key);
    return securityHeaders(json({ file_url: `/api/files/${key}`, file_uri: `r2://${key}` }));
  }

  if (segments[0] === 'functions' && segments[1]) {
    if (method !== 'POST') throw new Failure('Méthode non autorisée', 405);
    const name = segments[1];
    const handler = FUNCTIONS[name];
    if (!handler) throw new Failure(`Fonction inconnue : ${name}`, 404);
    const user = await userFromRequest(database, request);
    bindFunctionContext(request, { db: database, env, user, request });
    const response = await handler(request);
    return securityHeaders(response);
  }

  if (segments[0] === 'admin' && segments[1] === 'invite' && method === 'POST') {
    const user = requireUser(await userFromRequest(database, request));
    if (user.role !== 'admin') throw new Failure('Réservé à l’administration', 403);
    const body = await readJson(request);
    const email = normalizeEmail(body.email);
    if (!isEmail(email)) throw new Failure('Adresse e-mail invalide.');
    const created = await createUser(database, { email, role: body.role === 'admin' ? 'admin' : 'lecteur' });
    await sendMail(env, database, {
      to: email,
      subject: 'Votre accès Bordero',
      body: `Un accès Bordero a été créé pour ${email}.\n\nPour définir votre mot de passe, ouvrez ${env.APP_ORIGIN || new URL(request.url).origin}/login puis « Mot de passe oublié ».`,
      from_name: 'Bordero',
    });
    await audit(database, user.email, 'user.invite', 'User', created.id);
    return securityHeaders(json({ id: created.id, email: created.email, role: created.role }, 201));
  }

  // Export CSV (admin) : /api/export/:entity
  if (segments[0] === 'export' && segments[1] && method === 'GET') {
    const user = requireUser(await userFromRequest(database, request));
    if (user.role !== 'admin') throw new Failure('Réservé à l’administration', 403);
    const entity = segments[1];
    const records = await listEntity({ db: database, user, service: true }, entity, { limit: 5000 });
    if (!records.length) return securityHeaders(new Response('', { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${entity}.csv"` } }));
    const keys = Object.keys(records[0]);
    const escape = (v) => {
      if (v === null || v === undefined) return '';
      const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [keys.map(escape).join(',')];
    for (const r of records) lines.push(keys.map((k) => escape(r[k])).join(','));
    const csv = lines.join('\n') + '\n';
    return securityHeaders(new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${entity}.csv"`,
      },
    }));
  }

  if (segments[0] === 'cron' && segments[1]) {
    if (method !== 'POST' && method !== 'GET') throw new Failure('Méthode non autorisée', 405);
    const secret = request.headers.get('X-Cron-Secret') ?? '';
    if (!env.CRON_SECRET || secret !== env.CRON_SECRET) throw new Failure('Non autorisé', 401);
    const handler = FUNCTIONS[segments[1]];
    if (!handler) throw new Failure('Fonction inconnue', 404);
    const internal = new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    bindFunctionContext(internal, { db: database, env, user: null, request: internal });
    return securityHeaders(await handler(internal));
  }

  return securityHeaders(json({ error: 'Non trouvé' }, 404));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    setRuntimeEnv(env as unknown as Record<string, unknown>);
    try {
      return await handle(request, env);
    } catch (error) {
      return securityHeaders(fail(error));
    }
  },
};
