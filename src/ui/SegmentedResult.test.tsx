import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedResult } from './SegmentedResult';

describe('SegmentedResult', () => {
  it('exposes both options as radios with the selection marked', () => {
    render(<SegmentedResult value="succes" onChange={() => {}} />);

    const succes = screen.getByRole('radio', { name: 'Succès' });
    const echec = screen.getByRole('radio', { name: 'Échec' });

    expect(succes).toHaveAttribute('aria-checked', 'true');
    expect(echec).toHaveAttribute('aria-checked', 'false');
  });

  it('reports the newly chosen segment', async () => {
    const onChange = vi.fn();
    render(<SegmentedResult value="succes" onChange={onChange} />);

    await userEvent.click(screen.getByRole('radio', { name: 'Échec' }));
    expect(onChange).toHaveBeenCalledWith('echec');
  });
});
