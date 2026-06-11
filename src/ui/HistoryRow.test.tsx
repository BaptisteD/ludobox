import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HistoryRow } from './HistoryRow';

describe('HistoryRow', () => {
  it('renders the date tile, title and meta', () => {
    render(<HistoryRow day={24} month="MAI" title="Catan" meta="Compétitif" />);
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('MAI')).toBeInTheDocument();
    expect(screen.getByText('Catan')).toBeInTheDocument();
    expect(screen.getByText('Compétitif')).toBeInTheDocument();
  });

  it('stacks the chip + numeric score "Ndd pts" under the game name (player layout)', () => {
    // The player variant puts the game name on top and the chip + score below,
    // with the "pts" unit (maquette 2I6-0).
    render(
      <HistoryRow
        variant="player"
        day={24}
        month="MAI"
        title="Les Aventuriers du Rail"
        result="victoire"
        score={142}
      />,
    );
    expect(screen.getByText('Les Aventuriers du Rail')).toBeInTheDocument();
    expect(screen.getByText('Victoire')).toBeInTheDocument();
    expect(screen.getByText('142')).toBeInTheDocument();
    expect(screen.getByText('pts')).toBeInTheDocument();
  });

  it('stacks the chip + explicit "Score non renseigné" under a short game name', () => {
    // Regression: the chip + unset score used to crush the title to ~10px.
    render(
      <HistoryRow
        variant="player"
        day={3}
        month="MAI"
        title="catan"
        result="defaite"
        score="unset"
      />,
    );
    expect(screen.getByText('catan')).toBeInTheDocument();
    expect(screen.getByText('Défaite')).toBeInTheDocument();
    expect(screen.getByText('Score non renseigné')).toBeInTheDocument();
    expect(screen.queryByText('pts')).not.toBeInTheDocument();
  });

  it('renders a numeric score instead of the unset state', () => {
    render(<HistoryRow day={7} month="JUIN" title="Catan" score={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.queryByText('Score non renseigné')).not.toBeInTheDocument();
  });

  it('is a button when given an onClick handler', () => {
    render(<HistoryRow day={1} month="JAN" title="Catan" onClick={() => {}} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
