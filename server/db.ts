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

export function db(env: Env): DB {
  return new DB(env.DB);
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
