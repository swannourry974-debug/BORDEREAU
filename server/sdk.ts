// Adaptateur du SDK d'origine : les 44 fonctions serveur existantes continuent
// de tourner sans réécriture, mais sur notre base et nos règles de sécurité.
import { DB, newId } from './db';
import {
  aggregateEntity,
  bulkCreateEntity,
  countEntity,
  createEntity,
  deleteEntity,
  getEntity,
  listEntity,
  updateEntity,
} from './entities';
import { publicUser, saveUserData } from './auth';
import { filterSelfUserPatch, isAdmin } from './policies';
import { sendMail } from './mail';
import { FUNCTIONS } from './generated/functions';
import type { Env, SessionUser } from './types';

export interface FunctionContext {
  db: DB;
  env: Env;
  user: SessionUser | null;
  request?: Request;
}

const contexts = new WeakMap<Request, FunctionContext>();

export function bindFunctionContext(request: Request, context: FunctionContext): void {
  contexts.set(request, context);
}

function httpError(message: string, status: number): Error {
  return Object.assign(new Error(message), { status });
}

function contextFor(request: Request): FunctionContext {
  const context = contexts.get(request);
  if (!context) throw new Error("Contexte de fonction manquant (createClientFromRequest hors du routeur Bordero).");
  return context;
}

type EntityApi = Record<string, (...args: any[]) => Promise<any>>;

function normalizeListArgs(order?: unknown, limit?: unknown): { order?: string; limit?: number } {
  if (order && typeof order === 'object') {
    const options = order as { sort?: string; order?: string; limit?: number };
    return { order: options.sort ?? options.order, limit: options.limit ?? (Number(limit) || undefined) };
  }
  return { order: typeof order === 'string' ? order : undefined, limit: Number(limit) || undefined };
}

function entityApi(context: FunctionContext, service: boolean): EntityApi {
  const ec = { db: context.db, user: context.user, service };
  return new Proxy(
    {},
    {
      get(_target, entityName) {
        if (typeof entityName !== 'string') return undefined;
        return {
          list: async (order?: unknown, limit?: unknown) => {
            const options = normalizeListArgs(order, limit);
            return listEntity(ec, entityName, { order: options.order, limit: options.limit });
          },
          filter: async (query?: unknown, orderOrLimit?: unknown, limit?: unknown) => {
            const options = normalizeListArgs(orderOrLimit, limit);
            return listEntity(ec, entityName, { query, order: options.order, limit: options.limit });
          },
          get: async (id: string) => getEntity(ec, entityName, id),
          create: async (data: Record<string, unknown>) => createEntity(ec, entityName, data),
          bulkCreate: async (items: Array<Record<string, unknown>>) => bulkCreateEntity(ec, entityName, items),
          update: async (id: string, data: Record<string, unknown>) => updateEntity(ec, entityName, id, data),
          bulkUpdate: async (items: Array<Record<string, unknown>>) => {
            const updates = (items || []).map((item) => {
              const { id, ...data } = item || {};
              return { id: String(id), data: data as Record<string, unknown> };
            });
            const out = [];
            for (const update of updates) out.push(await updateEntity(ec, entityName, update.id, update.data));
            return out;
          },
          delete: async (id: string) => deleteEntity(ec, entityName, id),
          count: async (query?: unknown) => countEntity(ec, entityName, query),
          aggregate: async (options: { query?: unknown; groupBy?: string } = {}) =>
            aggregateEntity(ec, entityName, options),
        } satisfies EntityApi;
      },
    },
  );
}

