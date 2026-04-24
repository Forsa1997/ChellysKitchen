// React Query Hooks for Ratings
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type Rating, type CreateRatingRequest } from '../api/client';

export function useRecipeRatings(slug: string) {
  return useQuery({
    queryKey: ['recipe-ratings', slug],
    queryFn: () => apiClient.getRating(slug),
    enabled: !!slug,
  });
}

export function useCreateRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: CreateRatingRequest }) =>
      apiClient.createRating(slug, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipe-ratings', variables.slug] });
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.slug] });
    },
  });
}

export function useDeleteRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => apiClient.deleteRating(slug),
    onSuccess: (slug) => {
      queryClient.invalidateQueries({ queryKey: ['recipe-ratings', slug] });
      queryClient.invalidateQueries({ queryKey: ['recipe', slug] });
    },
  });
}