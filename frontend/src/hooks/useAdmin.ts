// React Query Hooks for Admin
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type CreateUserRequest, type UpdateUserRoleRequest } from '../api/client';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.getUsers(),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRoleRequest }) =>
      apiClient.updateUserRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => apiClient.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useAdminRecipes() {
  return useQuery({
    queryKey: ['admin-recipes'],
    queryFn: () => apiClient.getAdminRecipes(),
  });
}