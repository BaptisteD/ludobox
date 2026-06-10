# Brique 7 — Fiche partie Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the play-entry/edit form (create, edit, delete a competitive or cooperative play) with autocomplete + on-the-fly player creation, blocking validation, the unsaved-changes guard, delete/abandon sheets, and a record-celebration toast on return.

**Architecture:** Bottom-up. A pure domain selector judges "record broken?"; `playRepository` grows atomic `update` + on-the-fly player creation; a navigation back-guard chokepoint handles both in-app and hardware back; a small app-level celebration context hands the toast to the Fiche jeu. The form lives in `src/features/play-form/` as a pure draft reducer (`playDraft.ts`), an injectable-deps data layer (`playFormData.ts`), and a presentational container (`PlayForm.tsx`) composing existing Brique 2 kit components.

**Tech Stack:** React 19 + TypeScript, Vite, Dexie (IndexedDB), Vitest + @testing-library/react + fake-indexeddb (unit), Playwright (e2e). Import alias `@/` → `src/`. Test command `npm test` (Vitest `run`); e2e `npm run test:e2e`; lint `npm run lint`.

**Reference spec:** `docs/superpowers/specs/2026-06-10-brique-7-fiche-partie-design.md`, `dev-briefs/brique-7-fiche-partie.md`, `prd-fiche-partie-v1.md`, `DESIGN.md` (§Fiche partie components).

**Key decisions baked in:**
- Toast fires **iff a save makes the game's max score strictly exceed its previous max AND `origin === 'game'`** (create from the CTA, or edit reached from the game's own history). The `… l'emporte` fallback from DESIGN.md is **dropped in V1**. No toast for coop or for non-record saves.
- The unsaved-changes guard covers **both** the in-app Back button and the hardware/browser back, via one `popstate` chokepoint.

**Conventions to follow (from the codebase):**
- Repos are factories `createXRepository(db)` with a singleton default; unit tests build an isolated `new LudoboxDB(\`test-${crypto.randomUUID()}\`)` and `await db.delete()` in `afterEach`.
- Feature files are flat: `X.tsx` + `X.module.css` + co-located `X.test.tsx`, re-exported from a feature `index.ts` barrel.
- Domain validators are pure and return `ValidationResult`; repos call `assertValid(...)` and throw `DomainError`. UI maps `code` → French copy in a `*Messages.ts`.
- Stats are always computed at read time, never stored.
- RTL component tests wrap in `<NavigationProvider>` and reset DB via `await Promise.all(db.tables.map((t) => t.clear()))` in `beforeEach`/`afterEach`.

---

## Task 1: Domain selector `recordCelebration`

Pure judgment of "did this save break the record?" — delegated to the domain per the brief.

**Files:**
- Modify: `src/domain/stats.ts`
- Test: `src/domain/stats.test.ts` (append a `describe`)

- [ ] **Step 1: Write the failing test**

Append to `src/domain/stats.test.ts`. (Import `recordCelebration` by adding it to the existing import from `./stats`.)

```ts
describe('recordCelebration', () => {
  it('celebrates when the play introduces a strictly higher score', () => {
    expect(
      recordCelebration(
        [
          { name: 'Camille', score: 142 },
          { name: 'Léa', score: 118 },
        ],
        96,
      ),
    ).toEqual({ holderName: 'Camille', score: 142 });
  });

  it('returns null when no entered score beats the prior record', () => {
    expect(
      recordCelebration([{ name: 'Léa', score: 90 }], 142),
    ).toBeNull();
  });

  it('returns null on an equal score (strictly greater is required)', () => {
    expect(recordCelebration([{ name: 'Léa', score: 142 }], 142)).toBeNull();
  });

  it('celebrates the first record when there was none before (null prior)', () => {
    expect(
      recordCelebration([{ name: 'Sol', score: 0 }], null),
    ).toEqual({ holderName: 'Sol', score: 0 });
  });

  it('returns null when no participant entered a score', () => {
    expect(
      recordCelebration([{ name: 'Bo', score: null }], null),
    ).toBeNull();
  });

  it('breaks an in-play tie for the top score by name (fr, accent-insensitive)', () => {
    expect(
      recordCelebration(
        [
          { name: 'Élodie', score: 200 },
          { name: 'Adam', score: 200 },
        ],
        10,
      ),
    ).toEqual({ holderName: 'Adam', score: 200 });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/domain/stats.test.ts`
Expected: FAIL — `recordCelebration is not a function` / import error.

- [ ] **Step 3: Implement the selector**

Append to `src/domain/stats.ts`:

```ts
/** The celebrated record when a save beats it (competitive only). */
export interface RecordCelebration {
  holderName: string;
  score: number;
}

/**
 * Judges whether a just-saved competitive play breaks the game's record.
 * `priorRecordScore` is the highest score across every *other* play (and, on an
 * edit, the play's own previous scores) — so a beaten record is always held by
 * someone inside `savedParticipants`. Returns the new holder + score, or null
 * when no entered score strictly exceeds the prior record. Pure.
 */
export function recordCelebration(
  savedParticipants: { name: string; score: number | null }[],
  priorRecordScore: number | null,
): RecordCelebration | null {
  const scored = savedParticipants.filter(
    (p): p is { name: string; score: number } => p.score !== null,
  );
  if (scored.length === 0) return null;
  const thisMax = Math.max(...scored.map((p) => p.score));
  if (priorRecordScore !== null && thisMax <= priorRecordScore) return null;
  const holder = scored
    .filter((p) => p.score === thisMax)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }))[0];
  return { holderName: holder.name, score: thisMax };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/domain/stats.test.ts`
Expected: PASS (all `recordCelebration` cases green, existing cases unaffected).

- [ ] **Step 5: Commit**

```bash
git add src/domain/stats.ts src/domain/stats.test.ts
git commit -m "feat(domain): recordCelebration selector for the win toast"
```

---

## Task 2: `playRepository.create` accepts on-the-fly players

Let a participation reference a brand-new player by name; create that player inside the same transaction as the play (PRD §8.6.3 atomicity).

**Files:**
- Modify: `src/db/playRepository.ts`
- Test: `src/db/playRepository.test.ts` (append a `describe`; add a `players` repo to the harness)

- [ ] **Step 1: Write the failing test**

In `src/db/playRepository.test.ts`, add `createPlayerRepository` to the imports and to the `beforeEach` harness:

```ts
import { createPlayerRepository } from './playerRepository';
// ...
let players: ReturnType<typeof createPlayerRepository>;
beforeEach(() => {
  // ...existing...
  players = createPlayerRepository(db);
});
```

Append this `describe`:

```ts
describe('playRepository.create — on-the-fly players', () => {
  it('creates a named participant as an active player in the same write', async () => {
    const g = await competitiveGame();
    const play = await plays.create({
      gameId: g.id,
      participations: [{ name: 'Nina', isWinner: true, score: 12 }],
    });

    const all = await players.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ name: 'Nina', status: 'active' });
    const parts = await participations.listByPlay(play.id);
    expect(parts[0].playerId).toBe(all[0].id);
  });

  it('writes nothing — not even the new player — when the play is invalid', async () => {
    const g = await competitiveGame();
    await expect(
      plays.create({
        gameId: g.id,
        participations: [{ name: 'Nina', isWinner: false }],
      }),
    ).rejects.toMatchObject({ code: 'NO_WINNER' });
    expect(await players.getAll()).toHaveLength(0);
    expect(await plays.listByGame(g.id)).toHaveLength(0);
  });

  it('rejects a new name that duplicates an active player (writes nothing)', async () => {
    const g = await competitiveGame();
    await players.create({ name: 'Léa' });
    await expect(
      plays.create({
        gameId: g.id,
        participations: [{ name: 'lea', isWinner: true }],
      }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_PLAYER_NAME' });
    expect(await plays.listByGame(g.id)).toHaveLength(0);
  });

  it('still accepts existing playerId participations unchanged', async () => {
    const g = await competitiveGame();
    const play = await plays.create({
      gameId: g.id,
      participations: [{ playerId: 'fixed-id', isWinner: true, score: 3 }],
    });
    const parts = await participations.listByPlay(play.id);
    expect(parts[0].playerId).toBe('fixed-id');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/db/playRepository.test.ts`
Expected: FAIL — the `{ name: ... }` participation shape is rejected by the types / no player is created.

- [ ] **Step 3: Implement**

Edit `src/db/playRepository.ts`. Replace the imports and `NewParticipation`/`NewPlay`/`create` region with:

```ts
import { db as defaultDb, LudoboxDB } from './db';
import type { CoopResult, Participation, Play, Player } from '@/domain/types';
import {
  assertValid,
  checkPlayerNameAvailable,
  validatePlay,
  validatePlayerDraft,
} from '@/domain/validation';

/** An existing player participating. */
export interface NewParticipation {
  playerId: string;
  score?: number | null;
  isWinner?: boolean;
}

/** A brand-new active player, created inside the play's transaction (§8.6). */
export interface NewPlayerParticipation {
  name: string;
  score?: number | null;
  isWinner?: boolean;
}

export type DraftParticipation = NewParticipation | NewPlayerParticipation;

const isExisting = (p: DraftParticipation): p is NewParticipation =>
  'playerId' in p;

export interface NewPlay {
  gameId: string;
  playedAt?: Date;
  note?: string;
  coopResult?: CoopResult;
  participations: DraftParticipation[];
}

/** Note is stored only when non-empty after trimming (parallels the form). */
const cleanNote = (note?: string): string | undefined => {
  const t = (note ?? '').trim();
  return t.length ? t : undefined;
};

export function createPlayRepository(db: LudoboxDB = defaultDb) {
  async function create(input: NewPlay): Promise<Play> {
    const game = await db.games.get(input.gameId);
    if (!game) throw new Error(`Game ${input.gameId} not found.`);

    const coopResult =
      game.type === 'cooperative'
        ? (input.coopResult ?? 'success')
        : input.coopResult;

    const note = cleanNote(input.note);
    const playId = crypto.randomUUID();

    return db.transaction(
      'rw',
      db.games,
      db.players,
      db.plays,
      db.participations,
      async () => {
        const newPlayers = await resolveNewPlayers(db, input.participations);
        const resolved = input.participations.map((p, i) => ({
          playerId: isExisting(p) ? p.playerId : newPlayers[i]!.id,
          score: p.score ?? null,
          isWinner: p.isWinner ?? false,
        }));

        assertValid(
          validatePlay({ gameType: game.type, coopResult, participations: resolved }),
        );

        const play: Play = {
          id: playId,
          gameId: input.gameId,
          playedAt: input.playedAt ?? new Date(),
          createdAt: new Date(),
          ...(note !== undefined ? { note } : {}),
          ...(coopResult !== undefined ? { coopResult } : {}),
        };
        const rows: Participation[] = resolved.map((p) => ({
          id: crypto.randomUUID(),
          playId,
          ...p,
        }));

        await db.players.bulkAdd(newPlayers.filter((p): p is Player => p !== null));
        await db.plays.add(play);
        await db.participations.bulkAdd(rows);
        return play;
      },
    );
  }
```

Add this helper **above** `createPlayRepository` (module scope):

