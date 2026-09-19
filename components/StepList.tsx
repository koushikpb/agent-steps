'use client';
import { Profiler } from 'react';
import { recordRender } from '../lib/profiler-stats';
import type { Step } from '../lib/reducer';
import { StepCard, StepCardView } from './StepCard';

/** `memoized` switches between the memo-wrapped card and the plain one so the perf test can compare both. */
export function StepList({ steps, memoized }: { steps: Step[]; memoized: boolean }) {
  const Card = memoized ? StepCard : StepCardView;
  return (
    <Profiler id="steps" onRender={recordRender}>
      <ol data-testid="step-list" className="space-y-2">
        {steps.map((step) => (
          <li key={step.id}>
            <Card step={step} />
          </li>
        ))}
      </ol>
    </Profiler>
  );
}
