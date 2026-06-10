import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationProvider } from './NavigationProvider';
import { useNavigation } from './useNavigation';

beforeEach(() => {
  window.history.replaceState(null, '', '/');
});

/** A probe that pushes a detail and registers a blocking guard. */
function Probe({ onBlocked }: { onBlocked: () => void }) {
  const { push, pop, registerBackGuard, state } = useNavigation();
  const blocked = useRef(onBlocked);
  blocked.current = onBlocked;
  useEffect(() => {
    push({ kind: 'placeholder-detail', id: 'x', depth: 1 });
  }, [push]);
  useEffect(
    () =>
      registerBackGuard({
        shouldBlock: () => true,
        onBlocked: () => blocked.current(),
      }),
    [registerBackGuard],
  );
  return (
    <div>
      <span data-testid="depth">{state.stack.length}</span>
      <button type="button" onClick={pop}>
        back
      </button>
    </div>
  );
}

/** Pushes a detail, registers a blocking guard, but unregisters before leaving. */
function UnregisterProbe() {
  const { push, pop, registerBackGuard, state } = useNavigation();
  const unregister = useRef<(() => void) | null>(null);
  useEffect(() => {
    push({ kind: 'placeholder-detail', id: 'x', depth: 1 });
  }, [push]);
  useEffect(() => {
    unregister.current = registerBackGuard({
      shouldBlock: () => true,
      onBlocked: () => {},
    });
    return () => unregister.current?.();
  }, [registerBackGuard]);
  return (
    <div>
      <span data-testid="depth">{state.stack.length}</span>
      <button
        type="button"
        onClick={() => {
          unregister.current?.();
          pop();
        }}
      >
        leave
      </button>
    </div>
  );
}

describe('NavigationProvider back guard', () => {
  it('blocks a back when the guard vetoes, keeping the stack', async () => {
    const onBlocked = vi.fn();
    const user = userEvent.setup();
    render(
      <NavigationProvider>
        <Probe onBlocked={onBlocked} />
      </NavigationProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('depth')).toHaveTextContent('1'),
    );

    await user.click(screen.getByText('back'));

    await waitFor(() => expect(onBlocked).toHaveBeenCalled());
    expect(screen.getByTestId('depth')).toHaveTextContent('1');
  });

  it('blocks a raw hardware-back popstate (the Android/browser gesture)', async () => {
    const onBlocked = vi.fn();
    render(
      <NavigationProvider>
        <Probe onBlocked={onBlocked} />
      </NavigationProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('depth')).toHaveTextContent('1'),
    );

    // The hardware/browser back fires popstate directly (not via our pop()).
    window.dispatchEvent(new PopStateEvent('popstate'));

    await waitFor(() => expect(onBlocked).toHaveBeenCalled());
    expect(screen.getByTestId('depth')).toHaveTextContent('1');
  });

  it('allows the back once the guard is unregistered', async () => {
    const user = userEvent.setup();
    render(
      <NavigationProvider>
        <UnregisterProbe />
      </NavigationProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('depth')).toHaveTextContent('1'),
    );

    await user.click(screen.getByText('leave'));

    await waitFor(() =>
      expect(screen.getByTestId('depth')).toHaveTextContent('0'),
    );
  });
});
