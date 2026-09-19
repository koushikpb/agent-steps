import { describe, expect, it } from 'vitest';
import type { AgentEvent } from '../../lib/events';
import { applyEvent, initialState, reducer, type ChatState } from '../../lib/reducer';

function run(events: AgentEvent[], from: ChatState = initialState): ChatState {
  return events.reduce(applyEvent, from);
}

describe('applyEvent', () => {
  it('builds steps from the event sequence', () => {
    const s = run([
      { type: 'text_delta', text: 'Hi ' },
      { type: 'step_started', stepId: 'a', tool: 'run_python', label: 'Generating code' },
      { type: 'step_delta', stepId: 'a', field: 'code', text: 'print(' },
      { type: 'step_delta', stepId: 'a', field: 'code', text: '1)' },
      { type: 'step_done', stepId: 'a', label: 'Generated code', status: 'ok', output: '1\n', diff: null, durationMs: 5 },
      { type: 'step_started', stepId: 'b', tool: 'make_chart', label: 'Generating visualization' },
      { type: 'step_done', stepId: 'b', label: 'Generated visualization', status: 'ok', output: '', diff: null, durationMs: 1 },
      { type: 'chart', stepId: 'b', spec: { title: 't', kind: 'bar', x: [1], y: [2], x_label: 'x', y_label: 'y' } },
      { type: 'text_delta', text: 'done.' },
      { type: 'done' },
    ]);
    expect(s.status).toBe('done');
    expect(s.text).toBe('Hi done.');
    expect(s.steps.map((st) => [st.id, st.label, st.status, st.code])).toEqual([
      ['a', 'Generated code', 'ok', 'print(1)'],
      ['b', 'Generated visualization', 'ok', ''],
    ]);
    expect(s.steps[0].output).toBe('1\n');
    expect(s.steps[1].chart?.title).toBe('t');
  });

  it('keeps untouched step objects identical across updates', () => {
    const s1 = run([
      { type: 'step_started', stepId: 'a', tool: 'run_python', label: 'Generating code' },
      { type: 'step_started', stepId: 'b', tool: 'edit_file', label: 'Editing file' },
    ]);
    const s2 = applyEvent(s1, { type: 'step_delta', stepId: 'b', field: 'code', text: 'x' });
    expect(s2.steps[0]).toBe(s1.steps[0]);
    expect(s2.steps[1]).not.toBe(s1.steps[1]);
    expect(s2.steps[1].code).toBe('x');
  });

  it('ignores deltas for unknown steps and records errors', () => {
    const s = run([{ type: 'step_delta', stepId: 'zzz', field: 'code', text: 'x' }, { type: 'error', message: 'boom' }]);
    expect(s.steps).toEqual([]);
    expect(s.status).toBe('error');
    expect(s.error).toBe('boom');
  });

  it('reset returns the initial state', () => {
    const s = reducer(run([{ type: 'text_delta', text: 'x' }]), { type: 'reset' });
    expect(s).toBe(initialState);
  });
});
