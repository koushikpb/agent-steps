import { describe, expect, it } from 'vitest';
import { toFigure } from '../../lib/plotly-figure';

const base: { title: string; x: (string | number)[]; y: number[]; x_label: string; y_label: string } = {
  title: 'Revenue', x: ['2026-01', '2026-02'], y: [1, 2], x_label: 'month', y_label: 'usd',
};

describe('toFigure', () => {
  it('maps bar, line, and scatter kinds to Plotly traces', () => {
    expect(toFigure({ ...base, kind: 'bar' }).data).toEqual([{ type: 'bar', x: base.x, y: base.y }]);
    expect(toFigure({ ...base, kind: 'line' }).data).toEqual([{ type: 'scatter', mode: 'lines+markers', x: base.x, y: base.y }]);
    expect(toFigure({ ...base, kind: 'scatter' }).data).toEqual([{ type: 'scatter', mode: 'markers', x: base.x, y: base.y }]);
  });
  it('uses the title.text object form for titles', () => {
    const f = toFigure({ ...base, kind: 'bar' });
    expect(f.layout.title).toEqual({ text: 'Revenue' });
    expect(f.layout.xaxis.title).toEqual({ text: 'month' });
    expect(f.layout.yaxis.title).toEqual({ text: 'usd' });
  });
});
