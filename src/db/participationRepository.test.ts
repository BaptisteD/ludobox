import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LudoboxDB } from './db';
import { createGameRepository } from './gameRepository';
import { createPlayRepository } from './playRepository';
import { createParticipationRepository } from './participationRepository';

let db: LudoboxDB;
let games: ReturnType<typeof createGameRepository>;
let plays: ReturnType<typeof createPlayRepository>;
let participations: ReturnType<typeof createParticipationRepository>;

beforeEach(() => {
  db = new LudoboxDB(`test-${crypto.randomUUID()}`);
  games = createGameRepository(db);
  plays = createPlayRepository(db);
  participations = createParticipationRepository(db);
});

afterEach(async () => {
  await db.delete();
});

describe('participationRepository.countByPlayer', () => {
  it('counts plays per player id, omitting players with none', async () => {
    const catan = await games.create({ name: 'Catan', type: 'competitive' });
    await plays.create({
      gameId: catan.id,
      participations: [
        { playerId: 'alice', isWinner: true, score: 10 },
        { playerId: 'bob', isWinner: false, score: 5 },
      ],
    });
    await plays.create({
      gameId: catan.id,
      participations: [{ playerId: 'alice', isWinner: true, score: 8 }],
    });

    const counts = await participations.countByPlayer();

    expect(counts.get('alice')).toBe(2);
    expect(counts.get('bob')).toBe(1);
    expect(counts.has('carol')).toBe(false);
  });

  it('returns an empty map when no participations exist', async () => {
    expect((await participations.countByPlayer()).size).toBe(0);
  });
});
