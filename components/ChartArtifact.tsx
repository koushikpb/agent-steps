'use client';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { ChartSpec } from '../lib/events';
import { toFigure } from '../lib/plotly-figure';

const PlotlyPlot = dynamic(() => import('./PlotlyPlot'), { ssr: false });

export function ChartArtifact({ spec }: { spec: ChartSpec }) {
  const figure = useMemo(() => toFigure(spec), [spec]);
  return (
    <div data-testid="chart" className="rounded border border-zinc-200 bg-white p-1">
      <PlotlyPlot figure={figure} />
    </div>
  );
}
