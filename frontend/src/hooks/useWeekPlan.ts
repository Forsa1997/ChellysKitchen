// React Query Hooks for the shared family week plan
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type WeekDay } from '../api/client';

export function useWeekPlan() {
  return useQuery({
    queryKey: ['weekplan'],
    queryFn: () => apiClient.getWeekPlan(),
  });
}

export function useAddToWeekPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ day, recipeId, servings }: { day: WeekDay; recipeId: string; servings?: number }) =>
      apiClient.addToWeekPlan(day, { recipeId, servings }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekplan'] });
    },
  });
}

export function useRemoveFromWeekPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ day, recipeId }: { day: WeekDay; recipeId: string }) =>
      apiClient.removeFromWeekPlan(day, recipeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekplan'] });
    },
  });
}

export function useClearWeekPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.clearWeekPlan(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekplan'] });
    },
  });
}
