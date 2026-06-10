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
    expect(
      await loadPlayForm({ mode: 'create', gameId: 'nope' }, deps()),
    ).toBeNull();
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

    const loaded = await loadPlayForm(
      { mode: 'edit', playId: play.id },
      deps(),
    );
    expect(loaded?.initial.participants).toHaveLength(2);
    expect(loaded?.initial.note).toBe('belle');
    const ghostP = loaded?.initial.participants.find((p) => p.name === 'Ghost');
    expect(ghostP?.playerId).toBe(ghost.id);
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
          {
            key: 'k',
            playerId: lea.id,
            name: 'Léa',
            color: 'teal',
            score: 142,
            isWinner: true,
          },
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
          {
            key: 'k',
            playerId: lea.id,
            name: 'Léa',
            color: 'teal',
            score: 50,
            isWinner: true,
          },
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
          {
            key: 'k',
            playerId: null,
            name: 'Nina',
            color: 'coral',
            score: null,
            isWinner: true,
          },
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
          {
            key: 'k',
            playerId: lea.id,
            name: 'Léa',
            color: 'teal',
            score: null,
            isWinner: false,
          },
        ],
      },
      { mode: 'create', gameId: g.id },
      deps(),
    );
    expect(celebration).toBeNull();
    expect((await plays.listByGame(g.id))[0].coopResult).toBe('failure');
  });

  it('celebrates when an edit raises a score past the prior record', async () => {
    const g = await games.create({ name: 'Catan', type: 'competitive' });
    const lea = await players.create({ name: 'Léa' });
    const play = await plays.create({
      gameId: g.id,
      participations: [{ playerId: lea.id, isWinner: true, score: 10 }],
    });
    const celebration = await savePlay(
      {
        gameType: 'competitive',
        playedAt: new Date(2026, 5, 10),
        note: '',
        coopResult: 'success',
        participants: [
          {
            key: 'k',
            playerId: lea.id,
            name: 'Léa',
            color: 'teal',
            score: 99,
            isWinner: true,
          },
        ],
      },
      { mode: 'edit', gameId: g.id, playId: play.id },
      deps(),
    );
    expect(celebration).toEqual({ holderName: 'Léa', score: 99 });
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
          {
            key: 'k',
            playerId: lea.id,
            name: 'Léa',
            color: 'teal',
            score: 30,
            isWinner: true,
          },
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
