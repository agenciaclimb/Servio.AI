import 'vitest';
import '@testing-library/jest-dom';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  interface Assertion<T = unknown> extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<typeof expect.stringContaining, unknown> {}
}
