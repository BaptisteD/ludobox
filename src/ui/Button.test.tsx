import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { Plus } from './icons';

describe('Button (CTA)', () => {
  it('renders the label and fires onClick when enabled', async () => {
    const onClick = vi.fn();
    render(
      <Button label="Ajouter une partie" icon={<Plus />} onClick={onClick} />,
    );

    const button = screen.getByRole('button', { name: 'Ajouter une partie' });
    await userEvent.click(button);

    expect(button).toBeEnabled();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled and does not fire onClick when disabled', async () => {
    const onClick = vi.fn();
    render(<Button label="Enregistrer" disabled onClick={onClick} />);

    const button = screen.getByRole('button', { name: 'Enregistrer' });
    expect(button).toBeDisabled();

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
