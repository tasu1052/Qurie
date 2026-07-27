import type { RowStatus } from './fixtures';

/** Dev-only scenario switch via `?state=loading|error|empty`. Default: ready. */
export function getScenarioFromSearch(search: string): RowStatus {
  const state = new URLSearchParams(search).get('state');
  if (state === 'loading' || state === 'error' || state === 'empty') return state;
  return 'ready';
}

export const MOCK_DELAY_MS = 600;
