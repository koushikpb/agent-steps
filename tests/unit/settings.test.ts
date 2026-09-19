import { describe, expect, it } from 'vitest';
import { readSettings } from '../../lib/settings';

describe('readSettings', () => {
  it('defaults to replay, demo fixture, streaming parser, memo on, speed 1', () => {
    expect(readSettings('', ['mini', 'demo'], false)).toEqual({ mode: 'replay', fixture: 'demo', parser: 'streaming', memo: true, speed: 1 });
  });
  it('honors url params and clamps speed', () => {
    expect(readSettings('?mode=live&fixture=mini&parser=buffered&memo=off&speed=5000', ['mini'], true)).toEqual({ mode: 'live', fixture: 'mini', parser: 'buffered', memo: false, speed: 1000 });
  });
  it('falls back to replay when live is disabled and to the first fixture when demo is missing', () => {
    expect(readSettings('?mode=live&fixture=zzz', ['mini'], false)).toMatchObject({ mode: 'replay', fixture: 'mini' });
  });
});
