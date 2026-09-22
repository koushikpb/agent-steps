import { describe, expect, it } from 'vitest';
import { AgentEvent, DONE_LABELS, RUNNING_LABELS, TOOL_NAMES } from '../../lib/events';

describe('labels', () => {
  it('pairs a running label with a done label for every tool', () => {
    expect(TOOL_NAMES).toEqual(['run_python', 'edit_file', 'make_chart']);
    expect(RUNNING_LABELS).toEqual({
      run_python: 'Generating code',
      edit_file: 'Editing file',
      make_chart: 'Generating visualization',
    });
    expect(DONE_LABELS).toEqual({
      run_python: 'Generated code',
      edit_file: 'Edited file',
      make_chart: 'Generated visualization',
    });
  });
});

describe('AgentEvent', () => {
  it('accepts each event type', () => {
    const events = [
      { type: 'step_started', stepId: 's1', tool: 'run_python', label: 'Generating code' },
      { type: 'step_delta', stepId: 's1', field: 'code', text: 'print(1)' },
      { type: 'step_done', stepId: 's1', label: 'Generated code', status: 'ok', output: '1\n', diff: null, durationMs: 12 },
      { type: 'chart', stepId: 's2', spec: { title: 'T', kind: 'bar', x: ['a'], y: [1], x_label: 'x', y_label: 'y' } },
      { type: 'text_delta', text: 'hi' },
      { type: 'done' },
      { type: 'error', message: 'boom' },
    ];
    for (const e of events) expect(AgentEvent.safeParse(e).success, JSON.stringify(e)).toBe(true);
  });

  it('rejects unknown types and bad tools', () => {
    expect(AgentEvent.safeParse({ type: 'nope' }).success).toBe(false);
    expect(AgentEvent.safeParse({ type: 'step_started', stepId: 's', tool: 'bash', label: 'x' }).success).toBe(false);
  });
});
