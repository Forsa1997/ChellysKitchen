import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RatingDisplay } from './Rating';

afterEach(cleanup);

describe('RatingDisplay', () => {
  it('keeps empty stars visible on dark surfaces', () => {
    const { container } = render(<RatingDisplay value={0} count={0} size="small" />);
    const emptyStar = container.querySelector('.MuiRating-iconEmpty svg');

    expect(emptyStar).toHaveStyle({ opacity: '0.75' });
  });
});
