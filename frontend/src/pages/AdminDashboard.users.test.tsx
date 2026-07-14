import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminDashboard } from './AdminDashboard';

const useAuthMock = vi.fn();
const createUserMock = vi.fn();
const updateUserNameMock = vi.fn();
const deleteUserMock = vi.fn();
let usersDataMock: {
  data: Array<{
    id: string;
    name: string;
    username: string;
    role: 'GUEST' | 'MEMBER' | 'EDITOR' | 'ADMIN';
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
} = { data: [], total: 0 };

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

const mockMutation = () => ({ isPending: false, mutateAsync: vi.fn() });

vi.mock('../hooks/useAdmin', () => ({
  useUsers: () => ({ data: usersDataMock, isLoading: false, error: null }),
  useUpdateUserRole: () => mockMutation(),
  useUpdateUserName: () => ({ isPending: false, mutateAsync: updateUserNameMock }),
  useCreateUser: () => ({ isPending: false, mutateAsync: createUserMock }),
  useDeleteUser: () => ({ isPending: false, mutateAsync: deleteUserMock }),
  useAdminRecipes: () => ({ data: { data: [], total: 0 } }),
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
  apiClient: {
    exportBackup: vi.fn(),
    importBackup: vi.fn(),
  },
}));

function renderDashboard() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminDashboard user creation', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    createUserMock.mockReset();
    updateUserNameMock.mockReset();
    deleteUserMock.mockReset();
    usersDataMock = { data: [], total: 0 };
  });

  it('creates a user with name, username, password and role', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    createUserMock.mockResolvedValue({ id: 'user-2', name: 'Chelly', username: 'chelly', role: 'MEMBER' });

    renderDashboard();

    fireEvent.click(screen.getByRole('button', { name: 'Benutzer anlegen' }));

    fireEvent.change(await screen.findByLabelText(/Name/), { target: { value: 'Chelly' } });
    fireEvent.change(screen.getByLabelText(/Benutzername/), { target: { value: 'chelly' } });
    fireEvent.change(screen.getByLabelText(/Passwort/), { target: { value: 'geheim123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Anlegen' }));

    await waitFor(() =>
      expect(createUserMock).toHaveBeenCalledWith({
        name: 'Chelly',
        username: 'chelly',
        password: 'geheim123',
        role: 'MEMBER',
      }),
    );
    await waitFor(() => expect(screen.getByText(/Chelly/)).toBeInTheDocument());
  });

  it('does not submit while a required field is missing', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'admin-1', role: 'ADMIN' } });

    renderDashboard();

    fireEvent.click(screen.getByRole('button', { name: 'Benutzer anlegen' }));
    fireEvent.change(await screen.findByLabelText(/Name/), { target: { value: 'Ohne Mail' } });

    fireEvent.click(screen.getByRole('button', { name: 'Anlegen' }));

    await waitFor(() => expect(createUserMock).not.toHaveBeenCalled());
  });

  it('changes a user name', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    updateUserNameMock.mockResolvedValue({ id: 'user-2', name: 'Chelly Kocht' });
    usersDataMock = {
      data: [{ id: 'user-2', name: 'Chelly', username: 'chelly', role: 'MEMBER', createdAt: '2026-01-01', updatedAt: '2026-01-01' }],
      total: 1,
    };

    renderDashboard();

    fireEvent.click(screen.getByRole('button', { name: 'Name ändern' }));
    fireEvent.change(await screen.findByLabelText(/^Name$/), { target: { value: 'Chelly Kocht' } });
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(updateUserNameMock).toHaveBeenCalledWith({
      id: 'user-2',
      data: { name: 'Chelly Kocht' },
    }));
    await waitFor(() => expect(screen.getByText(/Name von Chelly Kocht wurde geändert/)).toBeInTheDocument());
  });

  it('deletes a user after confirmation', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    deleteUserMock.mockResolvedValue(undefined);
    usersDataMock = {
      data: [{ id: 'user-2', name: 'Chelly', username: 'chelly', role: 'MEMBER', createdAt: '2026-01-01', updatedAt: '2026-01-01' }],
      total: 1,
    };
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderDashboard();

    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }));

    await waitFor(() => expect(deleteUserMock).toHaveBeenCalledWith('user-2'));
    await waitFor(() => expect(screen.getByText(/Benutzer Chelly wurde gelöscht/)).toBeInTheDocument());
    confirmSpy.mockRestore();
  });

  it('does not delete a user when the confirmation is cancelled', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    usersDataMock = {
      data: [{ id: 'user-2', name: 'Chelly', username: 'chelly', role: 'MEMBER', createdAt: '2026-01-01', updatedAt: '2026-01-01' }],
      total: 1,
    };
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderDashboard();

    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }));

    await waitFor(() => expect(deleteUserMock).not.toHaveBeenCalled());
    confirmSpy.mockRestore();
  });

  it('does not offer a delete button for the current admin', () => {
    useAuthMock.mockReturnValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    usersDataMock = {
      data: [{ id: 'admin-1', name: 'Ich', username: 'ich', role: 'ADMIN', createdAt: '2026-01-01', updatedAt: '2026-01-01' }],
      total: 1,
    };

    renderDashboard();

    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument();
  });
});
