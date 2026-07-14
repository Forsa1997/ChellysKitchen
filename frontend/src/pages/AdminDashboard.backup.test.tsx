import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminDashboard } from './AdminDashboard';

const useAuthMock = vi.fn();
const exportBackupMock = vi.fn();
const importBackupMock = vi.fn();

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

const mockMutation = () => ({ isPending: false, mutateAsync: vi.fn() });

vi.mock('../hooks/useAdmin', () => ({
  useUsers: () => ({ data: { data: [], total: 0 }, isLoading: false, error: null }),
  useUpdateUserRole: () => mockMutation(),
  useUpdateUserName: () => mockMutation(),
  useCreateUser: () => mockMutation(),
  useDeleteUser: () => mockMutation(),
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
    exportBackup: (...args: unknown[]) => exportBackupMock(...args),
    importBackup: (...args: unknown[]) => importBackupMock(...args),
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

describe('AdminDashboard backup section', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    exportBackupMock.mockReset();
    importBackupMock.mockReset();
  });

  it('describes backups as an additional safeguard without claiming redeploy data loss', () => {
    useAuthMock.mockReturnValue({ user: { id: 'admin-1', role: 'ADMIN' } });

    renderDashboard();

    expect(screen.getByText(/zusätzliche Absicherung/i)).toBeInTheDocument();
    expect(screen.queryByText(/bei jedem Redeploy verloren/i)).not.toBeInTheDocument();
  });

  it('downloads the exported backup as a JSON file', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    exportBackupMock.mockResolvedValue({ type: 'chellys-kitchen-backup', version: 1 });
    const createObjectURL = vi.fn().mockReturnValue('blob:backup');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(Object.create(URL), { createObjectURL, revokeObjectURL }));

    renderDashboard();

    fireEvent.click(screen.getByRole('button', { name: 'Backup herunterladen' }));

    await waitFor(() => expect(exportBackupMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));

    vi.unstubAllGlobals();
  });

  it('imports a backup file after explicit confirmation', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    importBackupMock.mockResolvedValue({ recipes: 3, users: 2, categories: 6, uploads: 1 });

    renderDashboard();

    const payload = { type: 'chellys-kitchen-backup', version: 1, users: [], recipeStore: [] };
    const file = new File([JSON.stringify(payload)], 'backup.json', { type: 'application/json' });
    fireEvent.change(screen.getByLabelText('Backup-Datei auswählen'), { target: { files: [file] } });

    // Nothing is imported before the admin confirms.
    const confirmButton = await screen.findByRole('button', { name: 'Importieren' });
    expect(importBackupMock).not.toHaveBeenCalled();

    fireEvent.click(confirmButton);

    await waitFor(() => expect(importBackupMock).toHaveBeenCalledWith(payload));
    await waitFor(() => expect(screen.getByText(/3 Rezepte/)).toBeInTheDocument());
  });

  it('rejects files that are not valid JSON', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'admin-1', role: 'ADMIN' } });

    renderDashboard();

    const file = new File(['kein json {'], 'kaputt.json', { type: 'application/json' });
    fireEvent.change(screen.getByLabelText('Backup-Datei auswählen'), { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Die Datei ist kein gültiges Backup (JSON erwartet).')).toBeInTheDocument();
    });
    expect(importBackupMock).not.toHaveBeenCalled();
  });
});
