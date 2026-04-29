/**
 * API Client for Chellys Kitchen
 * Based on the architecture plan with all endpoints for Auth, Recipes, Ratings, Categories, and Admin
 */

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
export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

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

export interface AdminRecipeListResponse {
  data: Recipe[];
  total: number;
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

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

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
  }

  public clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // ============================================================================
  // HTTP Methods
  // ============================================================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      (headers as any)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: headers as HeadersInit,
    });

    if (!response.ok) {
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

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && this.refreshToken) {
      try {
        await this.refreshAccessToken();
        // Let caller retry
      } catch {
        // Refresh failed, clear tokens
        this.clearTokens();
        window.location.href = '/login';
      }
    }

    return error;
  }

  // ============================================================================
  // Auth Endpoints
  // ============================================================================

  /**
   * POST /api/auth/register
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

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

    const queryString = queryParams.toString();
    const endpoint = `/api/recipes${queryString ? `?${queryString}` : ''}`;

    return this.request<RecipeListResponse>(endpoint);
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

// ============================================================================
// Convenience functions for backward compatibility
// ============================================================================

/**
 * Fetch recipes with filtering and pagination
 * @deprecated Use apiClient.getRecipes() instead
 */
export async function fetchRecipes(params: RecipeListParams = {}): Promise<{ data: Recipe[]; meta: RecipeListMeta }> {
  const result = await apiClient.getRecipes(params);
  return { data: result.data, meta: result.meta };
}

/**
 * Fetch a single recipe by slug
 * @deprecated Use apiClient.getRecipeBySlug() instead
 */
export async function fetchRecipe(slug: string): Promise<Recipe> {
  return apiClient.getRecipeBySlug(slug);
}

/**
 * Fetch a single recipe by id
 * @deprecated Use apiClient.getRecipeById() instead
 */
export async function fetchRecipeById(id: string): Promise<Recipe> {
  return apiClient.getRecipeById(id);
}

/**
 * Create a new recipe
 * @deprecated Use apiClient.createRecipe() instead
 */
export async function createRecipe(data: CreateRecipeRequest): Promise<Recipe> {
  return apiClient.createRecipe(data);
}

/**
 * Update an existing recipe
 * @deprecated Use apiClient.updateRecipe() instead
 */
export async function updateRecipe(id: string, data: UpdateRecipeRequest): Promise<Recipe> {
  return apiClient.updateRecipe(id, data);
}

/**
 * Delete a recipe
 * @deprecated Use apiClient.deleteRecipe() instead
 */
export async function deleteRecipe(id: string): Promise<void> {
  return apiClient.deleteRecipe(id);
}

/**
 * Get all categories
 * @deprecated Use apiClient.getCategories() instead
 */
export async function fetchCategories(): Promise<Category[]> {
  return apiClient.getCategories();
}

/**
 * Create or update a rating for a recipe
 * @deprecated Use apiClient.createRating() instead
 */
export async function createOrUpdateRating(recipeId: string, stars: number): Promise<Rating> {
  const result = await apiClient.createRating(recipeId, { stars });
  return result.rating;
}

/**
 * Get the current user's rating for a recipe
 * @deprecated Use apiClient.getRating() instead
 */
export async function getUserRating(recipeId: string): Promise<Rating | null> {
  try {
    return await apiClient.getRating(recipeId);
  } catch (error) {
    // If 404, user hasn't rated this recipe yet
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * Delete the current user's rating for a recipe
 * @deprecated Use apiClient.deleteRating() instead
 */
export async function deleteRating(recipeId: string): Promise<void> {
  return apiClient.deleteRating(recipeId);
}

/**
 * Register a new user
 * @deprecated Use apiClient.register() instead
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiClient.register(data);
}

/**
 * Login with email and password
 * @deprecated Use apiClient.login() instead
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  return apiClient.login(data);
}

/**
 * Logout current user
 * @deprecated Use apiClient.logout() instead
 */
export async function logout(): Promise<void> {
  return apiClient.logout();
}

/**
 * Get current user info
 * @deprecated Use apiClient.getMe() instead
 */
export async function me(): Promise<MeResponse> {
  return apiClient.getMe();
}

/**
 * Refresh access token
 * @deprecated Use apiClient.refreshAccessToken() instead
 */
export async function refreshAccessToken(): Promise<AuthResponse> {
  return apiClient.refreshAccessToken();
}

/**
 * Publish a recipe
 * @deprecated Use apiClient.publishRecipe() instead
 */
export async function publishRecipe(id: string): Promise<Recipe> {
  return apiClient.publishRecipe(id);
}

/**
 * Archive a recipe
 * @deprecated Use apiClient.archiveRecipe() instead
 */
export async function archiveRecipe(id: string): Promise<Recipe> {
  return apiClient.archiveRecipe(id);
}

/**
 * Create a new category (admin only)
 * @deprecated Use apiClient.createCategory() instead
 */
export async function createCategory(data: CreateCategoryRequest): Promise<Category> {
  return apiClient.createCategory(data);
}

/**
 * Update a category (admin only)
 * @deprecated Use apiClient.updateCategory() instead
 */
export async function updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
  return apiClient.updateCategory(id, data);
}

/**
 * Delete a category (admin only)
 * @deprecated Use apiClient.deleteCategory() instead
 */
export async function deleteCategory(id: string): Promise<void> {
  return apiClient.deleteCategory(id);
}

/**
 * Get all users (admin only)
 * @deprecated Use apiClient.getUsers() instead
 */
export async function getUsers(): Promise<UserListResponse> {
  return apiClient.getUsers();
}

/**
 * Update user role (admin only)
 * @deprecated Use apiClient.updateUserRole() instead
 */
export async function updateUserRole(id: string, data: UpdateUserRoleRequest): Promise<User> {
  return apiClient.updateUserRole(id, data);
}

/**
 * Get all recipes including drafts (admin only)
 * @deprecated Use apiClient.getAdminRecipes() instead
 */
export async function getAdminRecipes(): Promise<AdminRecipeListResponse> {
  return apiClient.getAdminRecipes();
}

/**
 * Check API health status
 * @deprecated Use apiClient.healthCheck() instead
 */
export async function healthCheck(): Promise<{ status: string; timestamp: string; database: string; version?: string }> {
  return apiClient.healthCheck();
}
