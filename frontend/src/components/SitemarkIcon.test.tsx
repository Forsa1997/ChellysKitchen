import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SitemarkIcon from './SitemarkIcon';

describe('SitemarkIcon', () => {
  it('renders the Chellys Kitchen logo with brand text and cooking mark', () => {
    render(<SitemarkIcon />);

    const logo = screen.getByRole('img', { name: 'Chellys Kitchen Logo' });
    expect(logo).toBeInTheDocument();
    expect(logo.querySelector('title')?.textContent).toBe('Chellys Kitchen Logo');
    expect(logo.textContent).toContain('Chellys');
    expect(logo.textContent).toContain('Kitchen');
    expect(logo.querySelector('[data-testid="logo-cloche"]')).not.toBeNull();
    expect(logo.querySelector('[data-testid="logo-heart-steam"]')).not.toBeNull();
  });
});
