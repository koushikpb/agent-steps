import type Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it } from 'vitest';
import mini from '../../fixtures/mini.json';
import { runAgent } from '../../lib/agent';
import type { AgentEvent } from '../../lib/events';
import { replayExecutor, replaySource } from '../../lib/replay';
import type { Fixture, ModelSource, ToolExecutor } from '../../lib/types';

const fixture = mini as unknown as Fixture;

async function collect(parser: 'buffered' | 'streaming'): Promise<AgentEvent[]> {
  const events: AgentEvent[] = [];
  await runAgent({ prompt: fixture.prompt, source: replaySource(fixture, 1000), execute: replayExecutor(fixture, 1000), emit: (e) => events.push(e), parser });
  return events;
}

function scripted(final: Anthropic.Message): ModelSource {
  return { turn: () => ({ events: (async function* () { /* no events */ })(), final: async () => final }) };
}

const neverRun: ToolExecutor = async () => { throw new Error('tool must not run'); };

describe('runAgent', () => {
  it('streaming parser: step starts at content_block_start and code arrives in deltas', async () => {
    const events = await collect('streaming');
    const types = events.map((e) => e.type);
    expect(types[0]).toBe('text_delta');
    expect(types.indexOf('step_started')).toBeLessThan(types.indexOf('step_delta'));
    const deltas = events.filter((e): e is Extract<AgentEvent, { type: 'step_delta' }> => e.type === 'step_delta');
    expect(deltas.length).toBe(2); // 'pri' then 'nt(1+1)'; the closing '"}' chunk adds no text
    expect(deltas.map((d) => d.text).join('')).toBe('print(1+1)');
    const done = events.find((e) => e.type === 'step_done');
    expect(done).toEqual({ type: 'step_done', stepId: 'toolu_mini_1', label: 'Generated code', status: 'ok', output: '2\n', diff: null, durationMs: 30 });
    expect(events.find((e) => e.type === 'step_started')).toEqual({ type: 'step_started', stepId: 'toolu_mini_1', tool: 'run_python', label: 'Generating code' });
    expect(types[types.length - 1]).toBe('done');
  });

  it('buffered parser: step starts at content_block_stop with one full delta', async () => {
    const events = await collect('buffered');
    const steps = events.filter((e) => e.type === 'step_started' || e.type === 'step_delta');
    expect(steps).toEqual([
      { type: 'step_started', stepId: 'toolu_mini_1', tool: 'run_python', label: 'Generating code' },
      { type: 'step_delta', stepId: 'toolu_mini_1', field: 'code', text: 'print(1+1)' },
    ]);
  });

  it('passes the assistant turn and tool_result back to the model', async () => {
    const seen: Anthropic.MessageParam[][] = [];
    const inner = replaySource(fixture, 1000);
    const source: ModelSource = { turn: (messages) => { seen.push(messages.map((m) => ({ ...m }))); return inner.turn(messages); } };
    await runAgent({ prompt: fixture.prompt, source, execute: replayExecutor(fixture, 1000), emit: () => undefined, parser: 'streaming' });
    expect(seen.length).toBe(2);
    expect(seen[1][1]).toEqual({ role: 'assistant', content: fixture.turns[0].final.content });
    expect(seen[1][2]).toEqual({ role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_mini_1', content: '2\n', is_error: false }] });
  });

  it('stops with an error on refusal without running tools', async () => {
    const final = { ...fixture.turns[0].final, stop_reason: 'refusal' } as Anthropic.Message;
    const events: AgentEvent[] = [];
    await runAgent({ prompt: 'x', source: scripted(final), execute: neverRun, emit: (e) => events.push(e), parser: 'streaming' });
    expect(events).toEqual([{ type: 'error', message: 'The model declined this request.' }]);
  });

  it('stops with an error when a tool input is cut off at max_tokens', async () => {
    const final = { ...fixture.turns[0].final, stop_reason: 'max_tokens' } as Anthropic.Message;
    const events: AgentEvent[] = [];
    await runAgent({ prompt: 'x', source: scripted(final), execute: neverRun, emit: (e) => events.push(e), parser: 'streaming' });
    expect(events).toEqual([{ type: 'error', message: 'Tool input was cut off at max_tokens; try a smaller task.' }]);
  });

  it('turns a thrown source error into an error event', async () => {
    const source: ModelSource = { turn: () => { throw new Error('boom'); } };
    const events: AgentEvent[] = [];
    await runAgent({ prompt: 'x', source, execute: neverRun, emit: (e) => events.push(e), parser: 'streaming' });
    expect(events).toEqual([{ type: 'error', message: 'boom' }]);
  });

  it('reports an error instead of done when maxTurns is exhausted with tools pending', async () => {
    const final = fixture.turns[0].final; // stop_reason 'tool_use' with one run_python call
    const events: AgentEvent[] = [];
    const execute: ToolExecutor = async () => fixture.toolResults.toolu_mini_1;
    await runAgent({ prompt: 'x', source: scripted(final), execute, emit: (e) => events.push(e), parser: 'streaming', maxTurns: 2 });
    expect(events.filter((e) => e.type === 'step_done').length).toBe(2);
    expect(events[events.length - 1]).toEqual({ type: 'error', message: 'Stopped after 2 model turns; the task did not finish.' });
    expect(events.some((e) => e.type === 'done')).toBe(false);
  });
});