async function invokeFunction(context: FunctionContext, name: string, payload: unknown): Promise<unknown> {
  const handler = FUNCTIONS[name];
  if (!handler) throw httpError(`Fonction inconnue : ${name}`, 404);
  const request = new Request(`https://internal/functions/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Bordero-Service-Role': '1' },
    body: JSON.stringify(payload ?? {}),
  });
  bindFunctionContext(request, context);
  const response = await handler(request);
  return response.json().catch(() => null);
}

export function createClientFromRequest(request: Request) {
  const context = contextFor(request);

  const client = {
    auth: {
      me: async () => {
        if (!context.user) throw httpError('Non authentifié', 401);
        return publicUser(context.user);
      },
      updateMe: async (patch: Record<string, unknown>) => {
        if (!context.user) throw httpError('Non authentifié', 401);
        let allowed = patch;
        if (!isAdmin(context.user)) {
          const filtered = filterSelfUserPatch(context.user, patch ?? {});
          allowed = filtered.patch;
        }
        const updated = await saveUserData(context.db, context.user, allowed);
        context.user = updated;
        return publicUser(updated);
      },
      logout: async () => ({ ok: true }),
    },
    entities: entityApi(context, false),
    asServiceRole: {
      entities: entityApi({ ...context, user: null }, true),
      auth: {
        me: async () => {
          if (!context.user) throw httpError('Non authentifié', 401);
          return publicUser(context.user);
        },
        updateMe: async (patch: Record<string, unknown>) => {
          if (!context.user) throw httpError('Non authentifié', 401);
          const updated = await saveUserData(context.db, context.user, patch ?? {});
          context.user = updated;
          return publicUser(updated);
        },
      },
      integrations: {
        Core: {
          SendEmail: async (input: { to: string; subject?: string; body?: string; from_name?: string }) =>
            sendMail(context.env, context.db, {
              to: input.to,
              subject: input.subject ?? '',
              body: input.body ?? '',
              from_name: input.from_name,
            }),
        },
      },
      functions: {
        invoke: async (name: string, payload: unknown) => invokeFunction({ ...context, user: null }, name, payload),
      },
      connectors: {
        getConnection: async () => {
          throw httpError('Connecteur Google Analytics non configuré sur ce serveur.', 501);
        },
      },
    },
    integrations: {
      Core: {
        SendEmail: async (input: { to: string; subject?: string; body?: string; from_name?: string }) =>
          sendMail(context.env, context.db, {
            to: input.to,
            subject: input.subject ?? '',
            body: input.body ?? '',
            from_name: input.from_name,
          }),
        UploadFile: async ({ file }: { file: File }) => uploadInput(context, file, false),
        UploadPrivateFile: async ({ file }: { file: File }) => uploadInput(context, file, true),
      },
    },
    users: {
      inviteUser: async (email: string, role?: string) => inviteUser(context, email, role),
    },
    connectors: {
      getConnection: async () => {
        throw httpError('Connecteur Google Analytics non configuré sur ce serveur.', 501);
      },
    },
    functions: {
      invoke: async (name: string, payload: unknown) => invokeFunction(context, name, payload),
    },
  };

  return client;
}

async function uploadInput(context: FunctionContext, file: File, isPrivate: boolean) {
  if (!file) throw httpError('Fichier manquant', 400);
  if (!context.env.FILES) throw httpError('Stockage non configuré sur ce serveur.', 501);
  const safeName = String(file.name || 'fichier').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  const key = `${isPrivate ? 'private' : 'public'}/${newId()}-${safeName}`;
  await context.env.FILES.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
  });
  return {
    file_url: `/api/files/${key}`,
    file_uri: `r2://${key}`,
  };
}

async function inviteUser(context: FunctionContext, email: string, role?: string) {
  const { createUser, isEmail, normalizeEmail } = await import('./auth');
  const address = normalizeEmail(email);
  if (!isEmail(address)) throw httpError('Adresse e-mail invalide', 400);
  const user = await createUser(context.db, {
    email: address,
    role: role === 'admin' ? 'admin' : 'lecteur',
  });
  await sendMail(context.env, context.db, {
    to: address,
    subject: 'Votre accès Bordero',
    body: `Un accès Bordero vient d'être créé pour ${address}.\n\nPour définir votre mot de passe, ouvrez ${context.env.APP_ORIGIN || 'https://thebordero.com'}/login et cliquez sur « Mot de passe oublié ».`,
    from_name: 'Bordero',
  });
  return { id: user.id, email: user.email, role: user.role };
}

export { httpError };
