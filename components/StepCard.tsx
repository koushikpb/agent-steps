'use client';
import { memo } from 'react';
import type { Step } from '../lib/reducer';
import { ChartArtifact } from './ChartArtifact';
import { DiffView } from './DiffView';

const DOT: Record<Step['status'], string> = {
  running: 'animate-pulse bg-amber-500',
  ok: 'bg-emerald-500',
  error: 'bg-rose-500',
};

export function StepCardView({ step }: { step: Step }) {
  return (
    <details open data-testid="step" data-status={step.status} className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium">
        <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${DOT[step.status]}`} />
        <span data-testid="step-label">{step.label}</span>
        {step.durationMs !== null && <span className="ml-auto text-xs font-normal text-zinc-500">{step.durationMs} ms</span>}
      </summary>
      <div className="space-y-2 border-t border-zinc-100 px-3 py-2">
        {step.code && <pre data-testid="step-code" className="overflow-x-auto rounded bg-zinc-900 p-2 text-xs leading-5 text-zinc-100">{step.code}</pre>}
        {step.output && <pre data-testid="step-output" className="overflow-x-auto rounded bg-zinc-100 p-2 text-xs leading-5">{step.output}</pre>}
        {step.diff && <DiffView diff={step.diff} />}
        {step.chart && <ChartArtifact spec={step.chart} />}
      </div>
    </details>
  );
}

/** Skips re-rendering when the `step` object is unchanged (the reducer keeps untouched steps identical). */
export const StepCard = memo(StepCardView);
