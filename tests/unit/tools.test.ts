import { describe, expect, it } from 'vitest';
import { EditFileInput, MakeChartInput, RunPythonInput, STREAM_FIELD, TOOLS } from '../../lib/tools';
import { TOOL_NAMES } from '../../lib/events';

describe('tool definitions', () => {
  it('declares the three tools with eager input streaming', () => {
    expect(TOOLS.map((t) => t.name)).toEqual([...TOOL_NAMES]);
    for (const t of TOOLS) expect(t.eager_input_streaming, t.name).toBe(true);
  });

  it('keeps JSON schema required keys in sync with the zod schemas', () => {
    const required = Object.fromEntries(TOOLS.map((t) => [t.name, (t.input_schema as { required?: string[] }).required]));
    expect(required.run_python).toEqual(['code']);
    expect(required.edit_file).toEqual(['path', 'old_text', 'new_text']);
    expect(required.make_chart).toEqual(['title', 'kind', 'x', 'y', 'x_label', 'y_label']);
    expect(RunPythonInput.safeParse({ code: 'print(1)' }).success).toBe(true);
    expect(EditFileInput.safeParse({ path: 'a.py', old_text: 'x', new_text: 'y' }).success).toBe(true);
    expect(MakeChartInput.safeParse({ title: 't', kind: 'line', x: [1], y: [2], x_label: 'a', y_label: 'b' }).success).toBe(true);
    expect(RunPythonInput.safeParse({}).success).toBe(false);
  });

  it('streams the code-like field of each tool', () => {
    expect(STREAM_FIELD).toEqual({ run_python: 'code', edit_file: 'new_text', make_chart: null });
  });
});
