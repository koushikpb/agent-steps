import { z } from 'zod';

export const TOOL_NAMES = ['run_python', 'edit_file', 'make_chart'] as const;
export const ToolName = z.enum(TOOL_NAMES);
export type ToolName = z.infer<typeof ToolName>;

// Present-tense while the tool runs, past-tense when it finishes.
export const RUNNING_LABELS: Record<ToolName, string> = {
  run_python: 'Generating code',
  edit_file: 'Editing file',
  make_chart: 'Generating visualization',
};
export const DONE_LABELS: Record<ToolName, string> = {
  run_python: 'Generated code',
  edit_file: 'Edited file',
  make_chart: 'Generated visualization',
};

export const ChartSpec = z.object({
  title: z.string().min(1),
  kind: z.enum(['bar', 'line', 'scatter']),
  x: z.array(z.union([z.string(), z.number()])).min(1),
  y: z.array(z.number()).min(1),
  x_label: z.string(),
  y_label: z.string(),
});
export type ChartSpec = z.infer<typeof ChartSpec>;

export const StepStarted = z.object({ type: z.literal('step_started'), stepId: z.string(), tool: ToolName, label: z.string() });
export const StepDelta = z.object({ type: z.literal('step_delta'), stepId: z.string(), field: z.literal('code'), text: z.string() });
export const StepDone = z.object({
  type: z.literal('step_done'),
  stepId: z.string(),
  label: z.string(),
  status: z.enum(['ok', 'error']),
  output: z.string(),
  diff: z.string().nullable(),
  durationMs: z.number(),
});
export const ChartEvent = z.object({ type: z.literal('chart'), stepId: z.string(), spec: ChartSpec });
export const TextDelta = z.object({ type: z.literal('text_delta'), text: z.string() });
export const DoneEvent = z.object({ type: z.literal('done') });
export const ErrorEvent = z.object({ type: z.literal('error'), message: z.string() });

export const AgentEvent = z.discriminatedUnion('type', [StepStarted, StepDelta, StepDone, ChartEvent, TextDelta, DoneEvent, ErrorEvent]);
export type AgentEvent = z.infer<typeof AgentEvent>;
