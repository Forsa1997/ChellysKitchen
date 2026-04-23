import type { Recipe, User } from '../types/domain';

export type RecipeSort = 'newest' | 'oldest' | 'title_asc' | 'title_desc';
export type RecipeDifficulty = 'all' | 'Einfach' | 'Mittel' | 'Schwer';

export interface RecipeListParams {
  q?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  sort?: RecipeSort;
  difficulty?: RecipeDifficulty;
  maxTotalMinutes?: number | null;
}

export interface RecipeListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  q: string;
  category: string;
  sort: RecipeSort;
  difficulty: RecipeDifficulty;
  maxTotalMinutes: number | null;
}

function inferApiBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:4000';
  }

  const configuredUrl = import.meta.env.VITE_API_BASE_URL;
  if (configuredUrl) {
    return configuredUrl;
  }

  const { protocol, hostname } = window.location;

  if (hostname.endsWith('onrender.com') && hostname.includes('-web')) {
    return `${protocol}//${hostname.replace('-web', '-api')}`;
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:4000';
  }

  return window.location.origin;
}

const API_BASE_URL = inferApiBaseUrl();

interface ApiResponse<T> {
  data: T;
}

interface RecipeListResponse extends ApiResponse<Recipe[]> {
  meta: RecipeListMeta;
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

interface CreateRecipePayload {
  title: string;
  shortDescription: string;
  category: string;
  tag?: string;
  difficulty?: string;
  servings?: number;
  preparationTime?: number;
  cookingTime?: number;
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

export async function fetchRecipes(params: RecipeListParams = {}): Promise<{ data: Recipe[]; meta: RecipeListMeta }> {
  const queryParams = new URLSearchParams();

  if (params.q) queryParams.set('q', params.q);
  if (params.category) queryParams.set('category', params.category);
  if (params.page) queryParams.set('page', String(params.page));
  if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
  if (params.sort) queryParams.set('sort', params.sort);
  if (params.difficulty && params.difficulty !== 'all') queryParams.set('difficulty', params.difficulty);
  if (params.maxTotalMinutes) queryParams.set('maxTotalMinutes', String(params.maxTotalMinutes));

  const suffix = queryParams.toString();
  const result = await request<RecipeListResponse>(`/api/recipes${suffix ? `?${suffix}` : ''}`);
  return { data: result.data, meta: result.meta };
}

export async function fetchRecipeById(id: string): Promise<Recipe> {
  const result = await request<ApiResponse<Recipe>>(`/api/recipes/${id}`);
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

export async function createRecipe(payload: CreateRecipePayload, token: string): Promise<Recipe> {
  const result = await request<ApiResponse<Recipe>>('/api/recipes', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return result.data;
}