```ts
/**
 * For each draft participation that names a new player, build the Player row
 * (validated + unique among active players, including names earlier in the same
 * batch). Returns an array aligned by index: null where the participation refers
 * to an existing playerId. Runs inside the caller's transaction.
 */
async function resolveNewPlayers(
  db: LudoboxDB,
  participations: DraftParticipation[],
): Promise<(Player | null)[]> {
  const existingPlayers = await db.players.toArray();
  const created: Player[] = [];
  return participations.map((p) => {
    if (isExisting(p)) return null;
    const name = p.name.trim();
    assertValid(validatePlayerDraft(name));
    assertValid(checkPlayerNameAvailable(name, [...existingPlayers, ...created]));
    const player: Player = { id: crypto.randomUUID(), name, status: 'active' };
    created.push(player);
    return player;
  });
}
```

> Note: `resolveNewPlayers` is `async` only to read `db.players` once; it throws synchronously on a duplicate, which rejects the transaction so nothing is written.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/db/playRepository.test.ts`
Expected: PASS (new `describe` green; the existing `create`/`countByGame`/`remove` suites still pass).

- [ ] **Step 5: Commit**

```bash
git add src/db/playRepository.ts src/db/playRepository.test.ts
git commit -m "feat(db): playRepository.create resolves on-the-fly players atomically"
```

---

## Task 3: `playRepository.update`

Atomic edit: validate, rebuild the play row (immutable `createdAt`/`gameId`), replace participations, create any on-the-fly players — all in one transaction.

**Files:**
- Modify: `src/db/playRepository.ts`
- Test: `src/db/playRepository.test.ts` (append a `describe`)

- [ ] **Step 1: Write the failing test**

Append to `src/db/playRepository.test.ts`:

```ts
describe('playRepository.update', () => {
  it('replaces participations and updates fields, preserving createdAt', async () => {
    const g = await competitiveGame();
    const play = await plays.create({
      gameId: g.id,
      playedAt: new Date('2026-01-01'),
      participations: [{ playerId: 'a', isWinner: true, score: 5 }],
    });

    const updated = await plays.update(play.id, {
      playedAt: new Date('2026-02-02'),
      note: 'corrigé',
      participations: [{ playerId: 'a', isWinner: true, score: 50 }],
    });

    expect(updated.createdAt.getTime()).toBe(play.createdAt.getTime());
    expect(updated.playedAt.toISOString()).toBe(new Date('2026-02-02').toISOString());
    expect(updated.note).toBe('corrigé');
    const parts = await participations.listByPlay(play.id);
    expect(parts).toHaveLength(1);
    expect(parts[0].score).toBe(50);
  });

  it('clears a note when the new note is empty', async () => {
    const g = await competitiveGame();
    const play = await plays.create({
      gameId: g.id,
      note: 'avant',
      participations: [{ playerId: 'a', isWinner: true }],
    });
    const updated = await plays.update(play.id, {
      note: '   ',
      participations: [{ playerId: 'a', isWinner: true }],
    });
    expect(updated.note).toBeUndefined();
  });

  it('creates on-the-fly players during an edit', async () => {
    const g = await competitiveGame();
    const play = await plays.create({
      gameId: g.id,
      participations: [{ playerId: 'a', isWinner: true }],
    });
    await plays.update(play.id, {
      participations: [
        { playerId: 'a', isWinner: false },
        { name: 'Zoé', isWinner: true },
      ],
    });
    const all = await players.getAll();
    expect(all.map((p) => p.name)).toContain('Zoé');
    expect(await participations.listByPlay(play.id)).toHaveLength(2);
  });

  it('rejects an invalid edit and leaves the play untouched', async () => {
    const g = await competitiveGame();
    const play = await plays.create({
      gameId: g.id,
      participations: [{ playerId: 'a', isWinner: true, score: 9 }],
    });
    await expect(
      plays.update(play.id, {
        participations: [{ playerId: 'a', isWinner: false }],
      }),
    ).rejects.toMatchObject({ code: 'NO_WINNER' });
    const parts = await participations.listByPlay(play.id);
    expect(parts[0].score).toBe(9);
  });

  it('throws for a missing play', async () => {
    await expect(
      plays.update('nope', { participations: [{ playerId: 'a', isWinner: true }] }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/db/playRepository.test.ts`
Expected: FAIL — `plays.update is not a function`.

- [ ] **Step 3: Implement**

In `src/db/playRepository.ts`, add the `UpdatePlay` interface near `NewPlay`:

```ts
export interface UpdatePlay {
  playedAt?: Date;
  note?: string;
  coopResult?: CoopResult;
  participations: DraftParticipation[];
}
```

Add the `update` function inside `createPlayRepository` (after `create`), and include it in the returned object:

```ts
  async function update(id: string, input: UpdatePlay): Promise<Play> {
    return db.transaction(
      'rw',
      db.games,
      db.players,
      db.plays,
      db.participations,
      async () => {
        const current = await db.plays.get(id);
        if (!current) throw new Error(`Play ${id} not found.`);
        const game = await db.games.get(current.gameId);
        if (!game) throw new Error(`Game ${current.gameId} not found.`);

        const coopResult =
          game.type === 'cooperative'
            ? (input.coopResult ?? 'success')
            : undefined;
        const note = cleanNote(input.note);

        const newPlayers = await resolveNewPlayers(db, input.participations);
        const resolved = input.participations.map((p, i) => ({
          playerId: isExisting(p) ? p.playerId : newPlayers[i]!.id,
          score: p.score ?? null,
          isWinner: p.isWinner ?? false,
        }));

        assertValid(
          validatePlay({ gameType: game.type, coopResult, participations: resolved }),
        );

        const play: Play = {
          id: current.id,
          gameId: current.gameId,
          createdAt: current.createdAt,
          playedAt: input.playedAt ?? current.playedAt,
          ...(note !== undefined ? { note } : {}),
          ...(coopResult !== undefined ? { coopResult } : {}),
        };
        const rows: Participation[] = resolved.map((p) => ({
          id: crypto.randomUUID(),
          playId: id,
          ...p,
        }));

        await db.players.bulkAdd(newPlayers.filter((p): p is Player => p !== null));
        await db.participations.where('playId').equals(id).delete();
        await db.plays.put(play);
        await db.participations.bulkAdd(rows);
        return play;
      },
    );
  }
```

Update the return statement:

```ts
  return { create, update, get, listByGame, countByGame, remove };
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/db/playRepository.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/playRepository.ts src/db/playRepository.test.ts
git commit -m "feat(db): atomic playRepository.update with participation replace"
```

---

## Task 4: Navigation — `play-form` Screen kind + back-guard chokepoint

Add the new detail screen kind and a single guard point in the provider's `popstate` handler so both the in-app Back and the hardware/browser back are intercepted.

**Files:**
- Modify: `src/app/navigation/types.ts`
- Modify: `src/app/navigation/NavigationContext.ts`
- Modify: `src/app/navigation/NavigationProvider.tsx`
- Test: `src/app/navigation/NavigationProvider.test.tsx` (new)

- [ ] **Step 1: Add the `play-form` Screen kind (types.ts)**

In `src/app/navigation/types.ts`, add above `export type Screen`:

```ts
/** Where a play-form was opened from — decides whether the win toast shows. */
export type PlayFormOrigin = 'game' | 'player';
```

Add these variants to the `Screen` union (after `game-form`):

```ts
  | {
      kind: 'play-form';
      mode: 'create';
      gameId: string;
      origin: PlayFormOrigin;
      id: string;
      depth: number;
    }
  | {
      kind: 'play-form';
      mode: 'edit';
      playId: string;
      origin: PlayFormOrigin;
      id: string;
      depth: number;
    }
```

- [ ] **Step 2: Extend the navigation API (NavigationContext.ts)**

In `src/app/navigation/NavigationContext.ts`, add above `NavigationApi`:

```ts
/** A guard the play-form registers to intercept back navigation while dirty. */
export interface BackGuard {
  /** True ⇒ block the back and call onBlocked instead of popping. */
  shouldBlock: () => boolean;
  onBlocked: () => void;
}
```

Add to the `NavigationApi` interface:

```ts
  /** Register a back guard. Returns an unregister fn. Only one guard at a time. */
  registerBackGuard: (guard: BackGuard) => () => void;
```

- [ ] **Step 3: Write the failing test (NavigationProvider.test.tsx)**

Create `src/app/navigation/NavigationProvider.test.tsx`:

```tsx
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
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test -- src/app/navigation/NavigationProvider.test.tsx`
Expected: FAIL — `registerBackGuard is not a function`.

- [ ] **Step 5: Implement the guard (NavigationProvider.tsx)**

In `src/app/navigation/NavigationProvider.tsx`:

Add to imports:
```ts
import type { BackGuard } from './NavigationContext';
```

Inside the component, after `depthRef`:
```ts
  const guardRef = useRef<BackGuard | null>(null);
```

Replace the `popstate` effect body so it consults the guard:
```ts
  useEffect(() => {
    window.history.replaceState(
      { navDepth: 0 } satisfies HistoryEntryState,
      '',
    );
    const onPopState = () => {
      const guard = guardRef.current;
      if (guard && guard.shouldBlock()) {
        // Cancel the back: re-anchor a history entry at the current depth.
        window.history.pushState(
          { navDepth: depthRef.current } satisfies HistoryEntryState,
          '',
        );
        guard.onBlocked();
        return;
      }
      dispatch({ type: 'POP' });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
```

Add the `registerBackGuard` callback before `const api`:
```ts
  const registerBackGuard = useCallback((guard: BackGuard) => {
    guardRef.current = guard;
    return () => {
      if (guardRef.current === guard) guardRef.current = null;
    };
  }, []);
```

Add it to the api:
```ts
  const api: NavigationApi = {
    state,
    push,
    pop,
    selectTab,
    resetToRoot,
    registerBackGuard,
  };
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- src/app/navigation/NavigationProvider.test.tsx`
Expected: PASS.

- [ ] **Step 7: Run the navigation suite for regressions**

Run: `npm test -- src/app/`
Expected: PASS (navReducer, AppShell, NavigationProvider).

- [ ] **Step 8: Commit**

```bash
git add src/app/navigation/types.ts src/app/navigation/NavigationContext.ts src/app/navigation/NavigationProvider.tsx src/app/navigation/NavigationProvider.test.tsx
git commit -m "feat(nav): play-form screen kind + back-guard chokepoint"
```

---

## Task 5: Play-celebration context

A tiny app-level channel: the form publishes a record celebration; the Fiche jeu consumes-and-clears it on mount. Default value is a no-op so components render without the provider (keeps existing tests green).

**Files:**
- Create: `src/app/PlayCelebration.tsx`
- Test: `src/app/PlayCelebration.test.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/app/PlayCelebration.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { PlayCelebrationProvider, usePlayCelebration } from './PlayCelebration';

function Consumer({ gameId }: { gameId: string }) {
  const { consume } = usePlayCelebration();
  const [text, setText] = useState('none');
  useEffect(() => {
    const c = consume(gameId);
    setText(c ? `${c.holderName}:${c.score}` : 'none');
  }, [consume, gameId]);
  return <span data-testid="out">{text}</span>;
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/app/PlayCelebration.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement**

Create `src/app/PlayCelebration.tsx`:

```tsx
/**
 * A transient hand-off for the record-celebration toast. The play-form publishes
 * a celebration on save (only when origin === 'game' and a record broke); the
 * Fiche jeu consumes-and-clears it on its next mount. Kept in a ref so publishing
 * never re-renders — the toast appears on the natural remount after the form pops.
 * The default context value is a no-op so screens render fine without the provider
 * (e.g. in isolated unit tests).
 */
import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react';

export interface PlayCelebration {
  gameId: string;
  holderName: string;
  score: number;
}

interface PlayCelebrationApi {
  publish: (celebration: PlayCelebration) => void;
  /** Returns and clears the pending celebration when it matches `gameId`. */
  consume: (gameId: string) => PlayCelebration | null;
}

const noop: PlayCelebrationApi = { publish: () => {}, consume: () => null };
const PlayCelebrationContext = createContext<PlayCelebrationApi>(noop);

export function PlayCelebrationProvider({ children }: { children: ReactNode }) {
  const pending = useRef<PlayCelebration | null>(null);
  const publish = useCallback((celebration: PlayCelebration) => {
    pending.current = celebration;
  }, []);
  const consume = useCallback((gameId: string) => {
    if (pending.current && pending.current.gameId === gameId) {
      const c = pending.current;
      pending.current = null;
      return c;
    }
    return null;
  }, []);
  return (
    <PlayCelebrationContext.Provider value={{ publish, consume }}>
      {children}
    </PlayCelebrationContext.Provider>
  );
}

export function usePlayCelebration(): PlayCelebrationApi {
  return useContext(PlayCelebrationContext);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/app/PlayCelebration.test.tsx`
Expected: PASS.

- [ ] **Step 5: Wire the provider into App.tsx**

Edit `src/app/App.tsx` — wrap `AppShell` with the provider:

```tsx
import { AppShell } from './AppShell';
import { NavigationProvider } from './navigation/NavigationProvider';
import { PlayCelebrationProvider } from './PlayCelebration';
import { Gallery } from '@/ui/gallery/Gallery';

export default function App() {
  if (window.location.hash === '#/ui-gallery') {
    return <Gallery />;
  }
  return (
    <NavigationProvider>
      <PlayCelebrationProvider>
        <AppShell />
      </PlayCelebrationProvider>
    </NavigationProvider>
  );
}
```

- [ ] **Step 6: Run the app suite for regressions**

Run: `npm test -- src/app/`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/PlayCelebration.tsx src/app/PlayCelebration.test.tsx src/app/App.tsx
git commit -m "feat(app): play-celebration hand-off context"
```

---

## Task 6: Feature core — `playDraft.ts` (pure reducer + selectors + date helpers)

The UI-free heart of the form (the "hook de form/validation extrait, testable sans UI" DoD item).

**Files:**
- Create: `src/features/play-form/playDraft.ts`
- Test: `src/features/play-form/playDraft.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/play-form/playDraft.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  emptyDraft,
  fromDateInputValue,
  isDirty,
  playDraftReducer,
  selectValidity,
  toDateInputValue,
  type DraftParticipant,
  type PlayDraftState,
} from './playDraft';

const participant = (over: Partial<DraftParticipant> = {}): DraftParticipant => ({
  key: 'k1',
  playerId: 'p1',
  name: 'Léa',
  color: 'teal',
  score: null,
  isWinner: false,
  ...over,
});

describe('playDraftReducer', () => {
  it('adds and removes participants by key', () => {
    let s = emptyDraft('competitive', new Date('2026-06-10'));
    s = playDraftReducer(s, { type: 'ADD_PARTICIPANT', participant: participant() });
    expect(s.participants).toHaveLength(1);
    s = playDraftReducer(s, { type: 'REMOVE_PARTICIPANT', key: 'k1' });
    expect(s.participants).toHaveLength(0);
  });

  it('sets score and toggles winner on the targeted participant only', () => {
    let s = emptyDraft('competitive', new Date('2026-06-10'));
    s = playDraftReducer(s, { type: 'ADD_PARTICIPANT', participant: participant() });
    s = playDraftReducer(s, {
      type: 'ADD_PARTICIPANT',
      participant: participant({ key: 'k2', playerId: 'p2', name: 'Tom' }),
    });
    s = playDraftReducer(s, { type: 'SET_SCORE', key: 'k2', score: 7 });
    s = playDraftReducer(s, { type: 'TOGGLE_WINNER', key: 'k2', on: true });
    expect(s.participants.find((p) => p.key === 'k1')).toMatchObject({ score: null, isWinner: false });
    expect(s.participants.find((p) => p.key === 'k2')).toMatchObject({ score: 7, isWinner: true });
  });

  it('sets the coop result and the note', () => {
    let s = emptyDraft('cooperative', new Date('2026-06-10'));
    s = playDraftReducer(s, { type: 'SET_COOP_RESULT', result: 'failure' });
    s = playDraftReducer(s, { type: 'SET_NOTE', note: 'serré' });
    expect(s.coopResult).toBe('failure');
    expect(s.note).toBe('serré');
  });

  it('replaces the whole state (used to seed an edit draft)', () => {
    const seeded: PlayDraftState = {
      gameType: 'cooperative',
      playedAt: new Date('2026-01-02'),
      note: 'x',
      coopResult: 'failure',
      participants: [participant()],
    };
    const out = playDraftReducer(emptyDraft('competitive', new Date('2026-06-10')), {
      type: 'REPLACE',
      state: seeded,
    });
    expect(out).toEqual(seeded);
  });
});

describe('selectValidity', () => {
  it('competitive: invalid with no participant, then no winner, then valid', () => {
    let s = emptyDraft('competitive', new Date('2026-06-10'));
    expect(selectValidity(s).ok).toBe(false); // NO_PARTICIPANTS
    s = playDraftReducer(s, { type: 'ADD_PARTICIPANT', participant: participant() });
    expect(selectValidity(s)).toMatchObject({ ok: false, code: 'NO_WINNER' });
    s = playDraftReducer(s, { type: 'TOGGLE_WINNER', key: 'k1', on: true });
    expect(selectValidity(s).ok).toBe(true);
  });

  it('cooperative: valid as soon as there is one participant', () => {
    let s = emptyDraft('cooperative', new Date('2026-06-10'));
    expect(selectValidity(s).ok).toBe(false);
    s = playDraftReducer(s, { type: 'ADD_PARTICIPANT', participant: participant() });
    expect(selectValidity(s).ok).toBe(true);
  });
});

describe('isDirty', () => {
  it('is false against an identical snapshot and true after any change', () => {
    const initial = emptyDraft('competitive', new Date('2026-06-10'));
    expect(isDirty(initial, initial)).toBe(false);
    const changed = playDraftReducer(initial, {
      type: 'ADD_PARTICIPANT',
      participant: participant(),
    });
    expect(isDirty(initial, changed)).toBe(true);
  });

  it('ignores participant order and same-day date edits', () => {
    const base = emptyDraft('competitive', new Date('2026-06-10T08:00:00'));
    const a = playDraftReducer(
      playDraftReducer(base, { type: 'ADD_PARTICIPANT', participant: participant({ key: 'k1', playerId: 'p1', name: 'A' }) }),
      { type: 'ADD_PARTICIPANT', participant: participant({ key: 'k2', playerId: 'p2', name: 'B' }) },
    );
    const b = playDraftReducer(
      playDraftReducer(
        playDraftReducer(base, { type: 'ADD_PARTICIPANT', participant: participant({ key: 'k2', playerId: 'p2', name: 'B' }) }),
        { type: 'ADD_PARTICIPANT', participant: participant({ key: 'k1', playerId: 'p1', name: 'A' }) },
      ),
      { type: 'SET_DATE', date: new Date('2026-06-10T22:00:00') },
    );
    expect(isDirty(a, b)).toBe(false);
  });
});

describe('date input helpers', () => {
  it('round-trips a local date through the yyyy-mm-dd input format', () => {
    const d = new Date(2026, 5, 7); // 7 June 2026, local
    expect(toDateInputValue(d)).toBe('2026-06-07');
    expect(toDateInputValue(fromDateInputValue('2026-06-07'))).toBe('2026-06-07');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/features/play-form/playDraft.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement**

Create `src/features/play-form/playDraft.ts`:

```ts
/**
 * Pure draft model for the Fiche partie — state, reducer, validity, dirtiness,
 * and date-input helpers. No React, no persistence: trivially unit-testable.
 * Competitive participants carry score/winner; cooperative ones leave them at
 * null/false and the play carries a collective result instead.
 */
import type { AvatarColor } from '@/ui';
import { validatePlay, type ValidationResult } from '@/domain/validation';
import type { CoopResult, GameType } from '@/domain/types';

export interface DraftParticipant {
  /** Stable local key for React lists and targeted updates. */
  key: string;
  /** null ⇒ a new player created on save (on-the-fly). */
  playerId: string | null;
  name: string;
  color: AvatarColor;
  /** Integer or null (not entered). Competitive only; always null for coop. */
  score: number | null;
  isWinner: boolean;
}

export interface PlayDraftState {
  gameType: GameType;
  playedAt: Date;
  note: string;
  /** Collective result (cooperative only); defaults to 'success'. */
  coopResult: CoopResult;
  participants: DraftParticipant[];
}

export type PlayDraftAction =
  | { type: 'SET_DATE'; date: Date }
  | { type: 'SET_NOTE'; note: string }
  | { type: 'SET_COOP_RESULT'; result: CoopResult }
  | { type: 'ADD_PARTICIPANT'; participant: DraftParticipant }
  | { type: 'REMOVE_PARTICIPANT'; key: string }
  | { type: 'SET_SCORE'; key: string; score: number | null }
  | { type: 'TOGGLE_WINNER'; key: string; on: boolean }
  | { type: 'REPLACE'; state: PlayDraftState };

export function emptyDraft(gameType: GameType, playedAt: Date): PlayDraftState {
  return { gameType, playedAt, note: '', coopResult: 'success', participants: [] };
}

const mapParticipant = (
  state: PlayDraftState,
  key: string,
  fn: (p: DraftParticipant) => DraftParticipant,
): PlayDraftState => ({
  ...state,
  participants: state.participants.map((p) => (p.key === key ? fn(p) : p)),
});

export function playDraftReducer(
  state: PlayDraftState,
  action: PlayDraftAction,
): PlayDraftState {
  switch (action.type) {
    case 'REPLACE':
      return action.state;
    case 'SET_DATE':
      return { ...state, playedAt: action.date };
    case 'SET_NOTE':
      return { ...state, note: action.note };
    case 'SET_COOP_RESULT':
      return { ...state, coopResult: action.result };
    case 'ADD_PARTICIPANT':
      return { ...state, participants: [...state.participants, action.participant] };
    case 'REMOVE_PARTICIPANT':
      return {
        ...state,
        participants: state.participants.filter((p) => p.key !== action.key),
      };
    case 'SET_SCORE':
      return mapParticipant(state, action.key, (p) => ({ ...p, score: action.score }));
    case 'TOGGLE_WINNER':
      return mapParticipant(state, action.key, (p) => ({ ...p, isWinner: action.on }));
    default:
      return state;
  }
}

/** Validity delegated to the domain (§8.1–8.3). */
export function selectValidity(state: PlayDraftState): ValidationResult {
  return validatePlay({
    gameType: state.gameType,
    coopResult: state.gameType === 'cooperative' ? state.coopResult : undefined,
    participations: state.participants.map((p) => ({
      score: p.score,
      isWinner: p.isWinner,
    })),
  });
}

/** A stable, order-insensitive projection for change detection. */
function serialize(state: PlayDraftState): string {
  const participants = state.participants
    .map((p) => ({
      who: p.playerId ?? `new:${p.name.trim().toLowerCase()}`,
      score: p.score,
      isWinner: p.isWinner,
    }))
    .sort((a, b) => a.who.localeCompare(b.who));
  return JSON.stringify({
    playedAt: toDateInputValue(state.playedAt),
    note: state.note.trim(),
    coopResult: state.gameType === 'cooperative' ? state.coopResult : null,
    participants,
  });
}

/** True when `current` differs from the snapshot taken at open (US9). */
export function isDirty(initial: PlayDraftState, current: PlayDraftState): boolean {
  return serialize(initial) !== serialize(current);
}

const pad = (n: number): string => String(n).padStart(2, '0');

/** Local Date → 'yyyy-mm-dd' for a native date input. */
export function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 'yyyy-mm-dd' → local Date at midnight (no UTC drift). */
export function fromDateInputValue(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/features/play-form/playDraft.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play-form/playDraft.ts src/features/play-form/playDraft.test.ts
git commit -m "feat(play-form): pure draft reducer, validity and dirty selectors"
```

---

## Task 7: Feature data — `playFormData.ts` (load + save)

Injectable-deps loader and saver, mirroring `gameData`/`playersData`. Computes the prior record before writing and returns the celebration.

**Files:**
- Create: `src/features/play-form/playFormData.ts`
- Test: `src/features/play-form/playFormData.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/play-form/playFormData.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LudoboxDB } from '@/db/db';
import { createGameRepository } from '@/db/gameRepository';
import { createParticipationRepository } from '@/db/participationRepository';
import { createPlayerRepository } from '@/db/playerRepository';
import { createPlayRepository } from '@/db/playRepository';
import { loadPlayForm, savePlay } from './playFormData';

let db: LudoboxDB;
let games: ReturnType<typeof createGameRepository>;
let players: ReturnType<typeof createPlayerRepository>;
let plays: ReturnType<typeof createPlayRepository>;
let participations: ReturnType<typeof createParticipationRepository>;

beforeEach(() => {
  db = new LudoboxDB(`test-${crypto.randomUUID()}`);
  games = createGameRepository(db);
  players = createPlayerRepository(db);
  plays = createPlayRepository(db);
  participations = createParticipationRepository(db);
});
afterEach(async () => {
  await db.delete();
});

const deps = () => ({ games, players, plays, participations });

describe('loadPlayForm — create', () => {
  it('returns the game, active players, and an empty draft dated today', async () => {
    const g = await games.create({ name: 'Catan', type: 'competitive' });
    await players.create({ name: 'Léa' });
    const loaded = await loadPlayForm({ mode: 'create', gameId: g.id }, deps());
    expect(loaded?.game.id).toBe(g.id);
    expect(loaded?.activePlayers.map((p) => p.name)).toEqual(['Léa']);
    expect(loaded?.initial.participants).toHaveLength(0);
    expect(loaded?.initial.gameType).toBe('competitive');
  });

  it('returns null for a missing game', async () => {
    expect(await loadPlayForm({ mode: 'create', gameId: 'nope' }, deps())).toBeNull();
  });
});

describe('loadPlayForm — edit', () => {
  it('pre-fills the draft from an existing play (archived kept by name)', async () => {
    const g = await games.create({ name: 'Catan', type: 'competitive' });
    const lea = await players.create({ name: 'Léa' });
    const ghost = await players.create({ name: 'Ghost' });
    const play = await plays.create({
      gameId: g.id,
      playedAt: new Date('2026-05-24'),
      note: 'belle',
      participations: [
        { playerId: lea.id, isWinner: true, score: 100 },
        { playerId: ghost.id, score: 80 },
      ],
    });
    await players.archive(ghost.id);

    const loaded = await loadPlayForm({ mode: 'edit', playId: play.id }, deps());
    expect(loaded?.initial.participants).toHaveLength(2);
    expect(loaded?.initial.note).toBe('belle');
    const ghostP = loaded?.initial.participants.find((p) => p.name === 'Ghost');
    expect(ghostP?.playerId).toBe(ghost.id);
    // Archived player is absent from the active autocomplete list.
    expect(loaded?.activePlayers.map((p) => p.name)).not.toContain('Ghost');
  });
});

describe('savePlay', () => {
  it('creates a competitive play and celebrates a new record', async () => {
    const g = await games.create({ name: 'Catan', type: 'competitive' });
    const lea = await players.create({ name: 'Léa' });
    const celebration = await savePlay(
      {
        gameType: 'competitive',
        playedAt: new Date('2026-06-10'),
        note: '',
        coopResult: 'success',
        participants: [
          { key: 'k', playerId: lea.id, name: 'Léa', color: 'teal', score: 142, isWinner: true },
        ],
      },
      { mode: 'create', gameId: g.id },
      deps(),
    );
    expect(celebration).toEqual({ holderName: 'Léa', score: 142 });
    expect(await plays.listByGame(g.id)).toHaveLength(1);
  });

  it('does not celebrate when the score does not beat the existing record', async () => {
    const g = await games.create({ name: 'Catan', type: 'competitive' });
    const lea = await players.create({ name: 'Léa' });
    await plays.create({
      gameId: g.id,
      participations: [{ playerId: lea.id, isWinner: true, score: 200 }],
    });
    const celebration = await savePlay(
      {
        gameType: 'competitive',
        playedAt: new Date('2026-06-10'),
        note: '',
        coopResult: 'success',
        participants: [
          { key: 'k', playerId: lea.id, name: 'Léa', color: 'teal', score: 50, isWinner: true },
        ],
      },
      { mode: 'create', gameId: g.id },
      deps(),
    );
    expect(celebration).toBeNull();
  });

  it('persists an on-the-fly player so it appears in the active list', async () => {
    const g = await games.create({ name: 'Catan', type: 'competitive' });
    await savePlay(
      {
        gameType: 'competitive',
        playedAt: new Date('2026-06-10'),
        note: '',
        coopResult: 'success',
        participants: [
          { key: 'k', playerId: null, name: 'Nina', color: 'coral', score: null, isWinner: true },
        ],
      },
      { mode: 'create', gameId: g.id },
      deps(),
    );
    expect((await players.getActive()).map((p) => p.name)).toContain('Nina');
  });

  it('saves a cooperative play with its result and never celebrates', async () => {
    const g = await games.create({ name: 'Pandémie', type: 'cooperative' });
    const lea = await players.create({ name: 'Léa' });
    const celebration = await savePlay(
      {
        gameType: 'cooperative',
        playedAt: new Date('2026-06-10'),
        note: '',
        coopResult: 'failure',
        participants: [
          { key: 'k', playerId: lea.id, name: 'Léa', color: 'teal', score: null, isWinner: false },
        ],
      },
      { mode: 'create', gameId: g.id },
      deps(),
    );
    expect(celebration).toBeNull();
    expect((await plays.listByGame(g.id))[0].coopResult).toBe('failure');
  });

  it('edits an existing play in place', async () => {
    const g = await games.create({ name: 'Catan', type: 'competitive' });
    const lea = await players.create({ name: 'Léa' });
    const play = await plays.create({
      gameId: g.id,
      participations: [{ playerId: lea.id, isWinner: true, score: 10 }],
    });
    await savePlay(
      {
        gameType: 'competitive',
        playedAt: new Date('2026-06-10'),
        note: '',
        coopResult: 'success',
        participants: [
          { key: 'k', playerId: lea.id, name: 'Léa', color: 'teal', score: 30, isWinner: true },
        ],
      },
      { mode: 'edit', gameId: g.id, playId: play.id },
      deps(),
    );
    const parts = await participations.listByPlay(play.id);
    expect(parts[0].score).toBe(30);
    expect(await plays.listByGame(g.id)).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/features/play-form/playFormData.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement**

Create `src/features/play-form/playFormData.ts`:

```ts
/**
 * Read/write model for the Fiche partie. `loadPlayForm` joins the repos into an
 * initial draft; `savePlay` reads the prior record (delegating to the domain
 * stat) before writing, then asks the domain whether the save broke it. Deps are
 * injectable (mirrors gameData/playersData) so the logic is testable on
 * fake-indexeddb without the UI.
 */
import { gameRepository } from '@/db/gameRepository';
import { participationRepository } from '@/db/participationRepository';
import { playerRepository } from '@/db/playerRepository';
import {
  playRepository,
  type DraftParticipation,
} from '@/db/playRepository';
import {
  competitiveGameStats,
  recordCelebration,
  type RecordCelebration,
} from '@/domain/stats';
import type { Game, Player } from '@/domain/types';
import { avatarColorForName } from '@/ui';
import { emptyDraft, type DraftParticipant, type PlayDraftState } from './playDraft';

export type PlayFormScreen =
  | { mode: 'create'; gameId: string }
  | { mode: 'edit'; playId: string };

export interface LoadedPlayForm {
  game: Game;
  activePlayers: Player[];
  initial: PlayDraftState;
}

export interface PlayFormDeps {
  games: Pick<typeof gameRepository, 'get'>;
  players: Pick<typeof playerRepository, 'getAll' | 'getActive'>;
  plays: Pick<typeof playRepository, 'get' | 'listByGame' | 'create' | 'update'>;
  participations: Pick<typeof participationRepository, 'listByPlay'>;
}

const defaultDeps: PlayFormDeps = {
  games: gameRepository,
  players: playerRepository,
  plays: playRepository,
  participations: participationRepository,
};

let keySeq = 0;
const nextKey = (): string => `p${keySeq++}`;

export async function loadPlayForm(
  screen: PlayFormScreen,
  deps: PlayFormDeps = defaultDeps,
): Promise<LoadedPlayForm | null> {
  if (screen.mode === 'create') {
    const game = await deps.games.get(screen.gameId);
    if (!game) return null;
    const activePlayers = await deps.players.getActive();
    return { game, activePlayers, initial: emptyDraft(game.type, new Date()) };
  }

  const play = await deps.plays.get(screen.playId);
  if (!play) return null;
  const game = await deps.games.get(play.gameId);
  if (!game) return null;
  const [parts, allPlayers, activePlayers] = await Promise.all([
    deps.participations.listByPlay(play.id),
    deps.players.getAll(),
    deps.players.getActive(),
  ]);
  const nameById = new Map(allPlayers.map((p) => [p.id, p.name]));

  const initial: PlayDraftState = {
    gameType: game.type,
    playedAt: play.playedAt,
    note: play.note ?? '',
    coopResult: play.coopResult ?? 'success',
    participants: parts.map((part): DraftParticipant => {
      const name = nameById.get(part.playerId) ?? '';
      return {
        key: nextKey(),
        playerId: part.playerId,
        name,
        color: avatarColorForName(name),
        score: part.score,
        isWinner: part.isWinner,
      };
    }),
  };
  return { game, activePlayers, initial };
}

export interface SavePlayContext {
  mode: 'create' | 'edit';
  gameId: string;
  playId?: string;
}

/** Persists the draft. Returns the record celebration when one was broken. */
export async function savePlay(
  state: PlayDraftState,
  ctx: SavePlayContext,
  deps: PlayFormDeps = defaultDeps,
): Promise<RecordCelebration | null> {
  const participations: DraftParticipation[] = state.participants.map((p) =>
    p.playerId === null
      ? { name: p.name.trim(), score: p.score, isWinner: p.isWinner }
      : { playerId: p.playerId, score: p.score, isWinner: p.isWinner },
  );

  const isCompetitive = state.gameType === 'competitive';

  // Read the prior record BEFORE writing (on edit this includes the play's old
  // scores), so a beaten record is detected correctly.
  let priorRecordScore: number | null = null;
  if (isCompetitive) {
    const game = await deps.games.get(ctx.gameId);
    const gamePlays = await deps.plays.listByGame(ctx.gameId);
    const allParts = (
      await Promise.all(gamePlays.map((pl) => deps.participations.listByPlay(pl.id)))
    ).flat();
    priorRecordScore = game
      ? (competitiveGameStats(game, gamePlays, allParts, []).record?.score ?? null)
      : null;
  }

  if (ctx.mode === 'create') {
    await deps.plays.create({
      gameId: ctx.gameId,
      playedAt: state.playedAt,
      note: state.note,
      ...(isCompetitive ? {} : { coopResult: state.coopResult }),
      participations,
    });
  } else {
    await deps.plays.update(ctx.playId!, {
      playedAt: state.playedAt,
      note: state.note,
      ...(isCompetitive ? {} : { coopResult: state.coopResult }),
      participations,
    });
  }

  if (!isCompetitive) return null;
  return recordCelebration(
    state.participants.map((p) => ({ name: p.name, score: p.score })),
    priorRecordScore,
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/features/play-form/playFormData.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play-form/playFormData.ts src/features/play-form/playFormData.test.ts
git commit -m "feat(play-form): load/save data layer with record-celebration"
```

---

## Task 8: Feature messages — `playFormMessages.ts`

Maps the domain validation codes that can surface from a save (chiefly the on-the-fly duplicate) to French copy. Mirrors `gameMessages`/`playerMessages`.

**Files:**
- Create: `src/features/play-form/playFormMessages.ts`
- Test: `src/features/play-form/playFormMessages.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/features/play-form/playFormMessages.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { playFormErrorMessage } from './playFormMessages';

describe('playFormErrorMessage', () => {
  it('maps the duplicate-player code to French', () => {
    expect(playFormErrorMessage('DUPLICATE_PLAYER_NAME')).toBe(
      'Un joueur actif porte déjà ce nom.',
    );
  });

  it('maps the no-winner and no-participant codes', () => {
    expect(playFormErrorMessage('NO_WINNER')).toBe(
      'Désigne le gagnant pour enregistrer la partie.',
    );
    expect(playFormErrorMessage('NO_PARTICIPANTS')).toBe(
      'Ajoute au moins un joueur.',
    );
  });

  it('falls back to a generic message for unexpected codes', () => {
    expect(playFormErrorMessage('INVALID_SCORE')).toBe(
      'Impossible d’enregistrer la partie.',
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/features/play-form/playFormMessages.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement**

Create `src/features/play-form/playFormMessages.ts`:

```ts
/** French copy for the validation codes that can surface from saving a play. */
import type { ValidationErrorCode } from '@/domain/validation';

const MESSAGES: Partial<Record<ValidationErrorCode, string>> = {
  DUPLICATE_PLAYER_NAME: 'Un joueur actif porte déjà ce nom.',
  EMPTY_PLAYER_NAME: 'Donne un nom au joueur.',
  NO_WINNER: 'Désigne le gagnant pour enregistrer la partie.',
  NO_PARTICIPANTS: 'Ajoute au moins un joueur.',
};

export function playFormErrorMessage(code: ValidationErrorCode): string {
  return MESSAGES[code] ?? 'Impossible d’enregistrer la partie.';
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/features/play-form/playFormMessages.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/play-form/playFormMessages.ts src/features/play-form/playFormMessages.test.ts
git commit -m "feat(play-form): French validation messages"
```

---

## Task 9: Feature component — `PlayForm.tsx` (+ CSS) + barrel + AppShell wiring

The presentational container. Composes the kit, drives the pure reducer via `useReducer`, wires autocomplete create-on-the-fly, the winner toggles / score inputs / coop segmented, the native date input, the note, the dormant/active Save, the delete sheet, and the dirty-aware abandon guard.

**Files:**
- Create: `src/features/play-form/PlayForm.tsx`
- Create: `src/features/play-form/PlayForm.module.css`
- Create: `src/features/play-form/index.ts`
- Modify: `src/app/AppShell.tsx`
- Test: `src/features/play-form/PlayForm.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/features/play-form/PlayForm.test.tsx`:

```tsx
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/db';
import { gameRepository } from '@/db/gameRepository';
import { playerRepository } from '@/db/playerRepository';
import { playRepository } from '@/db/playRepository';
import { participationRepository } from '@/db/participationRepository';
import { NavigationProvider } from '@/app/navigation/NavigationProvider';
import { PlayCelebrationProvider } from '@/app/PlayCelebration';
import type { Screen } from '@/app/navigation/types';
import { PlayForm } from './PlayForm';

beforeEach(async () => {
  window.history.replaceState(null, '', '/');
  await Promise.all(db.tables.map((t) => t.clear()));
});
afterEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

function renderForm(screenProp: Extract<Screen, { kind: 'play-form' }>) {
  return render(
    <NavigationProvider>
      <PlayCelebrationProvider>
        <PlayForm screen={screenProp} />
      </PlayCelebrationProvider>
    </NavigationProvider>,
  );
}

const createScreen = (gameId: string): Extract<Screen, { kind: 'play-form' }> => ({
  kind: 'play-form',
  mode: 'create',
  gameId,
  origin: 'game',
  id: gameId,
  depth: 2,
});

describe('PlayForm — competitive create', () => {
  it('keeps Save dormant with the hint until a winner is designated', async () => {
    const g = await gameRepository.create({ name: 'Catan', type: 'competitive' });
    await playerRepository.create({ name: 'Léa' });
    const user = userEvent.setup();
    renderForm(createScreen(g.id));

    await screen.findByText('Nouvelle partie');
    // Add Léa via the autocomplete.
    await user.type(screen.getByLabelText('Ajouter un joueur'), 'Lé');
    await user.click(await screen.findByRole('option', { name: /Léa/ }));

    const save = screen.getByRole('button', { name: 'Enregistrer la partie' });
    expect(save).toBeDisabled();
    expect(
      screen.getByText('Désigne le gagnant pour enregistrer la partie.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: /Léa a gagné/ }));
    expect(save).toBeEnabled();
  });

  it('persists the play with a score and winner', async () => {
    const g = await gameRepository.create({ name: 'Catan', type: 'competitive' });
    await playerRepository.create({ name: 'Léa' });
    const user = userEvent.setup();
    renderForm(createScreen(g.id));

    await screen.findByText('Nouvelle partie');
    await user.type(screen.getByLabelText('Ajouter un joueur'), 'Lé');
    await user.click(await screen.findByRole('option', { name: /Léa/ }));
    await user.type(screen.getByLabelText(/Score de Léa/), '142');
    await user.click(screen.getByRole('switch', { name: /Léa a gagné/ }));
    await user.click(screen.getByRole('button', { name: 'Enregistrer la partie' }));

    await waitFor(async () => {
      const all = await playRepository.listByGame(g.id);
      expect(all).toHaveLength(1);
    });
    const [play] = await playRepository.listByGame(g.id);
    const parts = await participationRepository.listByPlay(play.id);
    expect(parts[0]).toMatchObject({ score: 142, isWinner: true });
  });

  it('creates a player on the fly from the autocomplete', async () => {
    const g = await gameRepository.create({ name: 'Catan', type: 'competitive' });
    const user = userEvent.setup();
    renderForm(createScreen(g.id));

    await screen.findByText('Nouvelle partie');
    await user.type(screen.getByLabelText('Ajouter un joueur'), 'Nina');
    await user.click(await screen.findByRole('option', { name: /Créer .*Nina/ }));
    await user.click(screen.getByRole('switch', { name: /Nina a gagné/ }));
    await user.click(screen.getByRole('button', { name: 'Enregistrer la partie' }));

    await waitFor(async () =>
      expect((await playerRepository.getActive()).map((p) => p.name)).toContain('Nina'),
    );
  });
});

describe('PlayForm — cooperative create', () => {
  it('has no score/winner and Save is active with one participant', async () => {
    const g = await gameRepository.create({ name: 'Pandémie', type: 'cooperative' });
    await playerRepository.create({ name: 'Léa' });
    const user = userEvent.setup();
    renderForm(createScreen(g.id));

    await screen.findByText('Nouvelle partie');
    await user.type(screen.getByLabelText('Ajouter un joueur'), 'Lé');
    await user.click(await screen.findByRole('option', { name: /Léa/ }));

    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Résultat collectif' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enregistrer la partie' })).toBeEnabled();
  });
});

describe('PlayForm — edit', () => {
  it('pre-fills participants and persists a corrected score', async () => {
    const g = await gameRepository.create({ name: 'Catan', type: 'competitive' });
    const lea = await playerRepository.create({ name: 'Léa' });
    const play = await playRepository.create({
      gameId: g.id,
      participations: [{ playerId: lea.id, isWinner: true, score: 10 }],
    });
    const user = userEvent.setup();
    renderForm({ kind: 'play-form', mode: 'edit', playId: play.id, origin: 'game', id: play.id, depth: 2 });

    await screen.findByText('Modifier la partie');
    const score = await screen.findByLabelText(/Score de Léa/);
    await waitFor(() => expect(score).toHaveValue(10));
    await user.clear(score);
    await user.type(score, '55');
    await user.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    await waitFor(async () => {
      const parts = await participationRepository.listByPlay(play.id);
      expect(parts[0].score).toBe(55);
    });
  });
});

describe('PlayForm — abandon guard', () => {
  it('prompts on Back when there are unsaved changes', async () => {
    const g = await gameRepository.create({ name: 'Catan', type: 'competitive' });
    await playerRepository.create({ name: 'Léa' });
    const user = userEvent.setup();
    renderForm(createScreen(g.id));

    await screen.findByText('Nouvelle partie');
    await user.type(screen.getByLabelText('Ajouter un joueur'), 'Lé');
    await user.click(await screen.findByRole('option', { name: /Léa/ }));

    await user.click(screen.getByRole('button', { name: 'Retour' }));
    expect(
      await screen.findByRole('button', { name: 'Abandonner' }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/features/play-form/PlayForm.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the component**

Create `src/features/play-form/PlayForm.tsx`:

```tsx
/**
 * Fiche partie (Brique 7) — the one screen for logging and correcting a play,
 * competitive or cooperative. Always editable; the consultation and edition
 * states are the same screen. Composes the Brique 2 input kit; all state lives
 * in the pure `playDraft` reducer, all persistence in `playFormData`, and "record
 * broken?" in the domain. The back guard (in-app + hardware) is registered while
 * the draft is dirty so leaving with unsaved changes asks first (US9).
 */
import { useEffect, useReducer, useRef, useState } from 'react';
import {
  AddPlayerField,
  Autocomplete,
  Avatar,
  avatarColorForName,
  BottomSheet,
  Button,
  Check,
  Cross,
  InlineValidityHint,
  NoteField,
  OverflowMenu,
  SegmentedResult,
  Tag,
  Trash,
  Undo,
  WinnerToggle,
  type AutocompletePlayer,
  type CoopResult as SegmentedValue,
} from '@/ui';
import { Calendar } from '@/ui/icons';
import { DomainError } from '@/domain/validation';
import { normalizeName } from '@/domain/normalize';
import { playRepository } from '@/db/playRepository';
import { BackHeader } from '@/app/BackHeader';
import { useNavigation } from '@/app/navigation/useNavigation';
import { usePlayCelebration } from '@/app/PlayCelebration';
import type { Screen } from '@/app/navigation/types';
import {
  emptyDraft,
  fromDateInputValue,
  isDirty,
  playDraftReducer,
  selectValidity,
  toDateInputValue,
  type PlayDraftState,
} from './playDraft';
import {
  loadPlayForm,
  savePlay,
  type LoadedPlayForm,
  type PlayFormScreen,
} from './playFormData';
import { playFormErrorMessage } from './playFormMessages';
import styles from './PlayForm.module.css';

export interface PlayFormProps {
  screen: Extract<Screen, { kind: 'play-form' }>;
}

let keySeq = 0;
const nextKey = (): string => `f${keySeq++}`;

const toSegment = (r: 'success' | 'failure'): SegmentedValue =>
  r === 'success' ? 'succes' : 'echec';
const fromSegment = (v: SegmentedValue): 'success' | 'failure' =>
  v === 'succes' ? 'success' : 'failure';

export function PlayForm({ screen }: PlayFormProps) {
  const { pop, registerBackGuard } = useNavigation();
  const { publish } = usePlayCelebration();

  const [loaded, setLoaded] = useState<LoadedPlayForm | null | undefined>(undefined);
  const [draft, dispatch] = useReducer(
    playDraftReducer,
    emptyDraft('competitive', new Date()),
  );
  const [initial, setInitial] = useState<PlayDraftState | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [abandonOpen, setAbandonOpen] = useState(false);

  const isEdit = screen.mode === 'edit';
  const loadScreen: PlayFormScreen =
    screen.mode === 'create'
      ? { mode: 'create', gameId: screen.gameId }
      : { mode: 'edit', playId: screen.playId };

  // Live refs read by the back guard (which is registered once).
  const dirtyRef = useRef(false);
  const leavingRef = useRef(false);
  dirtyRef.current = Boolean(initial && isDirty(initial, draft));

  useEffect(() => {
    let active = true;
    void loadPlayForm(loadScreen).then((next) => {
      if (!active) return;
      setLoaded(next);
      if (next) {
        setInitial(next.initial);
        // Seed the reducer with the loaded draft (batched with setLoaded).
        dispatch({ type: 'REPLACE', state: next.initial });
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen.mode, screen.mode === 'edit' ? screen.playId : screen.gameId]);

  useEffect(
    () =>
      registerBackGuard({
        shouldBlock: () => dirtyRef.current && !leavingRef.current,
        onBlocked: () => setAbandonOpen(true),
      }),
    [registerBackGuard],
  );

  function leave() {
    leavingRef.current = true;
    pop();
  }

  if (loaded === null) {
    return (
      <div className={styles.form} data-testid="play-form">
        <BackHeader title="" onBack={pop} />
        <p className={styles.unavailable}>Cette partie n’est plus disponible.</p>
      </div>
    );
  }
  if (!loaded) {
    return (
      <div className={styles.form} data-testid="play-form">
        <BackHeader title="" onBack={pop} />
      </div>
    );
  }

  const competitive = draft.gameType === 'competitive';
  const validity = selectValidity(draft);
  const showWinnerHint = competitive && validity.ok === false && validity.code === 'NO_WINNER';

  const addedIds = new Set(draft.participants.map((p) => p.playerId).filter(Boolean));
  const addedNames = new Set(draft.participants.map((p) => normalizeName(p.name)));
  const candidates: AutocompletePlayer[] = loaded.activePlayers
    .filter((p) => !addedIds.has(p.id))
    .map((p) => ({ id: p.id, name: p.name, color: avatarColorForName(p.name) }));
  const trimmedQuery = query.trim();
  const activeMatch = loaded.activePlayers.some(
    (p) => normalizeName(p.name) === normalizeName(trimmedQuery),
  );
  const canCreate =
    trimmedQuery.length > 0 && !activeMatch && !addedNames.has(normalizeName(trimmedQuery));

  function addExisting(player: AutocompletePlayer) {
    dispatch({
      type: 'ADD_PARTICIPANT',
      participant: {
        key: nextKey(),
        playerId: player.id,
        name: player.name,
        color: player.color ?? avatarColorForName(player.name),
        score: null,
        isWinner: false,
      },
    });
    setQuery('');
  }

  function addNew(name: string) {
    const clean = name.trim();
    dispatch({
      type: 'ADD_PARTICIPANT',
      participant: {
        key: nextKey(),
        playerId: null,
        name: clean,
        color: avatarColorForName(clean),
        score: null,
        isWinner: false,
      },
    });
    setQuery('');
  }

  async function handleSave() {
    setError(null);
    try {
      const celebration = await savePlay(draft, {
        mode: screen.mode,
        gameId: loaded!.game.id,
        ...(isEdit ? { playId: screen.playId } : {}),
      });
      if (celebration && screen.origin === 'game') {
        publish({
          gameId: loaded!.game.id,
          holderName: celebration.holderName,
          score: celebration.score,
        });
      }
      leave();
    } catch (e) {
      if (e instanceof DomainError) setError(playFormErrorMessage(e.code));
      else throw e;
    }
  }

  async function handleDelete() {
    if (!isEdit) return;
    await playRepository.remove(screen.playId);
    leave();
  }

  const overline = isEdit ? 'Modifier la partie' : 'Nouvelle partie';
  const saveLabel = isEdit ? 'Enregistrer les modifications' : 'Enregistrer la partie';

  return (
    <div className={styles.form} data-testid="play-form">
      <div className={styles.header}>
        <BackHeader title="" onBack={() => (dirtyRef.current ? setAbandonOpen(true) : pop())} />
        {isEdit ? (
          <>
            <button
              type="button"
              className={styles.options}
              aria-label="Options de la partie"
              aria-haspopup="menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span aria-hidden="true">⋮</span>
            </button>
            {menuOpen ? (
              <OverflowMenu
                className={styles.menu}
                items={[
                  {
                    label: 'Supprimer la partie',
                    icon: <Trash />,
                    tone: 'destructive',
                    onSelect: () => {
                      setMenuOpen(false);
                      setDeleteOpen(true);
                    },
                  },
                ]}
              />
            ) : null}
          </>
        ) : null}
      </div>

      <div className={styles.body}>
        <div className={styles.context}>
          <span className={styles.overline}>{overline}</span>
          <h1 className={styles.gameTitle}>{loaded.game.name}</h1>
          <Tag type={competitive ? 'competitif' : 'cooperatif'} />
        </div>

        <section className={styles.section}>
          <span className={styles.label}>Date</span>
          <div className={styles.dateField}>
            <Calendar size={20} aria-hidden="true" />
            <input
              type="date"
              aria-label="Date"
              className={styles.dateInput}
              value={toDateInputValue(draft.playedAt)}
              onChange={(e) =>
                e.target.value &&
                dispatch({ type: 'SET_DATE', date: fromDateInputValue(e.target.value) })
              }
            />
          </div>
        </section>

        <section className={styles.section}>
          <span className={styles.label}>Joueurs</span>
          {competitive ? (
            <p className={styles.helper}>
              Touche le trophée pour désigner le gagnant. Le score est facultatif.
            </p>
          ) : null}

          <ul className={styles.participants}>
            {draft.participants.map((p) => (
              <li key={p.key} className={styles.participant}>
                <Avatar name={p.name} color={p.color} size={38} />
                <span className={styles.participantName}>{p.name}</span>
                {competitive ? (
                  <>
                    <input
                      type="text"
                      inputMode="numeric"
                      aria-label={`Score de ${p.name}`}
                      className={styles.score}
                      value={p.score === null ? '' : String(p.score)}
                      onChange={(e) =>
                        dispatch({ type: 'SET_SCORE', key: p.key, score: parseScore(e.target.value) })
                      }
                    />
                    <WinnerToggle
                      on={p.isWinner}
                      onChange={(on) => dispatch({ type: 'TOGGLE_WINNER', key: p.key, on })}
                      label={`${p.name} a gagné`}
                    />
                  </>
                ) : null}
                <button
                  type="button"
                  className={styles.remove}
                  aria-label={`Retirer ${p.name}`}
                  onClick={() => dispatch({ type: 'REMOVE_PARTICIPANT', key: p.key })}
                >
                  <Cross size={18} />
                </button>
              </li>
            ))}
          </ul>

          <div className={styles.addPlayer}>
            <AddPlayerField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {trimmedQuery.length > 0 ? (
              <Autocomplete
                query={query}
                players={candidates}
                onSelect={addExisting}
                onCreate={canCreate ? addNew : undefined}
              />
            ) : null}
          </div>
        </section>

        {competitive ? null : (
          <section className={styles.section}>
            <span className={styles.label}>Résultat collectif</span>
            <SegmentedResult
              value={toSegment(draft.coopResult)}
              onChange={(v) => dispatch({ type: 'SET_COOP_RESULT', result: fromSegment(v) })}
            />
          </section>
        )}

        <section className={styles.section}>
          <span className={styles.label}>
            Note <span className={styles.optional}>facultatif</span>
          </span>
          <NoteField
            label="Note"
            placeholder="Une note sur la partie…"
            value={draft.note}
            onChange={(e) => dispatch({ type: 'SET_NOTE', note: e.target.value })}
          />
        </section>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {showWinnerHint ? <InlineValidityHint /> : null}

        <div className={styles.cta}>
          <Button
            label={saveLabel}
            icon={<Check />}
            disabled={!validity.ok}
            onClick={handleSave}
          />
        </div>
      </div>

      <BottomSheet
        open={deleteOpen}
        icon={<Trash />}
        title="Supprimer cette partie ?"
        body="La partie et ses participations seront définitivement supprimées."
        actionLabel="Supprimer la partie"
        onAction={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
      <BottomSheet
        open={abandonOpen}
        icon={<Undo />}
        title="Abandonner les modifications ?"
        body="Les changements non enregistrés seront perdus."
        actionLabel="Abandonner"
        cancelLabel="Continuer la saisie"
        onAction={() => {
          setAbandonOpen(false);
          leave();
        }}
        onCancel={() => setAbandonOpen(false)}
      />
    </div>
  );
}

/** '' or junk → null; otherwise the integer (sign allowed, decimals dropped). */
function parseScore(value: string): number | null {
  const t = value.trim();
  if (t === '' || t === '-') return null;
  const n = Number.parseInt(t, 10);
  return Number.isNaN(n) ? null : n;
}
```

> **Implementation note on seeding the reducer:** `useReducer` is initialized with a throwaway `emptyDraft` and then seeded with the loaded draft via the `REPLACE` action (added in Task 6) inside the load effect. `setLoaded(next)` and the `REPLACE` dispatch are batched (React 19 batches in promises too), so the body first renders with the correct state — there is no flash of the placeholder because the body is gated behind `if (!loaded)`. The `initial` snapshot (`useState`) feeds `isDirty` for the back guard.

- [ ] **Step 4: Create the stylesheet**

Create `src/features/play-form/PlayForm.module.css` (layout only; the kit carries the component look — flat 2px-outline inputs, the CTA signature):

```css
.form {
  min-height: 100%;
  background: var(--bg-cream);
}

.header {
  position: relative;
}

.options {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  color: var(--ink-primary);
  font-size: 22px;
  cursor: pointer;
}

.menu {
  position: absolute;
  top: 56px;
  right: 12px;
  z-index: 10;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 8px 20px 40px;
}

.context {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.overline {
  font-family: var(--font-text);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 12px;
  color: var(--ink-muted);
}

.gameTitle {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 27px;
  line-height: 1.05;
  letter-spacing: -0.01em;
  color: var(--ink-primary);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.label {
  font-family: var(--font-text);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 12px;
  color: var(--ink-muted);
}

.optional {
  text-transform: none;
  letter-spacing: 0;
  color: var(--ink-faint);
  font-weight: 700;
}

.helper {
  margin: 0;
  font-family: var(--font-text);
  font-weight: 500;
  font-size: 14px;
  color: var(--ink-muted);
}

.dateField {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface-white);
  border: 2px solid var(--ink-primary);
  border-radius: 14px;
  padding: 0 14px;
  height: 52px;
  color: var(--ink-primary);
}

.dateInput {
  flex: 1;
  border: none;
  background: transparent;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 17px;
  color: var(--ink-primary);
}

.dateInput:focus {
  outline: none;
}

.participants {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.participant {
  display: flex;
  align-items: center;
  gap: 12px;
}

.participantName {
  flex: 1;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 17px;
  color: var(--ink-primary);
}

.score {
  flex-shrink: 0;
  width: 60px;
  height: 38px;
  text-align: center;
  background: var(--surface-white);
  border: 2px solid var(--ink-primary);
  border-radius: 12px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 16px;
  color: var(--ink-primary);
}

.score:focus {
  outline: none;
}

.remove {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  color: var(--ink-faint);
  cursor: pointer;
}

.addPlayer {
  position: relative;
}

.error {
  margin: 0;
  font-family: var(--font-text);
  font-weight: 700;
  font-size: 14px;
  color: var(--coral);
}

.cta {
  margin-top: 8px;
}

.unavailable {
  padding: 40px 20px;
  text-align: center;
  font-family: var(--font-text);
  color: var(--ink-muted);
}
```

> If any `var(--token)` name above is not present in `src/styles/tokens.css`, open that file and use the exact token names defined there (e.g. the cream/ink/coral/white tokens already used by `GameForm.module.css` and `GameDetail.module.css`). Do not invent new tokens.

- [ ] **Step 5: Create the barrel**

Create `src/features/play-form/index.ts`:

```ts
export { PlayForm, type PlayFormProps } from './PlayForm';
```

- [ ] **Step 6: Wire AppShell**

Edit `src/app/AppShell.tsx`:

Add the import:
```ts
import { PlayForm } from '@/features/play-form';
```

Add the case in `renderDetail`:
```ts
    case 'play-form':
      return <PlayForm screen={screen} />;
```

- [ ] **Step 7: Run the component test to verify it passes**

Run: `npm test -- src/features/play-form/PlayForm.test.tsx`
Expected: PASS (all cases). If the autocomplete option name regex doesn't match, inspect the rendered option text with `screen.debug()` and align the regex — do not change component behavior to fit a typo.

- [ ] **Step 8: Run the whole unit suite**

Run: `npm test`
Expected: PASS (all prior suites still green; AppShell now compiles with the new case).

- [ ] **Step 9: Commit**

```bash
git add src/features/play-form/PlayForm.tsx src/features/play-form/PlayForm.module.css src/features/play-form/index.ts src/features/play-form/PlayForm.test.tsx src/app/AppShell.tsx
git commit -m "feat(play-form): PlayForm container + AppShell wiring"
```

---

## Task 10: Wire entry points — Fiche jeu CTA, history taps, and the toast

Make the inert CTA open the create form, make history rows open the edit form (Fiche jeu + Fiche joueur), and render the celebration toast on the Fiche jeu.

**Files:**
- Modify: `src/features/game/GameDetail.tsx`
- Modify: `src/features/players/PlayerDetail.tsx`
- Test: `src/features/game/GameDetail.test.tsx` (append)
- Test: `src/app/AppShell.test.tsx` (append a play-form journey)

- [ ] **Step 1: Open the create form from the CTA (GameDetail)**

In `src/features/game/GameDetail.tsx`, replace the inert `addPlay`:

```ts
  function addPlay() {
    push({
      kind: 'play-form',
      mode: 'create',
      gameId,
      origin: 'game',
      id: gameId,
      depth: 2,
    });
  }
```

- [ ] **Step 2: Make Fiche jeu history rows tappable**

Still in `GameDetail.tsx`, in the history `map`, add an `onClick` to `HistoryRow`:

```tsx
                    <li key={entry.playId}>
                      <HistoryRow
                        day={day}
                        month={month}
                        {...row}
                        onClick={() =>
                          push({
                            kind: 'play-form',
                            mode: 'edit',
                            playId: entry.playId,
                            origin: 'game',
                            id: entry.playId,
                            depth: 2,
                          })
                        }
                      />
                    </li>
```

- [ ] **Step 3: Consume + show the celebration toast (GameDetail)**

Add the imports:
```ts
import { Toast } from '@/ui';
import { avatarColorForName } from '@/ui';
import { usePlayCelebration, type PlayCelebration } from '@/app/PlayCelebration';
```
(`avatarColorForName` is already imported — keep one import.)

Add state + consume in the component, near the other hooks:
```ts
  const { consume } = usePlayCelebration();
  const [celebration, setCelebration] = useState<PlayCelebration | null>(null);
```

Inside the existing load `useEffect`, after `setSheet(next)` resolves (or as a sibling effect keyed on `gameId`), consume once on mount:
```ts
  useEffect(() => {
    const c = consume(gameId);
    if (c) setCelebration(c);
  }, [consume, gameId]);
```

Render the toast (just before the closing `</div>` of `styles.detail`, after the delete `BottomSheet`):
```tsx
      {celebration ? (
        <Toast
          name={celebration.holderName}
          avatarColor={avatarColorForName(celebration.holderName)}
          headline={`Nouveau record, ${celebration.holderName}`}
          subline={`Partie enregistrée · ${celebration.score} pts`}
          className={styles.toast}
        />
      ) : null}
```

Add a `.toast` rule to `src/features/game/GameDetail.module.css` (position it at the bottom of the fold):
```css
.toast {
  position: fixed;
  left: 20px;
  right: 20px;
  bottom: 24px;
  z-index: 20;
}
```

- [ ] **Step 4: Make Fiche joueur history rows tappable (PlayerDetail)**

In `src/features/players/PlayerDetail.tsx`, the `HistoryRow` in the history `map` gets an `onClick` opening the edit form with `origin: 'player'`:

```tsx
                  <li key={entry.playId}>
                    <HistoryRow
                      day={day}
                      month={month}
                      title={entry.gameName}
                      meta={isComp ? 'Compétitif' : 'Coopératif'}
                      result={resultOf(entry)}
                      trophy={isComp && entry.isWinner}
                      score={
                        isComp ? (entry.score === null ? 'unset' : entry.score) : undefined
                      }
                      onClick={() =>
                        push({
                          kind: 'play-form',
                          mode: 'edit',
                          playId: entry.playId,
                          origin: 'player',
                          id: entry.playId,
                          depth: 2,
                        })
                      }
                    />
                  </li>
```

Add `push` to the `useNavigation()` destructure in `PlayerDetail` (currently `{ pop, resetToRoot }`):
```ts
  const { push, pop, resetToRoot } = useNavigation();
```

- [ ] **Step 5: Write the GameDetail toast test**

Append to `src/features/game/GameDetail.test.tsx` (mirror its existing imports/harness; add `PlayCelebrationProvider` and `usePlayCelebration`). If the file has no render harness with providers yet, add one:

```tsx
import { useEffect, useState } from 'react';
import { PlayCelebrationProvider, usePlayCelebration } from '@/app/PlayCelebration';

describe('GameDetail — celebration toast', () => {
  it('shows the record toast when a celebration is pending for the game', async () => {
    const g = await gameRepository.create({ name: 'Catan', type: 'competitive' });
    const lea = await playerRepository.create({ name: 'Léa' });
    await playRepository.create({
      gameId: g.id,
      participations: [{ playerId: lea.id, isWinner: true, score: 142 }],
    });

    function Harness() {
      const { publish } = usePlayCelebration();
      const [ready, setReady] = useState(false);
      useEffect(() => {
        publish({ gameId: g.id, holderName: 'Léa', score: 142 });
        setReady(true);
      }, [publish]);
      return ready ? <GameDetail gameId={g.id} /> : null;
    }

    render(
      <NavigationProvider>
        <PlayCelebrationProvider>
          <Harness />
        </PlayCelebrationProvider>
      </NavigationProvider>,
    );

    expect(await screen.findByText('Nouveau record, Léa')).toBeInTheDocument();
    expect(screen.getByText(/142 pts/)).toBeInTheDocument();
  });
});
```

(Ensure `gameRepository`, `playerRepository`, `playRepository`, `NavigationProvider`, `render`, `screen` are imported as the existing tests in this file already do.)

- [ ] **Step 6: Write the AppShell end-to-end-ish journey test**

Append to `src/app/AppShell.test.tsx`:

```tsx
describe('AppShell — play-form journey', () => {
  it('logs a competitive play from the CTA and returns with updated history', async () => {
    await gameRepository.create({ name: 'Catan', type: 'competitive' });
    await playerRepository.create({ name: 'Léa' });
    const user = userEvent.setup();
    renderShell();

    await user.click(await screen.findByRole('button', { name: 'Catan, 0 partie' }));
    await user.click(screen.getByRole('button', { name: /ajouter une partie/i }));

    await screen.findByText('Nouvelle partie');
    await user.type(screen.getByLabelText('Ajouter un joueur'), 'Lé');
    await user.click(await screen.findByRole('option', { name: /Léa/ }));
    await user.type(screen.getByLabelText(/Score de Léa/), '99');
    await user.click(screen.getByRole('switch', { name: /Léa a gagné/ }));
    await user.click(screen.getByRole('button', { name: 'Enregistrer la partie' }));

    // Back on the fiche, history shows the new play.
    expect(await screen.findByText('Nouveau record, Léa')).toBeInTheDocument();
    expect(screen.getByTestId('history')).toHaveTextContent('Léa');
  });
});
```

- [ ] **Step 7: Run the affected suites**

Run: `npm test -- src/features/game/ src/features/players/ src/app/`
Expected: PASS.

- [ ] **Step 8: Run the whole unit suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/features/game/GameDetail.tsx src/features/game/GameDetail.module.css src/features/game/GameDetail.test.tsx src/features/players/PlayerDetail.tsx src/app/AppShell.test.tsx
git commit -m "feat(play-form): wire CTA, history taps, and the record toast"
```

---

## Task 11: Refresh the dev `__ludobox` seam comment (main.tsx)

The seam stays (it seeds E2E fixtures for edit/delete scenarios); only its now-stale comment changes.

**Files:**
- Modify: `src/main.tsx`

- [ ] **Step 1: Update the comment**

In `src/main.tsx`, replace the comment inside the `if (import.meta.env.DEV)` block:

```ts
  // Test seam for Playwright fixtures: the e2e specs seed games/players/plays
  // straight through the repos to set up read screens and edit/delete scenarios.
  // Dev-only, so the production bundle never carries it.
```

- [ ] **Step 2: Verify the app still builds**

Run: `npm run build`
Expected: PASS (`tsc -b` clean, vite build succeeds).

- [ ] **Step 3: Commit**

```bash
git add src/main.tsx
git commit -m "chore: refresh the dev repo-seam comment for Brique 7"
```

---

## Task 12: E2E — the recette journey (`e2e/play-form.spec.ts`)

The key acceptance journey plus on-the-fly creation, mirroring the `game-sheet.spec.ts` helpers (`ready`, `seed`, `openGame`).

**Files:**
- Create: `e2e/play-form.spec.ts`

- [ ] **Step 1: Write the spec**

Create `e2e/play-form.spec.ts`:

```ts
import { expect, test, type Page } from '@playwright/test';

/**
 * Brique 7 — Fiche partie E2E. The competitive recette journey end to end, plus
 * on-the-fly player creation. Games/players are seeded through the dev-only
 * `window.__ludobox` seam (see main.tsx); the play itself is logged through the
 * real form. Each test starts from a fresh, isolated context (empty IndexedDB).
 */

async function ready(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => '__ludobox' in window);
}

async function seed(page: Page, fn: string): Promise<void> {
  await page.evaluate(async (src) => {
    // eslint-disable-next-line no-new-func
    const run = new Function(`return (${src})(window.__ludobox)`);
    await run();
  }, fn);
  await page.reload();
}

async function openGame(page: Page, name: RegExp) {
  await page.getByRole('button', { name }).click();
  await expect(page.getByTestId('game-detail')).toBeVisible();
}

test('competitive: log a play from the CTA → toast + updated stats/history', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository, playerRepository }) => {
      await gameRepository.create({ name: 'Catan', type: 'competitive' });
      await playerRepository.create({ name: 'Camille' });
      await playerRepository.create({ name: 'Léa' });
    }`,
  );

  await openGame(page, /^Catan/);
  await page.getByRole('button', { name: /ajouter une partie/i }).click();
  await expect(page.getByText('Nouvelle partie')).toBeVisible();

  // Add Camille and Léa via the autocomplete.
  await page.getByLabel('Ajouter un joueur').fill('Cam');
  await page.getByRole('option', { name: /Camille/ }).click();
  await page.getByLabel('Ajouter un joueur').fill('Lé');
  await page.getByRole('option', { name: /Léa/ }).click();

  // Scores + a winner.
  await page.getByLabel('Score de Camille').fill('142');
  await page.getByLabel('Score de Léa').fill('118');
  await page.getByRole('switch', { name: /Camille a gagné/ }).click();

  await page.getByRole('button', { name: 'Enregistrer la partie' }).click();

  // Back on the fiche: the celebration toast + the play in history.
  await expect(page.getByTestId('game-detail')).toBeVisible();
  await expect(page.getByText('Nouveau record, Camille')).toBeVisible();
  await expect(page.getByText('142').first()).toBeVisible();
  await expect(page.getByTestId('history')).toContainText('Camille');
});

test('on-the-fly: a player created from the autocomplete appears in Joueurs', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository }) => {
      await gameRepository.create({ name: 'Azul', type: 'competitive' });
    }`,
  );

  await openGame(page, /^Azul/);
  await page.getByRole('button', { name: /ajouter une partie/i }).click();
  await page.getByLabel('Ajouter un joueur').fill('Nina');
  await page.getByRole('option', { name: /Créer .*Nina/ }).click();
  await page.getByRole('switch', { name: /Nina a gagné/ }).click();
  await page.getByRole('button', { name: 'Enregistrer la partie' }).click();

  await expect(page.getByTestId('game-detail')).toBeVisible();

  // Nina now exists in the Joueurs space.
  await page.getByRole('button', { name: 'Retour' }).click();
  await page.getByRole('button', { name: /Joueurs/ }).click();
  await expect(page.getByRole('button', { name: /Nina/ })).toBeVisible();
});

test('cooperative: no score/winner, segmented result, Save active at one player', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository, playerRepository }) => {
      await gameRepository.create({ name: 'Pandémie', type: 'cooperative' });
      await playerRepository.create({ name: 'Alice' });
    }`,
  );

  await openGame(page, /^Pandémie/);
  await page.getByRole('button', { name: /ajouter une partie/i }).click();
  await page.getByLabel('Ajouter un joueur').fill('Ali');
  await page.getByRole('option', { name: /Alice/ }).click();

  await expect(page.getByRole('switch')).toHaveCount(0);
  await expect(page.getByRole('radiogroup', { name: 'Résultat collectif' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enregistrer la partie' })).toBeEnabled();
});

test('edit + delete: open a play from history, change it, then delete it', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository, playerRepository, playRepository }) => {
      const g = await gameRepository.create({ name: 'Catan', type: 'competitive' });
      const lea = await playerRepository.create({ name: 'Léa' });
      await playRepository.create({ gameId: g.id, playedAt: new Date('2026-05-24'), participations: [{ playerId: lea.id, isWinner: true, score: 30 }] });
    }`,
  );

  await openGame(page, /^Catan/);
  // Open the play from its history row.
  await page.getByTestId('history').getByRole('button').first().click();
  await expect(page.getByText('Modifier la partie')).toBeVisible();

  // Correct the score and save.
  await page.getByLabel('Score de Léa').fill('77');
  await page.getByRole('button', { name: 'Enregistrer les modifications' }).click();
  await expect(page.getByTestId('game-detail')).toBeVisible();
  await expect(page.getByText('77').first()).toBeVisible();

  // Reopen and delete it.
  await page.getByTestId('history').getByRole('button').first().click();
  await page.getByRole('button', { name: 'Options de la partie' }).click();
  await page.getByRole('menuitem', { name: 'Supprimer la partie' }).click();
  await page.getByRole('button', { name: 'Supprimer la partie' }).click();

  await expect(page.getByTestId('game-detail')).toBeVisible();
  await expect(page.getByText(/aucune partie pour l’instant/i)).toBeVisible();
});

test('abandon: leaving with unsaved changes asks before discarding', async ({
  page,
}) => {
  await ready(page);
  await seed(
    page,
    `async ({ gameRepository, playerRepository }) => {
      await gameRepository.create({ name: 'Catan', type: 'competitive' });
      await playerRepository.create({ name: 'Léa' });
    }`,
  );

  await openGame(page, /^Catan/);
  await page.getByRole('button', { name: /ajouter une partie/i }).click();
  await page.getByLabel('Ajouter un joueur').fill('Lé');
  await page.getByRole('option', { name: /Léa/ }).click();

  await page.getByRole('button', { name: 'Retour' }).click();
  await expect(page.getByRole('button', { name: 'Abandonner' })).toBeVisible();

  // Continue editing keeps the form; abandoning leaves it.
  await page.getByRole('button', { name: 'Continuer la saisie' }).click();
  await expect(page.getByText('Nouvelle partie')).toBeVisible();
  await page.getByRole('button', { name: 'Retour' }).click();
  await page.getByRole('button', { name: 'Abandonner' }).click();
  await expect(page.getByTestId('game-detail')).toBeVisible();
});
```

- [ ] **Step 2: Run the e2e suite**

Run: `npm run test:e2e -- play-form`
Expected: PASS (5 tests). If Playwright needs a build/preview server, it is configured in `playwright.config.*`; run `npm run test:e2e` once to let it start. If a selector mismatches, fix the **test selector** to match the real DOM, not the app behavior.

- [ ] **Step 3: Run the full e2e suite for regressions**

Run: `npm run test:e2e`
Expected: PASS (all specs, including the pre-existing `game-sheet`, `players`, `navigation`, `collection`, `smoke`).

- [ ] **Step 4: Commit**

```bash
git add e2e/play-form.spec.ts
git commit -m "test(e2e): Fiche partie recette journeys"
```

---

## Task 13: Recette + Factorisation (Definition of Done)

Close the brique per the project ritual: green recette, then `/code-review` + `/simplify`, then the brique commit.

**Files:** none new (review/cleanup only).

- [ ] **Step 1: Full verification gate**

Run each and confirm green:
- `npm test` — all Vitest suites pass.
- `npm run test:e2e` — all Playwright specs pass.
- `npm run lint` — eslint + prettier clean.
- `npm run build` — `tsc -b` typechecks, vite build succeeds.

Paste the summary lines (pass counts) as evidence; do not claim done without them.

- [ ] **Step 2: Recette checklist (from the brief) — confirm each is exercised by a test**

- [ ] E2E key journey: open from a competitive fiche → participants + scores → designate winner → save → return with toast + updated history/stats. *(play-form.spec.ts test 1)*
- [ ] Save disabled with the inline hint until a competitive winner; enabled once designated. *(PlayForm.test.tsx)*
- [ ] On-the-fly player creation → exists in Joueurs. *(play-form.spec.ts test 2)*
- [ ] Cooperative flow: no score, segmented Succès/Échec, Save active at ≥1 participant. *(play-form.spec.ts test 3, PlayForm.test.tsx)*
- [ ] Edit: pre-filled values, modification persisted. *(play-form.spec.ts test 4, PlayForm.test.tsx)*
- [ ] Delete + abandon sheets functional; abandon never loses data by mistake. *(play-form.spec.ts tests 4 & 5)*
- [ ] Ex-aequo (multiple winners) and solo (one participant) accepted. *(domain `validatePlay` tests + a PlayForm assertion: add one if missing — toggle two winners, Save enabled.)*

If any box has no covering test, add the test before proceeding.

- [ ] **Step 3: `/code-review`**

Run the `/code-review` skill over the branch diff. Triage findings with the `superpowers:receiving-code-review` skill; apply the ones that hold up. Re-run `npm test` after any change.

- [ ] **Step 4: `/simplify`**

Run the `/simplify` skill to fold any duplication / dead code introduced (e.g. the date helpers, the segment mappers, the celebration wiring). Re-run `npm test` + `npm run lint` after.

- [ ] **Step 5: Final brique commit**

Frequent per-task commits are already on the branch. Optionally squash-curate them into a single brique commit before merge (consistent with the repo's one-commit-per-brique history) using the `superpowers:finishing-a-development-branch` skill. Commit message body should record the key decisions (record-only toast, atomic on-the-fly creation, back-guard chokepoint) and the green test counts.

- [ ] **Step 6: Update the build-progress memory**

Append Brique 7 to `~/.claude/projects/-Users-baptiste-Documents-DEV-Ludobox/memory/build-progress.md` (DONE + commit hash + key decisions + new test counts), and note that the history rows are now interactive on both Fiche jeu and Fiche joueur (no longer "inert"), per the established ritual.

---

## Self-review notes (author)

- **Spec coverage:** every brief/PRD requirement maps to a task — context block + immutable type (T9), date prefilled+editable (T6 helpers + T9), autocomplete + on-the-fly (T2, T9, e2e T12), competitive rows/score/winner + helper (T9), coop segmented default Succès (T6 validity + T9), note (T9), validity → dormant Save + inline hint (T6, T9), edit prefilled (T7, T9), delete + abandon sheets (T9, e2e T12), back-guard both gestures (T4, T9, e2e T12), record-only toast on return to Fiche jeu (T1, T5, T7, T10), history tap-to-edit on both screens (T10), atomicity §8.5/§8.6 (T2, T3). Out-of-scope items (team plays, new stats) are not touched.
- **Type consistency:** `DraftParticipation` (repo) vs `DraftParticipant` (draft) are distinct on purpose — the data layer maps between them in `savePlay` (T7). `recordCelebration` signature is identical across T1/T7. `PlayFormScreen` (data) vs the `play-form` `Screen` variant (nav) are mapped in `PlayForm` (T9). The UI `SegmentedResult` value `'succes'|'echec'` vs domain `CoopResult` `'success'|'failure'` are mapped by `toSegment`/`fromSegment` (T9).
- **No placeholders:** every code/test step contains the actual content.
```
