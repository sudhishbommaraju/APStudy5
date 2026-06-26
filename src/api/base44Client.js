// Drop-in replacement for the base44 hosted SDK.
//
// Every file in this app imports `{ base44 }` from here. By reimplementing the
// same surface against our own standalone backend (see /server), the entire
// existing app runs with no base44 cloud dependency.
//
// Surface implemented:
//   base44.auth.{ me, updateMe, isAuthenticated, login, logout, redirectToLogin }
//   base44.entities.<Name>.{ list, filter, create, update, delete, bulkCreate, read, get }
//   base44.integrations.Core.{ InvokeLLM, UploadFile, ExtractDataFromUploadedFile,
//                              GenerateImage, SendEmail }
//   base44.functions.<name>(payload)

const API = '/api';
const TOKEN_KEY = 'proofly_token';

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
function setToken(t) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

async function jsonFetch(url, options = {}) {
  const token = getToken();
  const resp = await fetch(url, {
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!resp.ok) {
    let message = `Request failed (${resp.status})`;
    try {
      const body = await resp.json();
      if (body && body.error) message = body.error;
    } catch {
      /* keep default */
    }
    const err = new Error(message);
    err.status = resp.status;
    throw err;
  }
  return resp.json();
}

// ---------------- Auth ----------------
const auth = {
  async me() {
    return jsonFetch(`${API}/auth/me`);
  },
  async updateMe(data) {
    return jsonFetch(`${API}/auth/update`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },
  async isAuthenticated() {
    return !!getToken();
  },
  // Create a real persisted account, store the session token, return the user.
  async register(name, email, password) {
    const data = await jsonFetch(`${API}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setToken(data.token);
    return data.user;
  },
  async login(email, password) {
    const data = await jsonFetch(`${API}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data.user;
  },
  // Exchange a Google ID-token credential for a Proofly session.
  async googleSignIn(credential) {
    const data = await jsonFetch(`${API}/auth/google`, {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
    setToken(data.token);
    return data.user;
  },
  async listUsers() {
    return jsonFetch(`${API}/auth/users`);
  },
  async logout(redirectUrl) {
    try {
      await jsonFetch(`${API}/auth/logout`, { method: 'POST', body: '{}' });
    } catch {
      /* ignore */
    }
    setToken(null);
    if (redirectUrl && typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return true;
  },
  redirectToLogin() {
    if (typeof window !== 'undefined') window.location.href = '/signin';
  },
};

// ---------------- Entities ----------------
function makeEntity(name) {
  const base = `${API}/entities/${name}`;
  return {
    async list(sort, limit) {
      const params = new URLSearchParams();
      if (sort) params.set('_sort', sort);
      if (limit) params.set('_limit', String(limit));
      const qs = params.toString();
      return jsonFetch(`${base}${qs ? `?${qs}` : ''}`);
    },
    async filter(query = {}, sort, limit) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query || {})) {
        if (v === undefined || v === null) continue;
        params.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
      }
      if (sort) params.set('_sort', sort);
      if (limit) params.set('_limit', String(limit));
      const qs = params.toString();
      return jsonFetch(`${base}${qs ? `?${qs}` : ''}`);
    },
    async create(data) {
      return jsonFetch(base, { method: 'POST', body: JSON.stringify(data || {}) });
    },
    async bulkCreate(items) {
      return jsonFetch(`${base}/bulk`, {
        method: 'POST',
        body: JSON.stringify(items || []),
      });
    },
    async update(id, data) {
      return jsonFetch(`${base}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data || {}),
      });
    },
    async delete(id) {
      return jsonFetch(`${base}/${id}`, { method: 'DELETE' });
    },
    async read(id) {
      return jsonFetch(`${base}/${id}`);
    },
    async get(id) {
      return jsonFetch(`${base}/${id}`);
    },
  };
}

const entities = new Proxy(
  {},
  {
    get(target, prop) {
      if (typeof prop !== 'string') return undefined;
      if (!target[prop]) target[prop] = makeEntity(prop);
      return target[prop];
    },
  }
);

// ---------------- Integrations ----------------
const Core = {
  async InvokeLLM(args = {}) {
    const data = await jsonFetch(`${API}/llm/invoke`, {
      method: 'POST',
      body: JSON.stringify(args),
    });
    if (data && data.ok === false) throw new Error(data.error || 'LLM error');
    // base44 returns the result value directly (string or object).
    return data.result;
  },
  async UploadFile({ file }) {
    const form = new FormData();
    form.append('file', file);
    const resp = await fetch(`${API}/files/upload`, { method: 'POST', body: form });
    if (!resp.ok) throw new Error(`Upload failed ${resp.status}`);
    return resp.json(); // { file_url, name }
  },
  async ExtractDataFromUploadedFile({ file_url }) {
    return jsonFetch(`${API}/files/extract`, {
      method: 'POST',
      body: JSON.stringify({ file_url }),
    });
  },
  async GenerateImage() {
    return { url: '' }; // not supported in standalone build
  },
  async SendEmail() {
    return { ok: true }; // no-op in standalone build
  },
};

const integrations = { Core };

// Convenience helper used by some study flows (not part of base44).
export async function fetchYoutubeTranscript(url) {
  return jsonFetch(`${API}/youtube/transcript`, {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

// ---------------- App activity logging (no-op in standalone) ----------------
const appLogs = {
  async logUserInApp() {
    return {};
  },
};

// ---------------- Agents (study assistant chat) ----------------
// Minimal client-side conversation stub. Messages are answered via the LLM
// proxy; subscribers receive the assistant reply through the returned channel.
const agents = {
  async createConversation() {
    return { id: `conv_${Date.now().toString(36)}`, messages: [] };
  },
  async addMessage({ content } = {}) {
    const reply = await Core.InvokeLLM({ prompt: content || '' });
    return { role: 'assistant', content: typeof reply === 'string' ? reply : JSON.stringify(reply) };
  },
  subscribeToConversation() {
    return () => {}; // returns an unsubscribe function
  },
};

// ---------------- Functions ----------------
const functions = new Proxy(
  {},
  {
    get(target, prop) {
      if (typeof prop !== 'string') return undefined;
      return async (payload) =>
        jsonFetch(`${API}/functions/${prop}`, {
          method: 'POST',
          body: JSON.stringify(payload || {}),
        }).catch(() => ({ data: {} }));
    },
  }
);

export const base44 = { auth, entities, integrations, functions, appLogs, agents };
export default base44;
