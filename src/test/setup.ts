/**
 * Vitest global setup: jsdom DOM matchers + an in-memory IndexedDB so the
 * Dexie layer (Brique 1+) can be exercised in unit tests without a browser.
 */
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
