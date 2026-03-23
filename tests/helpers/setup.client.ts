import '@testing-library/jest-dom';
import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {
    /* empty */
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
