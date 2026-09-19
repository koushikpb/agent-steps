import type { ParserMode } from './types';

export type Settings = { mode: 'live' | 'replay'; fixture: string; parser: ParserMode; memo: boolean; speed: number };

/** Reads the run configuration from the URL query string; every value has a safe default. */
export function readSettings(search: string, fixtures: string[], liveEnabled: boolean): Settings {
  const q = new URLSearchParams(search);
  const requested = q.get('fixture') ?? '';
  const fixture = fixtures.includes(requested) ? requested : fixtures.includes('demo') ? 'demo' : (fixtures[0] ?? 'demo');
  const speed = Number(q.get('speed'));
  return {
    mode: q.get('mode') === 'live' && liveEnabled ? 'live' : 'replay',
    fixture,
    parser: q.get('parser') === 'buffered' ? 'buffered' : 'streaming',
    memo: q.get('memo') !== 'off',
    speed: Number.isFinite(speed) && speed > 0 ? Math.min(1000, Math.max(0.1, speed)) : 1,
  };
}
