const API_BASE = '/api';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  csrfToken?: string;
}

class AuthApi {
  private getCsrfTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/_csrf=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  async getCsrfToken(): Promise<string> {
    const res = await fetch(`${API_BASE}/auth/csrf`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to get CSRF token');
    const data = await res.json();
    return data.csrfToken;
  }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const csrfToken = await this.getCsrfToken();
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const csrfToken = await this.getCsrfToken();
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  }

  async logout(): Promise<void> {
    const csrfToken = this.getCsrfTokenFromCookie();
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      credentials: 'include'
    });
  }

  async me(): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  }
}

export const authApi = new AuthApi();
