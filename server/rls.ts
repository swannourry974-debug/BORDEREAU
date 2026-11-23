// Moteur de règles de ligne (RLS).
// Les règles sont celles écrites dans base44/entities/*.jsonc, réutilisées telles quelles :
//   - "read": null / {}  -> aucune restriction
//   - règle absente      -> refusé (sauf politique explicite dans policies.ts)
//   - {{user.x}}         -> valeur de l'utilisateur appelant
//   - data.x             -> champ du document (stocké à plat)
import type { SessionUser } from './types';

export type Rule = unknown;

const OPERATORS = new Set(['$in', '$nin', '$ne', '$exists', '$gt', '$gte', '$lt', '$lte', '$regex']);

function getPath(source: Record<string, unknown> | undefined, path: string): unknown {
  if (!source) return undefined;
  const clean = path.startsWith('data.') ? path.slice(5) : path;
  return clean.split('.').reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, source);
}

function resolve(value: unknown, user: SessionUser | null): unknown {
  if (typeof value === 'string') {
    const match = value.match(/^\{\{\s*user\.([a-zA-Z0-9_.]+)\s*\}\}$/);
    if (match) {
      const path = match[1];
      if (path === 'id') return user?.id;
      if (path === 'email') return user?.email;
      if (path === 'role') return user?.role;
      if (path === 'full_name') return user?.full_name;
      if (path.startsWith('data.')) return getPath({ data: user?.data ?? {} }, path);
      return getPath({ data: user?.data ?? {} }, path);
    }
  }
  return value;
}

function compare(actual: unknown, expected: unknown): boolean {
  if (expected !== null && typeof expected === 'object' && !Array.isArray(expected)) {
    const ops = Object.keys(expected as Record<string, unknown>);
    if (ops.some((op) => OPERATORS.has(op))) {
      return ops.every((op) => {
        const value = (expected as Record<string, unknown>)[op];
        switch (op) {
          case '$in':
            return Array.isArray(value) && value.some((v) => v === actual);
          case '$nin':
            return Array.isArray(value) && !value.some((v) => v === actual);
          case '$ne':
            return actual !== value;
          case '$exists':
            return value ? actual !== undefined : actual === undefined;
          case '$gt':
            return Number(actual) > Number(value);
          case '$gte':
            return Number(actual) >= Number(value);
          case '$lt':
            return Number(actual) < Number(value);
          case '$lte':
            return Number(actual) <= Number(value);
          case '$regex':
            try {
              return new RegExp(String(value)).test(String(actual ?? ''));
            } catch {
              return false;
            }
          default:
            return false;
        }
      });
    }
  }
  if (Array.isArray(expected)) {
    return Array.isArray(actual) && expected.every((v) => actual.includes(v));
  }
  return actual === expected;
}

/** Évalue une règle RLS sur un document. */
export function matches(rule: Rule, record: Record<string, unknown>, user: SessionUser | null): boolean {
  if (rule === null || rule === undefined) return false;
  if (typeof rule !== 'object') return false;
  const obj = rule as Record<string, unknown>;

  if (Array.isArray(obj.$or)) {
    return obj.$or.some((sub) => matches(sub, record, user));
  }
  if (Array.isArray(obj.$and)) {
    return obj.$and.every((sub) => matches(sub, record, user));
  }
  if (obj.user_condition) {
    const condition = obj.user_condition as Record<string, unknown>;
    return Object.entries(condition).every(([key, value]) => {
      if (key === 'role') {
        const roles = Array.isArray(value) ? value : [value];
        return roles.includes(user?.role);
      }
      if (key === 'email') return user?.email === value;
      if (key === 'id') return user?.id === value;
      return compare(getPath({ data: user?.data ?? {} }, key), value);
    });
  }

  const fields = Object.entries(obj).filter(([key]) => !key.startsWith('$'));
  return fields.every(([key, expected]) => compare(getPath(record, key), resolve(expected, user)));
}

/** Règle de lecture : "null" ou "{}" signifient « aucune restriction ». */
export function isOpenRule(rule: Rule): boolean {
  if (rule === null) return true;
  if (typeof rule !== 'object' || rule === undefined) return false;
  return Object.keys(rule as Record<string, unknown>).length === 0;
}

export function canRead(rule: Rule, record: Record<string, unknown>, user: SessionUser | null): boolean {
  if (isOpenRule(rule)) return true;
  return matches(rule, record, user);
}

/** Évalue un filtre de requête (list/filter) sur un document. */
export function matchQuery(query: unknown, record: Record<string, unknown>): boolean {
  if (!query || typeof query !== 'object') return true;
  const obj = query as Record<string, unknown>;

  if (Array.isArray(obj.$or)) return obj.$or.some((sub) => matchQuery(sub, record));
  if (Array.isArray(obj.$and)) return obj.$and.every((sub) => matchQuery(sub, record));
  if (obj.$not) return !matchQuery(obj.$not, record);

  return Object.entries(obj).every(([key, expected]) => {
    if (key.startsWith('$')) return true;
    return compare(getPath(record, key), expected);
  });
}
