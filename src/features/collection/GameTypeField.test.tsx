import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameTypeField } from './GameTypeField';

describe('GameTypeField', () => {
  it('offers both types and reports the domain value chosen', async () => {
    const onChange = vi.fn();
    render(<GameTypeField onChange={onChange} />);

    await userEvent.click(screen.getByRole('radio', { name: 'Coopératif' }));
    expect(onChange).toHaveBeenCalledWith('cooperative');

    await userEvent.click(screen.getByRole('radio', { name: 'Compétitif' }));
    expect(onChange).toHaveBeenCalledWith('competitive');
  });

  it('marks the selected option for assistive tech', () => {
    render(<GameTypeField value="competitive" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Compétitif' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Coopératif' })).not.toBeChecked();
  });

  it('when locked, shows the type with a non-color lock cue and no choice', () => {
    const onChange = vi.fn();
    render(<GameTypeField value="cooperative" locked onChange={onChange} />);

    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.getByText('Coopératif')).toBeInTheDocument();
    // Lock is conveyed by text, never color alone.
    expect(screen.getByText(/verrouillé/i)).toBeInTheDocument();
  });
});
