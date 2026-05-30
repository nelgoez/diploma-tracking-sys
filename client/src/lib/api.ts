const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

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
    const res = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { throw new Error(`API error ${res.status}`); }
    return res.json() as Promise<T>;
  },

  async post<T>(path: string, body: unknown, token: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) { throw new Error(`API error ${res.status}`); }
    return res.json() as Promise<T>;
  },
};
