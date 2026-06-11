import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/**
 * Assert zero serious/critical WCAG 2.1 A/AA violations on the current page.
 * Brique 8 a11y gate. Prints offending rule ids + nodes on failure.
 */
export async function expectNoSeriousA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  const summary = blocking.map(
    (v) => `${v.id} (${v.impact}) × ${v.nodes.length}: ${v.help}`,
  );
  expect(blocking, summary.join('\n')).toEqual([]);
}
