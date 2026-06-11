import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BackHeader } from './BackHeader';

describe('BackHeader', () => {
  it('renders an h1 when given a title', () => {
    render(<BackHeader title="Catan" onBack={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Catan',
    );
  });

  it('renders NO heading when title is empty (host owns the h1)', () => {
    render(<BackHeader title="" onBack={vi.fn()} />);
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('always exposes the back button', () => {
    render(<BackHeader title="" onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Retour' })).toBeInTheDocument();
  });
});
