import { describe, expect, it } from 'vitest';
import { plural } from './plural';

describe('plural', () => {
  it('uses the singular for 0 and 1, the plural for 2 or more', () => {
    expect(plural(0, 'partie', 'parties')).toBe('partie');
    expect(plural(1, 'partie', 'parties')).toBe('partie');
    expect(plural(2, 'partie', 'parties')).toBe('parties');
    expect(plural(46, 'partie', 'parties')).toBe('parties');
  });
});
