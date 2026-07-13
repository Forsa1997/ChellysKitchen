// React Query Hooks for the admin batch photo import
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, type BatchImportJobListResponse } from '../api/client';

export function useBatchImportJobs(enabled = true) {
  return useQuery({
    queryKey: ['batch-import-jobs'],
    queryFn: () => apiClient.getBatchImportJobs(),
    enabled,
    // Poll while a batch is running so the progress view updates live.
    refetchInterval: (query) => {
      const data = query.state.data as BatchImportJobListResponse | undefined;
      return data?.data.some((job) => job.status === 'RUNNING') ? 2000 : false;
    },
  });
}

export function useStartBatchImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (files: File[]) => apiClient.startBatchPhotoImport(files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-import-jobs'] });
    },
  });
}
