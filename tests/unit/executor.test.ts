import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { liveExecutor } from '../../lib/executor';
import { createWorkspace, type Workspace } from '../../lib/workspace';

let ws: Workspace;
beforeEach(async () => { ws = await createWorkspace(); });
afterEach(async () => { await ws.cleanup(); });

describe('liveExecutor', () => {
  it('runs python and returns stdout as output', async () => {
    const run = liveExecutor(ws.dir);
    const o = await run('run_python', { code: 'print("ok")' }, 'toolu_1');
    expect(o.isError).toBe(false);
    expect(o.output).toBe('ok\n');
    expect(o.resultText).toBe('ok\n');
    expect(o.diff).toBeNull();
    expect(o.chart).toBeNull();
  });

  it('marks a failing script as an error and includes stderr', async () => {
    const o = await liveExecutor(ws.dir)('run_python', { code: 'raise RuntimeError("x")' }, 'toolu_2');
    expect(o.isError).toBe(true);
    expect(o.output).toContain('[stderr]');
    expect(o.output).toContain('RuntimeError: x');
  });

  it('rejects invalid input without running anything', async () => {
    const o = await liveExecutor(ws.dir)('run_python', { nope: 1 }, 'toolu_3');
    expect(o.isError).toBe(true);
    expect(o.resultText.startsWith('INVALID_INPUT:')).toBe(true);
  });

  it('edits a file and returns the diff', async () => {
    const o = await liveExecutor(ws.dir)('edit_file', { path: 'summarize.py', old_text: '# BUG: ignores unit_price', new_text: '* float(row["unit_price"])' }, 'toolu_4');
    expect(o.isError).toBe(false);
    expect(o.diff).toContain('+');
    expect(o.resultText).toBe(o.diff);
  });

  it('validates a chart spec', async () => {
    const spec = { title: 'Revenue', kind: 'bar', x: ['2026-01', '2026-02'], y: [10, 20], x_label: 'month', y_label: 'usd' };
    const ok = await liveExecutor(ws.dir)('make_chart', spec, 'toolu_5');
    expect(ok.chart).toEqual(spec);
    expect(ok.resultText).toBe('Chart rendered: Revenue (2 points)');
    const bad = await liveExecutor(ws.dir)('make_chart', { ...spec, y: [1] }, 'toolu_6');
    expect(bad.isError).toBe(true);
    expect(bad.resultText).toContain('same length');
  });
});
