// Client de l'API Bordero autonome.
// Il expose la même surface que le SDK d'origine (entities, auth, functions,
// integrations) pour que les pages n'aient pas à changer.

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(path, { method = 'GET', body, headers = {}, raw = false } = {}) {
  const init = {
    method,
    credentials: 'include',
    headers: { ...headers },
  };
  if (body !== undefined) {
    if (raw) {
      init.body = body;
    } else {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, init);
  } catch (error) {
    throw new ApiError('Serveur injoignable. Vérifiez votre connexion.', 0, null);
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message = (payload && payload.error) || `Erreur ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }
  return payload;
}

function normalizeListArgs(orderOrOptions, limit) {
  if (orderOrOptions && typeof orderOrOptions === 'object') {
    return { order: orderOrOptions.sort ?? orderOrOptions.order, limit: orderOrOptions.limit };
  }
  return { order: orderOrOptions, limit };
}

function entityApi(name) {
  return {
    list: async (orderOrOptions, limit) => {
      const { order, limit: max } = normalizeListArgs(orderOrOptions, limit);
      const params = new URLSearchParams();
      if (order) params.set('order', order);
      if (max) params.set('limit', String(max));
      const query = params.toString();
      return request(`/api/entities/${name}${query ? `?${query}` : ''}`);
    },
    filter: async (query = {}, orderOrOptions, limit) => {
      const { order, limit: max } = normalizeListArgs(orderOrOptions, limit);
      const params = new URLSearchParams({ query: JSON.stringify(query || {}) });
      if (order) params.set('order', order);
      if (max) params.set('limit', String(max));
      return request(`/api/entities/${name}?${params.toString()}`);
    },
    get: (id) => request(`/api/entities/${name}/${encodeURIComponent(id)}`),
    create: (data) => request(`/api/entities/${name}`, { method: 'POST', body: data }),
    bulkCreate: (items) => request(`/api/entities/${name}/bulk`, { method: 'POST', body: items }),
    update: (id, data) => request(`/api/entities/${name}/${encodeURIComponent(id)}`, { method: 'PATCH', body: data }),
    bulkUpdate: (items) =>
      request(`/api/entities/${name}/bulk-update`, {
        method: 'POST',
        body: (items || []).map((item) => {
          const { id, ...data } = item || {};
          return { id, data };
        }),
      }),
    delete: (id) => request(`/api/entities/${name}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    count: async (query = {}) => {
      const payload = await request(`/api/entities/${name}/count`, { method: 'POST', body: { query } });
      return payload ? payload.count : 0;
    },
    aggregate: (options = {}) => request(`/api/entities/${name}/aggregate`, { method: 'POST', body: options }),
    subscribe: (callback) => {
      let stopped = false;
      const tick = () => {
        if (stopped) return;
        Promise.resolve(callback()).catch(() => {});
      };
      const timer = setInterval(tick, 20000);
      return () => {
        stopped = true;
        clearInterval(timer);
      };
    },
  };
}

const entities = new Proxy(
  {},
  {
    get: (_target, name) => {
      if (typeof name !== 'string') return undefined;
      return entityApi(name);
    },
  },
);

async function currentUser() {
  const payload = await request('/api/auth/me');
  return payload.user;
}

function redirectToLogin(fromUrl) {
  const target = fromUrl || window.location.href;
  const url = new URL('/login', window.location.origin);
  if (target) url.searchParams.set('from_url', target);
  window.location.assign(url.toString());
}

export const localClient = {
  mode: 'local',

  entities,

  auth: {
    me: currentUser,
    updateMe: async (patch) => {
      const payload = await request('/api/auth/me', { method: 'PATCH', body: patch });
      return payload.user;
    },
    logout: async (redirectUrl) => {
      try {
        await request('/api/auth/logout', { method: 'POST' });
      } catch {
        /* déconnexion locale quand même */
      }
      if (redirectUrl) window.location.assign('/');
    },
    redirectToLogin,
    isAuthenticated: async () => {
      try {
        await currentUser();
        return true;
      } catch {
        return false;
      }
    },
    login: async (email, password) => {
      const payload = await request('/api/auth/login', { method: 'POST', body: { email, password } });
      return payload.user;
    },
    signup: async ({ email, password, full_name, role }) => {
      const payload = await request('/api/auth/signup', {
        method: 'POST',
        body: { email, password, full_name, role },
      });
      return payload.user;
    },
    forgotPassword: (email) => request('/api/auth/forgot', { method: 'POST', body: { email } }),
    resetPassword: async (token, password) => {
      const payload = await request('/api/auth/reset', { method: 'POST', body: { token, password } });
      return payload.user;
    },
    changePassword: (current, next) => request('/api/auth/password', { method: 'POST', body: { current, next } }),
  },

  functions: {
    invoke: async (name, payload) => {
      const data = await request(`/api/functions/${name}`, { method: 'POST', body: payload ?? {} });
      return { data, status: 200 };
    },
  },

  integrations: {
    Core: {
      UploadFile: ({ file }) => uploadFile(file, false),
      UploadPrivateFile: ({ file }) => uploadFile(file, true),
    },
  },

  users: {
    inviteUser: (email, role) => request('/api/admin/invite', { method: 'POST', body: { email, role } }),
  },
};

async function uploadFile(file, isPrivate) {
  const form = new FormData();
  form.append('file', file);
  return request(`/api/storage/upload${isPrivate ? '?private=1' : ''}`, {
    method: 'POST',
    body: form,
    raw: true,
  });
}
