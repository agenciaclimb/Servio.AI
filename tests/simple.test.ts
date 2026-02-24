import { test, expect } from 'vitest';
import path from 'path';

test('simple verification', () => {
  expect(true).toBe(true);
  expect(typeof window).not.toBe('undefined');
});
