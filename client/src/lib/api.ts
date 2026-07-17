const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const DEFAULT_TIMEOUT = 30000;
const SYNC_TIMEOUT = 60000;
const SESSION_EXPIRY = 'dts:session-expired';

export function onSessionExpired(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener(SESSION_EXPIRY, handler);
  return () => window.removeEventListener(SESSION_EXPIRY, handler);
}

function notifySessionExpired() {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRY));
}

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) { return null; }

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`,
      },
    });

    if (!res.ok) { return null; }

    const body = await res.json() as { access_token: string, refresh_token: string };
    localStorage.setItem('token', body.access_token);
    if (body.refresh_token) {
      localStorage.setItem('refreshToken', body.refresh_token);
    }
    return body.access_token;
  }
  catch {
    return null;
  }
}

function isTokenExpired(): boolean {
  try {
    const token = localStorage.getItem('token');
    if (!token) { return true; }
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
    if (!payload.exp) { return false; }
    return Date.now() >= payload.exp * 1000;
  }
  catch {
    return true;
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = DEFAULT_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  }
  finally {
    clearTimeout(timer);
  }
}

async function handle401(): Promise<string | null> {
  if (isTokenExpired()) {
    const newToken = await tryRefreshToken();
    if (newToken) { return newToken; }
    notifySessionExpired();
    return null;
  }
  notifySessionExpired();
  return null;
}

interface LoginResponse {
  access_token: string
  refresh_token: string
  user: {
    id: string
    email: string
    role: string
    name: string
  }
}

export const api = {
  async postPublic<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `API error ${res.status}`);
    }
    return res.json() as Promise<T>;
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json() as { error?: string };
      throw new Error(err.error || 'Invalid credentials');
    }

    return res.json() as Promise<LoginResponse>;
  },

  async get<T>(path: string, token: string): Promise<T> {
    const res = await fetchWithTimeout(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      const newToken = await handle401();
      if (newToken) {
        return api.get<T>(path, newToken);
      }
      throw new Error('Session expired');
    }

    if (!res.ok) { throw new Error(`API error ${res.status}`); }
    return res.json() as Promise<T>;
  },

  async post<T>(path: string, body: unknown, token: string): Promise<T> {
    const isSync = path.includes('/sync/');
    const res = await fetchWithTimeout(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }, isSync ? SYNC_TIMEOUT : DEFAULT_TIMEOUT);

    if (res.status === 401) {
      const newToken = await handle401();
      if (newToken) {
        return api.post<T>(path, body, newToken);
      }
      throw new Error('Session expired');
    }

    if (!res.ok) { throw new Error(`API error ${res.status}`); }
    return res.json() as Promise<T>;
  },

  async put<T>(path: string, body: unknown, token: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401) {
      const newToken = await handle401();
      if (newToken) {
        return api.put<T>(path, body, newToken);
      }
      throw new Error('Session expired');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `API error ${res.status}` }));
      throw new Error(err.error || `API error ${res.status}`);
    }
    return res.json() as Promise<T>;
  },
};
