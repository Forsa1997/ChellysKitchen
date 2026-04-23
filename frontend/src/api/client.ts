import type { Recipe, User } from '../types/domain';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

interface ApiResponse<T> {
  data: T;
}

interface AuthPayload {
  token: string;
  user: User;
}

interface Credentials {
  email: string;
  password: string;
}

interface RegisterPayload extends Credentials {
  name: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }));
    throw new Error(errorBody.error ?? 'Anfrage fehlgeschlagen');
  }

  return response.json() as Promise<T>;
}

export async function fetchRecipes(): Promise<Recipe[]> {
  const result = await request<ApiResponse<Recipe[]>>('/api/recipes');
  return result.data;
}

export function register(payload: RegisterPayload): Promise<AuthPayload> {
  return request<AuthPayload>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function login(payload: Credentials): Promise<AuthPayload> {
  return request<AuthPayload>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function me(token: string): Promise<{ user: User }> {
  return request<{ user: User }>('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
