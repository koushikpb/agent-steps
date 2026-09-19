import { spawn } from 'node:child_process';
import path from 'node:path';

export const SANDBOX_PATH = path.join(process.cwd(), 'runner', 'sandbox.py');
export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_MAX_OUTPUT_BYTES = 65_536;

export type RunResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  truncated: boolean;
  durationMs: number;
};

/** Runs `code` with a fixed interpreter (`PYTHON_BIN`, default python3) under runner/sandbox.py. */
export function runPython(code: string, opts: { cwd: string; timeoutMs?: number; maxOutputBytes?: number }): Promise<RunResult> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = opts.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn(process.env.PYTHON_BIN ?? 'python3', ['-I', SANDBOX_PATH], {
      cwd: opts.cwd,
      // Deliberately minimal: not a spread of process.env, so parent secrets (e.g. ANTHROPIC_API_KEY)
      // never reach the sandboxed subprocess. The assertion works around Next.js's global.d.ts making
      // NODE_ENV a required field of NodeJS.ProcessEnv, which this intentionally-partial object omits.
      env: { PATH: process.env.PATH ?? '', PYTHONNOUSERSITE: '1', PYTHONDONTWRITEBYTECODE: '1' } as unknown as NodeJS.ProcessEnv,
      timeout: timeoutMs,
      killSignal: 'SIGKILL',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    let bytes = 0;
    let truncated = false;
    let settled = false;
    const onData = (sink: Buffer[]) => (chunk: Buffer) => {
      if (truncated) return;
      bytes += chunk.length;
      if (bytes > maxBytes) {
        truncated = true;
        child.kill('SIGKILL');
        return;
      }
      sink.push(chunk);
    };
    const finish = (result: RunResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    child.stdout.on('data', onData(out));
    child.stderr.on('data', onData(err));
    child.on('error', (e) => finish({ stdout: '', stderr: `[runner] ${e.message}`, exitCode: null, timedOut: false, truncated: false, durationMs: Date.now() - started }));
    child.on('close', (code, signal) => finish({
      stdout: Buffer.concat(out).toString('utf8'),
      stderr: Buffer.concat(err).toString('utf8'),
      exitCode: code,
      timedOut: signal === 'SIGKILL' && !truncated,
      truncated,
      durationMs: Date.now() - started,
    }));
    child.stdin.on('error', () => undefined);
    child.stdin.end(code);
  });
}
