// React Query Hooks for Admin
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type CreateUserRequest, type UpdateUserNameRequest, type UpdateUserRoleRequest } from '../api/client';

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
      queryClient.invalidateQueries({ queryKey: ['audit-log'] });
    },
  });
}

export function useUpdateUserName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserNameRequest }) =>
      apiClient.updateUserName(id, data),
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
      queryClient.invalidateQueries({ queryKey: ['audit-log'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['audit-log'] });
    },
  });
}

export function useAuditLog() {
  return useQuery({
    queryKey: ['audit-log'],
    queryFn: () => apiClient.getAuditLog(),
  });
}

export function useAdminRecipes() {
  return useQuery({
    queryKey: ['admin-recipes'],
    queryFn: () => apiClient.getAdminRecipes(),
  });
}
