/**
 * Light-touch a11y smoke for the kit (full audit lands in Brique 8). Asserts
 * the two invariants from DESIGN.md §Accessibility that are easy to regress:
 * status is never conveyed by color alone, and interactive controls expose a
 * role + accessible name.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RankBadge } from './RankBadge';
import { ResultChip } from './ResultChip';
import { Tag } from './Tag';
import { WinnerToggle } from './WinnerToggle';

describe('a11y · status never relies on color alone', () => {
  it('ResultChip always renders its text label (plus an icon)', () => {
    render(
      <>
        <ResultChip result="victoire" />
        <ResultChip result="echec" />
      </>,
    );
    expect(screen.getByText('Victoire')).toBeInTheDocument();
    expect(screen.getByText('Échec')).toBeInTheDocument();
  });

  it('Tag carries its game-type label', () => {
    render(<Tag type="cooperatif" />);
    expect(screen.getByText('Coopératif')).toBeInTheDocument();
  });

  it('RankBadge shows the rank number so order never relies on color', () => {
    render(<RankBadge rank={2} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});

describe('a11y · interactive controls expose role + name', () => {
  it('WinnerToggle is a labelled switch', () => {
    render(
      <WinnerToggle on={false} onChange={() => {}} label="Inès a gagné" />,
    );
    expect(
      screen.getByRole('switch', { name: 'Inès a gagné' }),
    ).toBeInTheDocument();
  });
});
