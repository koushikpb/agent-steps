import type { ToolName } from './events';
import { runPython } from './runner';
import { EditFileInput, MakeChartInput, RunPythonInput } from './tools';
import type { ToolExecutor, ToolOutcome } from './types';
import { applyEdit } from './workspace';

export const RESULT_TEXT_CAP = 8000;

function cap(text: string): string {
  return text.length > RESULT_TEXT_CAP ? `${text.slice(0, RESULT_TEXT_CAP)}\n[truncated to ${RESULT_TEXT_CAP} chars]` : text;
}

function invalid(error: string, durationMs: number): ToolOutcome {
  return { resultText: `INVALID_INPUT: ${error}`, isError: true, output: error, diff: null, chart: null, durationMs };
}

/** Executes the three tools against a real workspace directory. */
export function liveExecutor(workspaceDir: string): ToolExecutor {
  return async (name: ToolName, input: unknown): Promise<ToolOutcome> => {
    const started = Date.now();
    if (name === 'run_python') {
      const parsed = RunPythonInput.safeParse(input);
      if (!parsed.success) return invalid(parsed.error.message, Date.now() - started);
      const r = await runPython(parsed.data.code, { cwd: workspaceDir });
      let output = r.stdout;
      if (r.stderr) output += `${output ? '\n' : ''}[stderr]\n${r.stderr}`;
      if (r.timedOut) output += '\n[timed out after 10 s]';
      if (r.truncated) output += '\n[output truncated at 64 KiB]';
      const isError = r.exitCode !== 0 || r.timedOut;
      return { resultText: cap(output || '(no output)'), isError, output, diff: null, chart: null, durationMs: r.durationMs };
    }
    if (name === 'edit_file') {
      const parsed = EditFileInput.safeParse(input);
      if (!parsed.success) return invalid(parsed.error.message, Date.now() - started);
      const r = await applyEdit(workspaceDir, parsed.data);
      const durationMs = Date.now() - started;
      if (!r.ok) return { resultText: r.error, isError: true, output: r.error, diff: null, chart: null, durationMs };
      return { resultText: cap(r.diff), isError: false, output: '', diff: r.diff, chart: null, durationMs };
    }
    const parsed = MakeChartInput.safeParse(input);
    if (!parsed.success) return invalid(parsed.error.message, Date.now() - started);
    if (parsed.data.x.length !== parsed.data.y.length) return invalid('x and y must have the same length', Date.now() - started);
    return {
      resultText: `Chart rendered: ${parsed.data.title} (${parsed.data.x.length} points)`,
      isError: false,
      output: '',
      diff: null,
      chart: parsed.data,
      durationMs: Date.now() - started,
    };
  };
}
