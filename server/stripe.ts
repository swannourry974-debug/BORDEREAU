// Client Stripe minimal (REST) : remplace le SDK npm utilisé par les fonctions
// existantes, sans dépendance Node. Seules les opérations réellement appelées
// sont implémentées (création de session Checkout, liste, vérification webhook).
const API = 'https://api.stripe.com/v1';

function encode(value: unknown, prefix: string, out: URLSearchParams): void {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => encode(item, `${prefix}[${index}]`, out));
    return;
  }
  if (typeof value === 'object') {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      encode(item, prefix ? `${prefix}[${key}]` : key, out);
    }
    return;
  }
  out.append(prefix, String(value));
}

export default class Stripe {
  private secret: string;
  checkout: {
    sessions: {
      create: (params: Record<string, unknown>) => Promise<any>;
      list: (params: Record<string, unknown>) => Promise<any>;
      retrieve: (id: string) => Promise<any>;
    };
  };
  webhooks: { constructEventAsync: (payload: string, signature: string, secret: string) => Promise<any> };

  constructor(secret: string) {
    this.secret = secret;

    this.checkout = {
      sessions: {
        create: async (params) => this.request('POST', '/checkout/sessions', params),
        list: async (params) => this.request('GET', '/checkout/sessions', params),
        retrieve: async (id) => this.request('GET', `/checkout/sessions/${id}`, {}),
      },
    };

    this.webhooks = { constructEventAsync: (payload, signature, secret) => verify(payload, signature, secret) };
  }

  private async request(method: 'GET' | 'POST', path: string, params: Record<string, unknown>): Promise<any> {
    const search = new URLSearchParams();
    encode(params ?? {}, '', search);
    const url = method === 'GET' && search.toString() ? `${API}${path}?${search}` : `${API}${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.secret}`,
        ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
      ...(method === 'POST' ? { body: search.toString() } : {}),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = (payload as { error?: { message?: string } })?.error?.message ?? `Stripe ${response.status}`;
      throw Object.assign(new Error(message), { statusCode: response.status, raw: payload });
    }
    return payload;
  }
}

async function verify(payload: string, signature: string, secret: string): Promise<any> {
  const parts = Object.fromEntries(
    String(signature || '')
      .split(',')
      .map((chunk) => chunk.split('='))
      .filter((pair) => pair.length === 2),
  ) as Record<string, string>;
  const timestamp = parts.t;
  const provided = parts.v1;
  if (!timestamp || !provided) throw new Error('Signature Stripe incomplète');

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (expected.length !== provided.length) throw new Error('Signature Stripe invalide');
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  if (diff !== 0) throw new Error('Signature Stripe invalide');

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (Number.isFinite(age) && age > 300) throw new Error('Signature Stripe expirée');

  return JSON.parse(payload);
}
