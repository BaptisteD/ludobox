import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LudoboxDB } from './db';
import { createPlayerRepository } from './playerRepository';

let db: LudoboxDB;
let players: ReturnType<typeof createPlayerRepository>;

beforeEach(() => {
  db = new LudoboxDB(`test-${crypto.randomUUID()}`);
  players = createPlayerRepository(db);
});

afterEach(async () => {
  await db.delete();
});

describe('playerRepository', () => {
  it('creates an active player with a generated id', async () => {
    const p = await players.create({ name: 'Alice' });
    expect(p.id).toBeTruthy();
    expect(p.status).toBe('active');
  });

  it('rejects an empty or whitespace-only name', async () => {
    await expect(players.create({ name: '   ' })).rejects.toMatchObject({
      code: 'EMPTY_PLAYER_NAME',
    });
  });

  it('trims leading/trailing spaces from the stored name', async () => {
    const p = await players.create({ name: '  Alice  ' });
    expect(p.name).toBe('Alice');
  });

  it('rejects a name matching an active player', async () => {
    await players.create({ name: 'Alice' });
    await expect(players.create({ name: 'alice' })).rejects.toMatchObject({
      code: 'DUPLICATE_PLAYER_NAME',
    });
  });

  it('allows a name matching only an archived player', async () => {
    const p = await players.create({ name: 'Alice' });
    await players.archive(p.id);
    const homonym = await players.create({ name: 'Alice' });
    expect(homonym.status).toBe('active');
  });

  it('rejects renaming to another active player name', async () => {
    await players.create({ name: 'Alice' });
    const bob = await players.create({ name: 'Bob' });
    await expect(players.rename(bob.id, 'Alice')).rejects.toMatchObject({
      code: 'DUPLICATE_PLAYER_NAME',
    });
  });

  it('archives a player (kept by id, dropped from active list)', async () => {
    const p = await players.create({ name: 'Alice' });
    await players.archive(p.id);

    expect((await players.get(p.id))?.status).toBe('archived');
    expect(await players.getActive()).toHaveLength(0);
  });
});
