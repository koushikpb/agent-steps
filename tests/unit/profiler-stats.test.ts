import { describe, expect, it } from 'vitest';
import { getStats, recordRender, resetStats, setMetrics } from '../../lib/profiler-stats';

describe('profiler stats', () => {
  it('accumulates commits and resets', () => {
    resetStats();
    recordRender('steps', 'update', 2.5);
    recordRender('steps', 'update', 1.5);
    expect(getStats().profiler).toEqual({ commits: 2, actualMs: 4 });
    setMetrics({ ttfsMs: 10, ttfdMs: 12, totalMs: 100, eventCount: 3 });
    expect(getStats().metrics.ttfsMs).toBe(10);
    resetStats();
    expect(getStats()).toEqual({ metrics: { ttfsMs: null, ttfdMs: null, totalMs: null, eventCount: 0 }, profiler: { commits: 0, actualMs: 0 } });
  });
});
