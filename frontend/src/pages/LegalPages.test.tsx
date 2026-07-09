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

  it('shows the real operator details without a completion warning', () => {
    render(
      <MemoryRouter>
        <ImpressumPage />
      </MemoryRouter>,
    );

    // Real contact data is filled in, so no completion hint is shown.
    expect(operatorNeedsCompletion()).toBe(false);
    expect(screen.queryByText(/noch nicht vollständig/i)).not.toBeInTheDocument();
    expect(screen.getByText('Michelle Zboron')).toBeInTheDocument();
    expect(screen.getByText('30926 Seelze')).toBeInTheDocument();
  });

  it('still detects incomplete operator data via the helper', () => {
    expect(
      operatorNeedsCompletion({
        name: 'PLZ',
        street: '',
        postalCode: 'PLZ',
        city: 'Ort',
        country: 'Deutschland',
        email: 'kontakt@chellys-kitchen.de',
        phone: '',
      }),
    ).toBe(true);
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
