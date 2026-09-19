export type Metrics = { ttfsMs: number | null; ttfdMs: number | null; totalMs: number | null; eventCount: number };
export type ProfilerStats = { commits: number; actualMs: number };
export type AgentStepsGlobal = { metrics: Metrics; profiler: ProfilerStats };

export const emptyMetrics = (): Metrics => ({ ttfsMs: null, ttfdMs: null, totalMs: null, eventCount: 0 });

function store(): AgentStepsGlobal {
  const g = globalThis as unknown as { __agentSteps?: AgentStepsGlobal };
  if (!g.__agentSteps) g.__agentSteps = { metrics: emptyMetrics(), profiler: { commits: 0, actualMs: 0 } };
  return g.__agentSteps;
}

export function resetStats(): void {
  const s = store();
  s.metrics = emptyMetrics();
  s.profiler = { commits: 0, actualMs: 0 };
}

/** React Profiler onRender callback: (id, phase, actualDuration, baseDuration, startTime, commitTime). */
export function recordRender(_id: string, _phase: string, actualDuration: number): void {
  const s = store();
  s.profiler.commits += 1;
  s.profiler.actualMs += actualDuration;
}

export function setMetrics(metrics: Metrics): void {
  store().metrics = metrics;
}

export function getStats(): AgentStepsGlobal {
  return store();
}
