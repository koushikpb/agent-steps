import type { ChartSpec } from './events';

export type Trace =
  | { type: 'bar'; x: (string | number)[]; y: number[] }
  | { type: 'scatter'; mode: 'lines+markers' | 'markers'; x: (string | number)[]; y: number[] };

export type Figure = {
  data: Trace[];
  layout: {
    title: { text: string };
    xaxis: { title: { text: string } };
    yaxis: { title: { text: string } };
    autosize: true;
    margin: { l: number; r: number; t: number; b: number };
  };
};

export function toFigure(spec: ChartSpec): Figure {
  const trace: Trace =
    spec.kind === 'bar'
      ? { type: 'bar', x: spec.x, y: spec.y }
      : { type: 'scatter', mode: spec.kind === 'line' ? 'lines+markers' : 'markers', x: spec.x, y: spec.y };
  return {
    data: [trace],
    layout: {
      title: { text: spec.title },
      xaxis: { title: { text: spec.x_label } },
      yaxis: { title: { text: spec.y_label } },
      autosize: true,
      margin: { l: 48, r: 16, t: 40, b: 40 },
    },
  };
}
