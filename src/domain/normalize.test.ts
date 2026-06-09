import { describe, expect, it } from 'vitest';
import { normalizeName } from './normalize';

describe('normalizeName', () => {
  it('lowercases', () => {
    expect(normalizeName('CATAN')).toBe('catan');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeName('  Catan  ')).toBe('catan');
  });

  it('strips diacritics so accented and unaccented names collide', () => {
    expect(normalizeName('Café')).toBe(normalizeName('cafe'));
    expect(normalizeName('Café')).toBe('cafe');
  });

  it('handles a range of diacritics', () => {
    expect(normalizeName('Élévation')).toBe('elevation');
    expect(normalizeName('Señor')).toBe('senor');
    expect(normalizeName('Krëusä')).toBe('kreusa');
  });

  it('collapses precomposed and decomposed forms to the same value', () => {
    // "é" as a single code point vs "e" + combining acute accent
    expect(normalizeName('café')).toBe(normalizeName('café'));
  });

  it('preserves internal spacing and non-diacritic characters', () => {
    expect(normalizeName('Ticket to Ride')).toBe('ticket to ride');
    expect(normalizeName('7 Wonders')).toBe('7 wonders');
  });
});
