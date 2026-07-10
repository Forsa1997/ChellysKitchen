/**
 * API Client for Chellys Kitchen
 * Based on the architecture plan with all endpoints for Auth, Recipes, Ratings, Categories, and Admin
 */

import { resolveApiBaseUrl } from './resolveApiBaseUrl';

// ============================================================================
// Types
// ============================================================================

// Domain Types (aligned with backend schema)
export type UserRole = 'GUEST' | 'MEMBER' | 'EDITOR' | 'ADMIN';
export type RecipeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type RecipeDifficulty = 'EINFACH' | 'MITTEL' | 'SCHWER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
}

export interface NutritionalValues {
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
}

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description?: string;
  img?: string;
  tag?: string;
  difficulty: RecipeDifficulty;
  servings: number;
  preparationTime: number; // in minutes
  cookingTime: number; // in minutes
  category: string;
  status: RecipeStatus;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  nutritionalValues?: NutritionalValues;
  createdBy: {
    id: string;
    name: string;
  };
  updatedBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  archivedAt?: string;
  averageRating?: number;
  totalRatings?: number;
  notes?: string;
  isFavorite?: boolean;
}

export interface Rating {
  id: string;
  userId: string;
  recipeId: string;
  stars: number; // 1-5
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface MeResponse {
  user: User;
}

// Recipe Types
export type RecipeSort = 'newest' | 'oldest' | 'rating' | 'title' | 'title_asc' | 'title_desc';

export interface RecipeListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  category?: string;
  difficulty?: RecipeDifficulty | 'all' | 'Einfach' | 'Mittel' | 'Schwer';
  status?: RecipeStatus;
  sort?: RecipeSort;
  maxTotalMinutes?: number | null;
  favorites?: boolean;
}

export interface RecipeListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  q: string;
  category: string;
  sort: string;
  difficulty: string;
  maxTotalMinutes: number | null;
}

export interface RecipeListResponse {
  data: Recipe[];
  meta: RecipeListMeta;
}

export interface RandomRecipeParams {
  q?: string;
  category?: string;
  difficulty?: RecipeDifficulty | 'all' | 'Einfach' | 'Mittel' | 'Schwer';
  maxTotalMinutes?: number | null;
  favorites?: boolean;
  exclude?: string;
}

export interface BackupImportResult {
  recipes: number;
  users: number;
  categories: number;
  uploads: number;
}

export interface CreateRecipeRequest {
  title: string;
  shortDescription: string;
  description?: string;
  img?: string;
  tag?: string;
  difficulty: RecipeDifficulty;
  servings: number;
  preparationTime: number;
  cookingTime: number;
  category: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  nutritionalValues?: NutritionalValues;
}

export interface UpdateRecipeRequest extends Partial<CreateRecipeRequest> {
  status?: RecipeStatus;
}

export interface PublishRecipeRequest {
  status: 'PUBLISHED';
}

export interface ArchiveRecipeRequest {
  status: 'ARCHIVED';
}

// Rating Types
export interface CreateRatingRequest {
  stars: number; // 1-5
}

export interface RatingResponse {
  rating: Rating;
  averageRating: number;
  totalRatings: number;
}

// Category Types
export interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  icon?: string;
}

// Admin Types
export interface UserListResponse {
  data: User[];
  total: number;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface AdminRecipeListResponse {
  data: Recipe[];
  total: number;
}

// Week Plan Types
export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface WeekPlanRecipeSummary {
  id: string;
  slug: string;
  title: string;
  img?: string;
  servings: number;
  category: string;
}

export interface WeekPlanEntry {
  recipeId: string;
  servings: number;
  recipe: WeekPlanRecipeSummary;
}

export interface WeekPlanResponse {
  days: Record<WeekDay, WeekPlanEntry[]>;
}

// Recipe Import Types
export interface ImportedRecipe {
  title: string;
  shortDescription: string;
  servings: number;
  preparationTime: number;
  cookingTime: number;
  img?: string;
  ingredients: Array<{ name: string; amount: number; unit: string }>;
  steps: Array<{ stepNumber: number; instruction: string }>;
}

export interface ImportRecipeResponse {
  recipe: ImportedRecipe;
  source: string;
}

// Error Types
export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string;
  details?: unknown;
}

// ============================================================================
// API Client Configuration
// ============================================================================

function inferApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:4000';
  }

  const { protocol, hostname } = window.location;
  return resolveApiBaseUrl({
    configuredUrl: import.meta.env.VITE_API_BASE_URL,
    protocol,
    hostname,
  });
}

const API_BASE_URL = inferApiBaseUrl();

/** Public backend base URL, e.g. for links that must bypass the SPA. */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenListeners: Set<() => void> = new Set();

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.loadTokens();
  }

  // ============================================================================
  // Token Management
  // ============================================================================

  private loadTokens(): void {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  private saveTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    this.notifyTokenChange();
  }

  public clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.notifyTokenChange();
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Subscribe to access-token changes (login/logout/refresh).
   * Returns an unsubscribe function. Lets consumers react without polling.
   */
  public onTokenChange(listener: () => void): () => void {
    this.tokenListeners.add(listener);
    return () => {
      this.tokenListeners.delete(listener);
    };
  }

  private notifyTokenChange(): void {
    this.tokenListeners.forEach((listener) => listener());
  }

  // ============================================================================
  // HTTP Methods
  // ============================================================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: headers as HeadersInit,
    });

    if (!response.ok) {
      // On 401, try to refresh the access token once and replay the request.
      const canRefresh =
        response.status === 401 &&
        !!this.refreshToken &&
        !isRetry &&
        endpoint !== '/api/auth/refresh';

      if (canRefresh) {
        try {
          await this.refreshAccessToken();
          return this.request<T>(endpoint, options, true);
        } catch {
          this.clearTokens();
          if (typeof window !== 'undefined') {
            // The app runs with a hash router in production (static host
            // without SPA rewrites), so the sign-in route lives behind '#'.
            const routerMode = import.meta.env.VITE_ROUTER_MODE ?? (import.meta.env.PROD ? 'hash' : 'browser');
            window.location.assign(routerMode === 'hash' ? '/#/signin' : '/signin');
          }
        }
      }

      const error = await this.handleError(response);
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  private async handleError(response: Response): Promise<ApiError> {
    let error: ApiError;

    try {
      const data = await response.json();
      error = {
        message: data.message || data.error || 'An error occurred',
        statusCode: response.status,
        code: data.code,
        details: data.details,
      };
    } catch {
      error = {
        message: response.statusText || 'An error occurred',
        statusCode: response.status,
      };
    }

    return error;
  }

  // ============================================================================
  // Auth Endpoints
  // ============================================================================

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.saveTokens(response.accessToken, response.refreshToken);
    return response;
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<AuthResponse> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.request<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });
    this.saveTokens(response.accessToken, response.refreshToken);
    return response;
  }

  /**
   * POST /api/auth/logout
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await this.request<void>('/api/auth/logout', {
        method: 'POST',
        // Send the refresh token along so the server can invalidate it too.
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
    } finally {
      this.clearTokens();
    }
  }

  /**
   * GET /api/auth/me
   * Get current user info
   */
  async getMe(): Promise<MeResponse> {
    return this.request<MeResponse>('/api/auth/me');
  }

  // ============================================================================
  // Recipe Endpoints
  // ============================================================================

  /**
   * GET /api/recipes
   * Get list of recipes with filtering and pagination
   */
  async getRecipes(params: RecipeListParams = {}): Promise<RecipeListResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.q) queryParams.append('q', params.q);
    if (params.category && params.category !== 'all') queryParams.append('category', params.category);
    if (params.difficulty && params.difficulty !== 'all') queryParams.append('difficulty', params.difficulty);
    if (params.status) queryParams.append('status', params.status);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.maxTotalMinutes !== null && params.maxTotalMinutes !== undefined) {
      queryParams.append('maxTotalMinutes', params.maxTotalMinutes.toString());
    }
    if (params.favorites) queryParams.append('favorites', 'true');

    const queryString = queryParams.toString();
    const endpoint = `/api/recipes${queryString ? `?${queryString}` : ''}`;

    return this.request<RecipeListResponse>(endpoint);
  }

  /**
   * GET /api/recipes/random
   * Get one random recipe from all recipes matching the filters.
   * `exclude` removes a slug (e.g. the currently shown recipe) from the pool.
   */
  async getRandomRecipe(params: RandomRecipeParams = {}): Promise<Recipe> {
    const queryParams = new URLSearchParams();

    if (params.q) queryParams.append('q', params.q);
    if (params.category && params.category !== 'all') queryParams.append('category', params.category);
    if (params.difficulty && params.difficulty !== 'all') queryParams.append('difficulty', params.difficulty);
    if (params.maxTotalMinutes) queryParams.append('maxTotalMinutes', params.maxTotalMinutes.toString());
    if (params.favorites) queryParams.append('favorites', 'true');
    if (params.exclude) queryParams.append('exclude', params.exclude);

    const queryString = queryParams.toString();
    return this.request<Recipe>(`/api/recipes/random${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * GET /api/recipes/:slug
   * Get a single recipe by slug
   */
  async getRecipeBySlug(slug: string): Promise<Recipe> {
    return this.request<Recipe>(`/api/recipes/${slug}`);
  }

  /**
   * GET /api/recipes/:id
   * Get a single recipe by id (for backward compatibility)
   */
  async getRecipeById(id: string): Promise<Recipe> {
    return this.request<Recipe>(`/api/recipes/${id}`);
  }

  /**
   * POST /api/recipes
   * Create a new recipe
   */
  async createRecipe(data: CreateRecipeRequest): Promise<Recipe> {
    return this.request<Recipe>('/api/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH /api/recipes/:id
   * Update an existing recipe
   */
  async updateRecipe(id: string, data: UpdateRecipeRequest): Promise<Recipe> {
    return this.request<Recipe>(`/api/recipes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE /api/recipes/:id
   * Delete a recipe
   */
  async deleteRecipe(id: string): Promise<void> {
    return this.request<void>(`/api/recipes/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * PATCH /api/recipes/:id/publish
   * Publish a recipe
   */
  async publishRecipe(id: string): Promise<Recipe> {
    return this.request<Recipe>(`/api/recipes/${id}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'PUBLISHED' }),
    });
  }

  /**
   * PATCH /api/recipes/:id/archive
   * Archive a recipe
   */
  async archiveRecipe(id: string): Promise<Recipe> {
    return this.request<Recipe>(`/api/recipes/${id}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ARCHIVED' }),
    });
  }

  /**
   * POST /api/recipes/:idOrSlug/duplicate
   * Copy a recipe as an own variant (new owner, fresh ratings/notes)
   */
  async duplicateRecipe(idOrSlug: string): Promise<Recipe> {
    return this.request<Recipe>(`/api/recipes/${encodeURIComponent(idOrSlug)}/duplicate`, {
      method: 'POST',
    });
  }

  /**
   * POST /api/recipes/import
   * Fetch an external recipe page server-side and map its schema.org data
   * onto our recipe shape (nothing is saved).
   */
  async importRecipe(url: string): Promise<ImportRecipeResponse> {
    return this.request<ImportRecipeResponse>('/api/recipes/import', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  /**
   * POST /api/recipes/import/photo
   * Extract a recipe from a photo (cookbook page, handwritten note) via the
   * server-side vision model (nothing is saved).
   */
  async importRecipeFromPhoto(file: File): Promise<ImportRecipeResponse> {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Das Foto konnte nicht gelesen werden.'));
      reader.readAsDataURL(file);
    });
    return this.request<ImportRecipeResponse>('/api/recipes/import/photo', {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, data }),
    });
  }

  // ============================================================================
  // Week Plan Endpoints
  // ============================================================================

  /** GET /api/weekplan - The shared family week plan */
  async getWeekPlan(): Promise<WeekPlanResponse> {
    return this.request<WeekPlanResponse>('/api/weekplan');
  }

  /** POST /api/weekplan/:day - Plan a recipe (upserts the servings) */
  async addToWeekPlan(day: WeekDay, data: { recipeId: string; servings?: number }): Promise<void> {
    await this.request(`/api/weekplan/${day}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /** DELETE /api/weekplan/:day/:recipeId - Remove one planned meal */
  async removeFromWeekPlan(day: WeekDay, recipeId: string): Promise<void> {
    await this.request(`/api/weekplan/${day}/${encodeURIComponent(recipeId)}`, { method: 'DELETE' });
  }

  /** DELETE /api/weekplan - Clear the whole week */
  async clearWeekPlan(): Promise<void> {
    await this.request('/api/weekplan', { method: 'DELETE' });
  }

  // ============================================================================
  // Favorite & Notes Endpoints
  // ============================================================================

  /**
   * PUT /api/recipes/:slug/favorite
   * Mark a recipe as a personal favorite
   */
  async setFavorite(slug: string): Promise<Recipe> {
    return this.request<Recipe>(`/api/recipes/${slug}/favorite`, { method: 'PUT' });
  }

  /**
   * DELETE /api/recipes/:slug/favorite
   * Remove a recipe from the personal favorites
   */
  async removeFavorite(slug: string): Promise<Recipe> {
    return this.request<Recipe>(`/api/recipes/${slug}/favorite`, { method: 'DELETE' });
  }

  /**
   * PATCH /api/recipes/:slug/notes
   * Update the shared family notes of a recipe
   */
  async updateRecipeNotes(slug: string, notes: string): Promise<Recipe> {
    return this.request<Recipe>(`/api/recipes/${slug}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
  }

  // ============================================================================
  // Rating Endpoints
  // ============================================================================

  /**
   * POST /api/recipes/:slug/rating
   * Create or update a rating for a recipe
   */
  async createRating(slug: string, data: CreateRatingRequest): Promise<RatingResponse> {
    return this.request<RatingResponse>(`/api/recipes/${slug}/rating`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * GET /api/recipes/:slug/rating
   * Get the current user's rating for a recipe
   */
  async getRating(slug: string): Promise<Rating> {
    return this.request<Rating>(`/api/recipes/${slug}/rating`);
  }

  /**
   * DELETE /api/recipes/:slug/rating
   * Delete the current user's rating for a recipe
   */
  async deleteRating(slug: string): Promise<void> {
    return this.request<void>(`/api/recipes/${slug}/rating`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // Category Endpoints
  // ============================================================================

  /**
   * GET /api/categories
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/api/categories');
  }

  /**
   * POST /api/categories
   * Create a new category (admin only)
   */
  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    return this.request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH /api/categories/:id
   * Update a category (admin only)
   */
  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
    return this.request<Category>(`/api/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE /api/categories/:id
   * Delete a category (admin only)
   */
  async deleteCategory(id: string): Promise<void> {
    return this.request<void>(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // Admin Endpoints
  // ============================================================================

  /**
   * GET /api/admin/users
   * Get all users (admin only)
   */
  async getUsers(): Promise<UserListResponse> {
    return this.request<UserListResponse>('/api/admin/users');
  }

  /**
   * POST /api/admin/users
   * Create a new user (admin only) — there is no public registration.
   */
  async createUser(data: CreateUserRequest): Promise<User> {
    return this.request<User>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH /api/admin/users/:id/role
   * Update user role (admin only)
   */
  async updateUserRole(id: string, data: UpdateUserRoleRequest): Promise<User> {
    return this.request<User>(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * GET /api/admin/recipes
   * Get all recipes including drafts (admin only)
   */
  async getAdminRecipes(): Promise<AdminRecipeListResponse> {
    return this.request<AdminRecipeListResponse>('/api/admin/recipes');
  }

  /**
   * GET /api/admin/export
   * Download a full backup (recipes, users, ratings, categories, images) as
   * a JSON document (admin only).
   */
  async exportBackup(): Promise<unknown> {
    return this.request<unknown>('/api/admin/export');
  }

  /**
   * POST /api/admin/import
   * Restore a previously exported backup (admin only).
   */
  async importBackup(payload: unknown): Promise<BackupImportResult> {
    return this.request<BackupImportResult>('/api/admin/import', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // ============================================================================
  // Upload Endpoint
  // ============================================================================

  /**
   * POST /api/uploads
   * Upload an image file. Reads the file as a base64 data URL and returns the
   * absolute URL of the stored image.
   */
  async uploadImage(file: File): Promise<{ url: string }> {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Bild konnte nicht gelesen werden.'));
      reader.readAsDataURL(file);
    });

    return this.request<{ url: string }>('/api/uploads', {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, data }),
    });
  }

  // ============================================================================
  // Health Endpoint
  // ============================================================================

  /**
   * GET /health
   * Check API health status
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; database: string; version?: string }> {
    return this.request<{ status: string; timestamp: string; database: string; version?: string }>('/health');
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const apiClient = new ApiClient(API_BASE_URL);
