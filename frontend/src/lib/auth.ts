/**
 * lib/auth.ts — Client-side auth helpers (JWT in localStorage)
 */

export interface User {
  id: number;
  name: string;
  email: string;
  city: string;
  initials?: string;
  created_at?: string;
  total_scans?: number;
  diseases_found?: number;
  healthy?: number;
}

const TOKEN_KEY = "ys_token";
const USER_KEY  = "ys_user_v2";

export function saveAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Also clear old v1 key
  localStorage.removeItem("ys_user");
}

export function isAuthenticated(): boolean {
  return !!getToken() && !!getUser();
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
