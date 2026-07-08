import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminDashboard } from './AdminDashboard';

const useAuthMock = vi.fn();
const createUserMock = vi.fn();

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

const mockMutation = () => ({ isPending: false, mutateAsync: vi.fn() });

vi.mock('../hooks/useAdmin', () => ({
  useUsers: () => ({ data: { data: [], total: 0 }, isLoading: false, error: null }),
  useUpdateUserRole: () => mockMutation(),
  useCreateUser: () => ({ isPending: false, mutateAsync: createUserMock }),
  useAdminRecipes: () => ({ data: { data: [], total: 0 } }),
}));

vi.mock('../hooks/useRecipes', () => ({
  usePublishRecipe: () => mockMutation(),
  useArchiveRecipe: () => mockMutation(),
  useDeleteRecipe: () => mockMutation(),
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
  });

  it('creates a user with name, email, password and role', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    createUserMock.mockResolvedValue({ id: 'user-2', name: 'Chelly', email: 'chelly@example.com', role: 'MEMBER' });

    renderDashboard();

    fireEvent.click(screen.getByRole('button', { name: 'Benutzer anlegen' }));

    fireEvent.change(await screen.findByLabelText(/Name/), { target: { value: 'Chelly' } });
    fireEvent.change(screen.getByLabelText(/E-Mail/), { target: { value: 'chelly@example.com' } });
    fireEvent.change(screen.getByLabelText(/Passwort/), { target: { value: 'geheim123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Anlegen' }));

    await waitFor(() =>
      expect(createUserMock).toHaveBeenCalledWith({
        name: 'Chelly',
        email: 'chelly@example.com',
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
});
