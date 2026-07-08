import { afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';

const useAuthMock = vi.fn();

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('AppShell', () => {
  it('shows the Chellys Kitchen logo linking to the home page', () => {
    useAuthMock.mockReturnValue({ user: null, logout: vi.fn() });

    const screen = render(
      <MemoryRouter>
        <AppShell>Inhalt</AppShell>
      </MemoryRouter>,
    );

    const logo = screen.getByAltText('Chellys Kitchen Logo');
    expect(logo).toHaveAttribute('src', '/brand/chellys-kitchen-icon.svg');
    expect(screen.getByRole('link', { name: /Chellys Kitchen/ })).toHaveAttribute('href', '/');
  });
});
