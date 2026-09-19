'use client';
import { useCallback, useReducer, useRef, useState } from 'react';
import { emptyMetrics, resetStats, setMetrics, type Metrics } from './profiler-stats';
import { initialState, reducer, type ChatState } from './reducer';
import { readEventStream } from './sse-client';
import type { ParserMode } from './types';

export type RunOptions = { prompt: string; mode: 'live' | 'replay'; fixture: string; parser: ParserMode; speed: number };

export function useAgentStream(): { state: ChatState; metrics: Metrics; start(opts: RunOptions): Promise<void>; reset(): void } {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [metrics, setLocalMetrics] = useState<Metrics>(emptyMetrics());
  const running = useRef(false);

  const reset = useCallback(() => {
    dispatch({ type: 'reset' });
    setLocalMetrics(emptyMetrics());
    resetStats();
  }, []);

  const start = useCallback(async (opts: RunOptions) => {
    if (running.current) return;
    running.current = true;
    reset();
    const m = emptyMetrics();
    const t0 = performance.now();
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(opts) });
      if (!res.ok || !res.body) {
        dispatch({ type: 'event', event: { type: 'error', message: `request failed: ${res.status}` } });
        return;
      }
      await readEventStream(res.body, (event) => {
        m.eventCount += 1;
        if (event.type === 'step_started' && m.ttfsMs === null) m.ttfsMs = performance.now() - t0;
        if (event.type === 'step_delta' && m.ttfdMs === null) m.ttfdMs = performance.now() - t0;
        dispatch({ type: 'event', event });
      });
    } catch (err) {
      dispatch({ type: 'event', event: { type: 'error', message: err instanceof Error ? err.message : String(err) } });
    } finally {
      m.totalMs = performance.now() - t0;
      setMetrics(m);
      setLocalMetrics({ ...m });
      running.current = false;
    }
  }, [reset]);

  return { state, metrics, start, reset };
}
