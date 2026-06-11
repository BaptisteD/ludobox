/**
 * French count agreement: 0 and 1 take the singular, ≥2 the plural — the same
 * `count <= 1` convention already used across the lists. The copy itself stays
 * at the call site (the FR↔EN frontier lives at the component border); this
 * helper only picks which form to use.
 */
export function plural(count: number, one: string, many: string): string {
  return count <= 1 ? one : many;
}
