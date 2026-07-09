import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';
import { ImpressumPage } from './ImpressumPage';
import { DatenschutzPage } from './DatenschutzPage';
import { operatorNeedsCompletion } from '../legal/siteOperator';

afterEach(cleanup);

describe('legal pages', () => {
  it('renders the Impressum with the operator block and legal basis', () => {
    render(
      <MemoryRouter>
        <ImpressumPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Impressum' })).toBeInTheDocument();
    expect(screen.getByText(/Angaben gemäß/)).toBeInTheDocument();
    expect(screen.getByText('Deutschland')).toBeInTheDocument();
  });

  it('warns while the operator placeholders are not filled in', () => {
    render(
      <MemoryRouter>
        <ImpressumPage />
      </MemoryRouter>,
    );

    // The shipped defaults are placeholders, so the completion hint shows.
    expect(operatorNeedsCompletion()).toBe(true);
    expect(screen.getByText(/noch nicht vollständig/i)).toBeInTheDocument();
  });

  it('renders the privacy policy with the required sections', () => {
    render(
      <MemoryRouter>
        <DatenschutzPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Datenschutzerklärung' })).toBeInTheDocument();
    expect(screen.getByText(/Verantwortlich/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Deine Rechte/ })).toBeInTheDocument();
  });
});

describe('operatorNeedsCompletion', () => {
  it('is false once every required field is filled', () => {
    expect(
      operatorNeedsCompletion({
        name: 'Christoph Ruhe',
        street: 'Musterweg 1',
        postalCode: '12345',
        city: 'Musterstadt',
        country: 'Deutschland',
        email: 'chris@example.com',
        phone: '',
      }),
    ).toBe(false);
  });
});
