'use client';
import { useEffect, useState } from 'react';
import { readSettings, type Settings } from '../lib/settings';
import { useAgentStream, type RunOptions } from '../lib/use-agent-stream';
import { StepList } from './StepList';

export const DEFAULT_PROMPT =
  'Load sales.csv, compute total revenue per month, fix the bug in summarize.py so revenue uses quantity times unit_price, run it to confirm, then chart monthly revenue as a bar chart.';

const fmt = (ms: number | null) => (ms === null ? '–' : `${Math.round(ms)} ms`);

export function Chat({ liveEnabled, fixtures }: { liveEnabled: boolean; fixtures: string[] }) {
  const [settings, setSettings] = useState<Settings>(() => readSettings('', fixtures, liveEnabled));
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const { state, metrics, start } = useAgentStream();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(readSettings(window.location.search, fixtures, liveEnabled));
    setReady(true); // runs only after hydration, so the Run button enables once the click handler is attached
  }, [fixtures, liveEnabled]);

  const busy = state.status === 'streaming';
  const run = () => {
    const opts: RunOptions = { prompt, mode: settings.mode, fixture: settings.fixture, parser: settings.parser, speed: settings.speed };
    void start(opts);
  };

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">agent-steps</h1>
        <p className="text-sm text-zinc-600">
          Streaming tool steps for a code-running agent.
        </p>
      </header>
      <section className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-1">
          Mode
          <select
            data-testid="mode"
            className="rounded border border-zinc-300 px-1 py-0.5"
            value={settings.mode}
            disabled={busy}
            onChange={(e) => setSettings({ ...settings, mode: e.target.value === 'live' ? 'live' : 'replay' })}
          >
            <option value="replay">Replay (recorded run)</option>
            <option value="live" disabled={!liveEnabled}>{liveEnabled ? 'Live' : 'Live (needs ALLOW_LIVE=1)'}</option>
          </select>
        </label>
      </section>
      {settings.mode === 'replay' && (
        <p data-testid="recorded-badge" className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
          Recorded run — Live mode needs a local Python (see README).
        </p>
      )}
      <textarea
        data-testid="prompt"
        className="w-full rounded border border-zinc-300 p-2 text-sm disabled:bg-zinc-100"
        rows={3}
        value={prompt}
        disabled={busy || settings.mode === 'replay'}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button data-testid="run" className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50" disabled={busy || !ready} onClick={run}>
        {busy ? 'Running…' : 'Run'}
      </button>
      {state.text && <p data-testid="assistant-text" className="whitespace-pre-wrap text-sm">{state.text}</p>}
      <StepList steps={state.steps} memoized={settings.memo} />
      {state.error && <p data-testid="error" className="text-sm text-rose-700">{state.error}</p>}
      {state.status === 'done' && (
        <p data-testid="metrics" className="text-xs text-zinc-500">
          time-to-first-step {fmt(metrics.ttfsMs)} · time-to-first-delta {fmt(metrics.ttfdMs)} · total {fmt(metrics.totalMs)} · {metrics.eventCount} events
        </p>
      )}
    </main>
  );
}
