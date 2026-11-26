// Shim du runtime d'origine : les fonctions serveur existantes utilisent
// Deno.env.get(...) et quelques-unes s'enregistrent via Deno.serve(...).
// On leur fournit cet objet sans modifier leur code.
const g = globalThis as any;

g.__denoServeHandlers = g.__denoServeHandlers ?? [];

if (!g.Deno) g.Deno = {};
if (!g.Deno.env) {
  g.Deno.env = {
    get: (key: string) => (g.__BORDERO_ENV__ ? g.__BORDERO_ENV__[key] : undefined),
    set: () => undefined,
    has: (key: string) => !!(g.__BORDERO_ENV__ && g.__BORDERO_ENV__[key]),
  };
}
if (!g.Deno.serve) {
  g.Deno.serve = (handler: unknown) => {
    g.__denoServeHandlers.push(handler);
    return { finished: Promise.resolve() };
  };
}
if (!g.Deno.args) g.Deno.args = [];

export function setRuntimeEnv(env: Record<string, unknown>): void {
  g.__BORDERO_ENV__ = env;
}
