import { describe, expect, it } from 'vitest';
import mini from '../../fixtures/mini.json';
import { createRecorder } from '../../lib/recorder';
import { replayExecutor, replaySource } from '../../lib/replay';
import type { Fixture, StreamEvent } from '../../lib/types';

const fixture = mini as unknown as Fixture;

describe('replaySource', () => {
  it('yields each turn in order with the recorded final message', async () => {
    const source = replaySource(fixture, 1000);
    const t1 = source.turn([]);
    const types: string[] = [];
    for await (const e of t1.events) types.push(e.type);
    expect(types[0]).toBe('message_start');
    expect(types).toContain('content_block_delta');
    expect(types[types.length - 1]).toBe('message_stop');
    expect((await t1.final()).stop_reason).toBe('tool_use');
    const t2 = source.turn([]);
    for await (const _e of t2.events) { /* drain */ }
    expect((await t2.final()).stop_reason).toBe('end_turn');
    expect(() => source.turn([])).toThrow('fixture has no turn 2');
  });

  it('scales recorded delays by speed', async () => {
    const started = Date.now();
    const source = replaySource(fixture, 4);
    for await (const _e of source.turn([]).events) { /* drain */ }
    const elapsed = Date.now() - started;
    expect(elapsed).toBeGreaterThanOrEqual(100); // 540 ms of recorded gaps / 4
    expect(elapsed).toBeLessThan(600);
  });
});

describe('replayExecutor', () => {
  it('returns the recorded outcome by tool_use id', async () => {
    const run = replayExecutor(fixture, 1000);
    const o = await run('run_python', { code: 'print(1+1)' }, 'toolu_mini_1');
    expect(o.output).toBe('2\n');
    await expect(run('run_python', {}, 'toolu_missing')).rejects.toThrow('fixture has no tool result for toolu_missing');
  });
});

describe('createRecorder', () => {
  it('builds a fixture with timestamps relative to each turn', () => {
    let clock = 1000;
    const { recorder, toFixture } = createRecorder('p', () => clock);
    const ev: StreamEvent = { type: 'message_stop' };
    recorder.beginTurn();
    clock = 1250;
    recorder.event(ev);
    recorder.endTurn(fixture.turns[1].final);
    recorder.tool('toolu_x', fixture.toolResults.toolu_mini_1);
    const f = toFixture();
    expect(f.version).toBe(1);
    expect(f.prompt).toBe('p');
    expect(f.turns).toEqual([{ events: [{ t: 250, event: ev }], final: fixture.turns[1].final }]);
    expect(f.toolResults.toolu_x.output).toBe('2\n');
  });
});
