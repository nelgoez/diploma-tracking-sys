const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const DEFAULT_TIMEOUT = 30000;
const SYNC_TIMEOUT = 60000;

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
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `API error ${res.status}` }));
      throw new Error(err.error || `API error ${res.status}`);
    }
    return res.json() as Promise<T>;
  },
};
