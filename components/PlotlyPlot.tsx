'use client';
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
import type { Figure } from '../lib/plotly-figure';

const Plot = createPlotlyComponent(Plotly);

export default function PlotlyPlot({ figure }: { figure: Figure }) {
  return <Plot data={figure.data} layout={figure.layout} config={{ responsive: true }} useResizeHandler style={{ width: '100%', height: '320px' }} />;
}
