import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const tokens = readFileSync(
  resolve(import.meta.dirname ?? __dirname, 'tokens.css'),
  'utf8',
);

/** Read a `--name: #hex;` value out of tokens.css. Assumes 6-digit hex (the
 *  only form tokens.css uses); update the pattern if 3-digit/alpha appears. */
function token(name: string): string {
  const m = tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --${name} not found`);
  return m[1];
}

function luminance(hex: string): number {
  const ch = hex
    .replace('#', '')
    .match(/../g)!
    .map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('token contrast (WCAG 2.1 AA)', () => {
  const creme = token('on-dark-cream');
  const cream = token('bg-cream');

  it('crème on coral clears 4.5:1 (14px tag/chip text)', () => {
    expect(ratio(creme, token('coral'))).toBeGreaterThanOrEqual(4.5);
  });
  it('crème on teal clears 4.5:1 (14px tag/chip text)', () => {
    expect(ratio(creme, token('teal'))).toBeGreaterThanOrEqual(4.5);
  });
  it('disclosure chevron clears 3:1 on cream', () => {
    expect(ratio(token('chevron-disclosure'), cream)).toBeGreaterThanOrEqual(3);
  });
  it('gold-ink (history scores) clears 4.5:1 on cream', () => {
    expect(ratio(token('gold-ink'), cream)).toBeGreaterThanOrEqual(4.5);
  });
  it('gold-ink clears 4.5:1 on raised cream (rank-1 row)', () => {
    expect(
      ratio(token('gold-ink'), token('bg-cream-raised')),
    ).toBeGreaterThanOrEqual(4.5);
  });
  it('gold-on-gold clears 4.5:1 on the gold record card', () => {
    expect(ratio(token('gold-on-gold'), token('gold'))).toBeGreaterThanOrEqual(
      4.5,
    );
  });
  it('ink-muted clears 4.5:1 on raised cream (its weakest surface)', () => {
    expect(
      ratio(token('ink-muted'), token('bg-cream-raised')),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
