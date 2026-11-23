// Types partagés du backend autonome.

export interface D1Stmt {
  bind(...values: unknown[]): D1Stmt;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ success?: boolean }>;
}

export interface D1Like {
  prepare(sql: string): D1Stmt;
  exec?(sql: string): Promise<unknown>;
  batch?(stmts: D1Stmt[]): Promise<unknown>;
}

export interface Env {
  DB: D1Like;
  FILES?: {
    put(key: string, value: ArrayBuffer | ReadableStream | string, options?: Record<string, unknown>): Promise<unknown>;
    get(key: string): Promise<{ body: ReadableStream; httpMetadata?: { contentType?: string } } | null>;
    delete(key: string): Promise<unknown>;
  };
  ASSETS?: { fetch(request: Request): Promise<Response> };
  APP_ORIGIN?: string;
  CRON_SECRET?: string;
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  ALLOW_SIGNUP?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  full_name?: string;
  role: 'lecteur' | 'voyageur' | 'relais' | 'admin' | 'admin_secondaire' | string;
  data: Record<string, unknown>;
  created_date?: string;
  updated_date?: string;
}

export type FunctionHandler = (request: Request) => Promise<Response> | Response;
