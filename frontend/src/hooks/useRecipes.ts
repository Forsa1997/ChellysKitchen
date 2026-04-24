// React Query Hooks for Recipes
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type Recipe, type RecipeListParams, type CreateRecipeRequest, type UpdateRecipeRequest } from '../api/client';

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.id] });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function usePublishRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.publishRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useArchiveRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.archiveRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}