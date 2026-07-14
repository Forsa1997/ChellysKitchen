import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminDashboard } from './AdminDashboard';

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'admin-1', role: 'ADMIN' } }),
}));

const mockMutation = () => ({ isPending: false, mutateAsync: vi.fn() });
const useAuditLogMock = vi.fn();

vi.mock('../hooks/useAdmin', () => ({
  useUsers: () => ({ data: { data: [], total: 0 }, isLoading: false, error: null }),
  useUpdateUserRole: () => mockMutation(),
  useUpdateUserName: () => mockMutation(),
  useCreateUser: () => mockMutation(),
  useDeleteUser: () => mockMutation(),
  useAdminRecipes: () => ({ data: { data: [], total: 0 } }),
  useAuditLog: () => useAuditLogMock(),
}));

vi.mock('../hooks/useRecipes', () => ({
  usePublishRecipe: () => mockMutation(),
  useArchiveRecipe: () => mockMutation(),
  useDeleteRecipe: () => mockMutation(),
}));

vi.mock('../hooks/useBatchImport', () => ({
  useBatchImportJobs: () => ({ data: { data: [], total: 0 } }),
}));

vi.mock('../api/client', () => ({
  apiClient: { exportBackup: vi.fn(), importBackup: vi.fn() },
}));

describe('AdminDashboard audit log', () => {
  beforeEach(() => {
    useAuditLogMock.mockReturnValue({
      isLoading: false,
      error: null,
      data: {
        total: 2,
        data: [
          {
            id: 'audit-2',
            action: 'USER_ROLE_CHANGED',
            actor: { id: 'admin-1', name: 'Christoph', username: 'chef' },
            target: { type: 'USER', id: 'user-1', label: 'Chelly', username: 'chelly' },
            details: { previousRole: 'MEMBER', newRole: 'EDITOR' },
            createdAt: '2026-07-14T12:30:00.000Z',
          },
          {
            id: 'audit-1',
            action: 'BACKUP_IMPORTED',
            actor: { id: 'admin-1', name: 'Christoph', username: 'chef' },
            target: { type: 'BACKUP', label: 'Backup' },
            details: { recipes: 12, users: 3, categories: 6, uploads: 4 },
            createdAt: '2026-07-14T11:00:00.000Z',
          },
        ],
      },
    });
  });

  afterEach(() => {
    cleanup();
    useAuditLogMock.mockReset();
  });

  it('shows recent actions with actor, target and useful details', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Audit-Log' })).toBeInTheDocument();
    expect(screen.getByText('Rolle geändert')).toBeInTheDocument();
    expect(screen.getByText('Backup importiert')).toBeInTheDocument();
    expect(screen.getAllByText(/Christoph \(@chef\)/)).toHaveLength(2);
    expect(screen.getByText(/Chelly \(@chelly\)/)).toBeInTheDocument();
    expect(screen.getByText(/MEMBER → EDITOR/)).toBeInTheDocument();
    expect(screen.getByText(/12 Rezepte, 3 Benutzer, 6 Kategorien, 4 Bilder/)).toBeInTheDocument();
  });

  it('shows an error instead of an empty history when loading fails', () => {
    useAuditLogMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Netzwerkfehler'),
    });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Netzwerkfehler');
    expect(screen.queryByText(/Noch keine protokollierten/)).not.toBeInTheDocument();
  });
});
