// React Query Hooks for Recipes
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type RecipeListParams, type CreateRecipeRequest, type UpdateRecipeRequest } from '../api/client';

export function useRecipes(params: RecipeListParams = {}) {
  return useQuery({
    queryKey: ['recipes', params],
    queryFn: () => apiClient.getRecipes(params),
  });
}

export function useRecipe(slug: string) {
  return useQuery({
    queryKey: ['recipe', slug],
    queryFn: () => apiClient.getRecipeBySlug(slug),
    enabled: !!slug,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRecipeRequest) => apiClient.createRecipe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecipeRequest }) =>
      apiClient.updateRecipe(id, data),
    onSuccess: () => {
      // Detail queries are keyed by slug, not id, so invalidate all of them.
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipe'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recipes'] });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recipes'] });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, isFavorite }: { slug: string; isFavorite: boolean }) =>
      (isFavorite ? apiClient.removeFavorite(slug) : apiClient.setFavorite(slug)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipe'] });
    },
  });
}

export function useDuplicateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idOrSlug: string) => apiClient.duplicateRecipe(idOrSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useUpdateRecipeNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, notes }: { slug: string; notes: string }) =>
      apiClient.updateRecipeNotes(slug, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipe'] });
    },
  });
}

export function usePublishRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.publishRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipe'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recipes'] });
    },
  });
}

export function useArchiveRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.archiveRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipe'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recipes'] });
    },
  });
}