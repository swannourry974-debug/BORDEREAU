// Alias de build pour `base44:runtime` : secrets et tâches d'arrière-plan.
const g = globalThis as any;

export const secrets = {
  get(name: string): string | undefined {
    const env = g.__BORDERO_ENV__ || {};
    const value = env[name];
    return value === undefined || value === null ? undefined : String(value);
  },
  has(name: string): boolean {
    return !!(g.__BORDERO_ENV__ && g.__BORDERO_ENV__[name]);
  },
};

/** Équivalent de waitUntil : la réponse n'attend pas la tâche. */
export function waitUntil(task: Promise<unknown> | unknown): void {
  Promise.resolve(task).catch((error) => console.error('[waitUntil]', error));
}
