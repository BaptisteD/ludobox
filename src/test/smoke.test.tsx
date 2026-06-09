import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '@/app/App';

/** Brique 0 smoke: the app shell mounts on the cream canvas. */
describe('App shell', () => {
  it('renders the 390px shell', () => {
    render(<App />);
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });
});
