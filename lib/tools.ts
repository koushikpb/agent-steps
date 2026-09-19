import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { ChartSpec, type ToolName } from './events';

export const RunPythonInput = z.object({ code: z.string().min(1) });
export const EditFileInput = z.object({ path: z.string().min(1), old_text: z.string().min(1), new_text: z.string() });
export const MakeChartInput = ChartSpec;

/** The tool input property that is streamed to the UI as `step_delta` text while the model writes it. */
export const STREAM_FIELD: Record<ToolName, 'code' | 'new_text' | null> = {
  run_python: 'code',
  edit_file: 'new_text',
  make_chart: null,
};

export const TOOLS: Anthropic.Tool[] = [
  {
    name: 'run_python',
    description: 'Run a Python 3 script in the project directory (standard library only, no network, 10 second limit). Returns stdout and stderr. Print anything you want to see.',
    eager_input_streaming: true,
    input_schema: {
      type: 'object',
      properties: { code: { type: 'string', description: 'The complete Python script to run.' } },
      required: ['code'],
    },
  },
  {
    name: 'edit_file',
    description: 'Replace exactly one occurrence of old_text with new_text in a file in the project directory. old_text must match exactly and occur once. Returns a unified diff.',
    eager_input_streaming: true,
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to the project directory, e.g. summarize.py' },
        old_text: { type: 'string', description: 'Exact text to replace (include enough lines to be unique).' },
        new_text: { type: 'string', description: 'Replacement text.' },
      },
      required: ['path', 'old_text', 'new_text'],
    },
  },
  {
    name: 'make_chart',
    description: 'Render one interactive chart from numbers you already computed with run_python. x and y must have the same length.',
    eager_input_streaming: true,
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        kind: { type: 'string', enum: ['bar', 'line', 'scatter'] },
        x: { type: 'array', items: { type: ['string', 'number'] } },
        y: { type: 'array', items: { type: 'number' } },
        x_label: { type: 'string' },
        y_label: { type: 'string' },
      },
      required: ['title', 'kind', 'x', 'y', 'x_label', 'y_label'],
    },
  },
];
