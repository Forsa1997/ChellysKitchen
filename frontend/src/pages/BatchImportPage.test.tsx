import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BatchImportPage } from './BatchImportPage';
import type { BatchImportJob } from '../api/client';

const useAuthMock = vi.fn();
const startBatchPhotoImportMock = vi.fn();
let jobsMock: BatchImportJob[] = [];

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../api/client', () => ({
  MAX_BATCH_IMPORT_PHOTOS: 10,
  apiClient: {
    startBatchPhotoImport: (...args: unknown[]) => startBatchPhotoImportMock(...args),
    getBatchImportJobs: () => Promise.resolve({ data: jobsMock, total: jobsMock.length }),
  },
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <BatchImportPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BatchImportPage', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    startBatchPhotoImportMock.mockReset();
    jobsMock = [];
  });

  it('is only accessible for admins', () => {
    useAuthMock.mockReturnValue({ user: { id: 'user-1', role: 'EDITOR' } });

    renderPage();

    expect(screen.getByText(/nur für Admins/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Fotos auswählen/ })).toBeNull();
  });

  it('starts a batch with the selected photos', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    startBatchPhotoImportMock.mockResolvedValue({ job: { id: 'batch_1' } });

    renderPage();

    const fileA = new File(['a'], 'kochbuch-1.png', { type: 'image/png' });
    const fileB = new File(['b'], 'kochbuch-2.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Rezeptfotos auswählen'), {
      target: { files: [fileA, fileB] },
    });

    expect(await screen.findByText('kochbuch-1.png')).toBeTruthy();
    expect(screen.getByText('kochbuch-2.jpg')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '2 Fotos verarbeiten' }));

    await waitFor(() => expect(startBatchPhotoImportMock).toHaveBeenCalledTimes(1));
    expect(startBatchPhotoImportMock).toHaveBeenCalledWith([fileA, fileB]);

    // The selection is cleared once the batch has been handed to the server.
    await waitFor(() => expect(screen.queryByText('kochbuch-1.png')).toBeNull());
  });

  it('shows the progress of jobs including created drafts', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    jobsMock = [
      {
        id: 'batch_1',
        status: 'RUNNING',
        createdAt: '2026-07-13T10:00:00.000Z',
        finishedAt: null,
        createdBy: { id: 'admin-1', name: 'Admin' },
        total: 3,
        processed: 2,
        created: 1,
        noRecipe: 1,
        failed: 0,
        items: [
          {
            index: 0,
            fileName: 'seite-1.png',
            status: 'CREATED',
            recipe: { id: 'r_1', slug: 'pfannkuchen', title: 'Pfannkuchen' },
          },
          { index: 1, fileName: 'katze.png', status: 'NO_RECIPE' },
          { index: 2, fileName: 'seite-2.png', status: 'PROCESSING' },
        ],
      },
    ];

    renderPage();

    expect(await screen.findByText(/2\/3 Fotos verarbeitet/)).toBeTruthy();
    expect(screen.getByText('Läuft…')).toBeTruthy();

    const draftLink = screen.getByRole('link', { name: 'Pfannkuchen' });
    expect(draftLink.getAttribute('href')).toBe('/recipes/pfannkuchen');
    expect(screen.getByText('Kein Rezept erkannt')).toBeTruthy();
    expect(screen.getByText('Wird analysiert…')).toBeTruthy();
  });
});
