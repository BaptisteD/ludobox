import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WinnerToggle } from './WinnerToggle';

describe('WinnerToggle', () => {
  it('exposes a switch role with the current state and an accessible name', () => {
    render(
      <WinnerToggle on={false} onChange={() => {}} label="Camille a gagné" />,
    );
    const toggle = screen.getByRole('switch', { name: 'Camille a gagné' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('reflects the on state via aria-checked', () => {
    render(<WinnerToggle on onChange={() => {}} label="Camille a gagné" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('requests the opposite state on click', async () => {
    const onChange = vi.fn();
    render(
      <WinnerToggle on={false} onChange={onChange} label="Camille a gagné" />,
    );

    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not toggle when disabled', async () => {
    const onChange = vi.fn();
    render(
      <WinnerToggle
        on={false}
        onChange={onChange}
        label="Camille a gagné"
        disabled
      />,
    );

    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
