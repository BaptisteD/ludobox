import { render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { PlayCelebrationProvider, usePlayCelebration } from './PlayCelebration';

function Consumer({
  gameId,
  testId = 'out',
}: {
  gameId: string;
  testId?: string;
}) {
  const { consume } = usePlayCelebration();
  const [text, setText] = useState('none');
  useEffect(() => {
    const c = consume(gameId);
    setText(c ? `${c.holderName}:${c.score}` : 'none');
  }, [consume, gameId]);
  return <span data-testid={testId}>{text}</span>;
}

function Publisher({ gameId }: { gameId: string }) {
  const { publish } = usePlayCelebration();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    publish({ gameId, holderName: 'Camille', score: 142 });
    setReady(true);
  }, [publish, gameId]);
  return ready ? <Consumer gameId={gameId} /> : null;
}

describe('PlayCelebration', () => {
  it('consumes a matching celebration once, then clears it', () => {
    render(
      <PlayCelebrationProvider>
        <Publisher gameId="g1" />
      </PlayCelebrationProvider>,
    );
    expect(screen.getByTestId('out')).toHaveTextContent('Camille:142');
  });

  it('clears the celebration so a second consumer sees nothing', () => {
    function TwoConsumers() {
      const { publish } = usePlayCelebration();
      const [ready, setReady] = useState(false);
      useEffect(() => {
        publish({ gameId: 'g1', holderName: 'Camille', score: 142 });
        setReady(true);
      }, [publish]);
      return ready ? (
        <>
          <Consumer gameId="g1" testId="first" />
          <Consumer gameId="g1" testId="second" />
        </>
      ) : null;
    }
    render(
      <PlayCelebrationProvider>
        <TwoConsumers />
      </PlayCelebrationProvider>,
    );
    expect(screen.getByTestId('first')).toHaveTextContent('Camille:142');
    expect(screen.getByTestId('second')).toHaveTextContent('none');
  });

  it('does not consume a celebration for a different game', () => {
    render(
      <PlayCelebrationProvider>
        <Consumer gameId="other" />
      </PlayCelebrationProvider>,
    );
    expect(screen.getByTestId('out')).toHaveTextContent('none');
  });

  it('is a safe no-op without a provider', () => {
    render(<Consumer gameId="g1" />);
    expect(screen.getByTestId('out')).toHaveTextContent('none');
  });
});
