import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { RecipeImage } from './RecipeImage';

const fetchImageObjectUrl = vi.fn<(url: string) => Promise<string>>(() =>
  Promise.resolve('blob:mock-object-url'),
);

vi.mock('../api/client', () => ({
  apiClient: {
    fetchImageObjectUrl: (url: string) => fetchImageObjectUrl(url),
  },
  getApiBaseUrl: () => 'http://localhost:4000',
}));

afterEach(() => {
  cleanup();
  fetchImageObjectUrl.mockClear();
});

describe('RecipeImage', () => {
  it('renders a public URL directly without an authenticated fetch', () => {
    const screen = render(<RecipeImage src="https://picsum.photos/800/450" alt="Extern" />);

    const img = screen.getByAltText('Extern') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('https://picsum.photos/800/450');
    expect(fetchImageObjectUrl).not.toHaveBeenCalled();
  });

  it('fetches a protected /uploads image with the token and shows the object URL', async () => {
    const screen = render(<RecipeImage src="/uploads/foto.png" alt="Upload" />);

    expect(fetchImageObjectUrl).toHaveBeenCalledWith('/uploads/foto.png');

    await waitFor(() => {
      const img = screen.getByAltText('Upload') as HTMLImageElement;
      expect(img.getAttribute('src')).toBe('blob:mock-object-url');
    });
  });
});
