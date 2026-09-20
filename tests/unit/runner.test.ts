import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runPython } from '../../lib/runner';

let cwd = '';
beforeAll(async () => { cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'runner-test-')); });
afterAll(async () => { await fs.rm(cwd, { recursive: true, force: true }); });

describe('runPython', () => {
  it('captures stdout and exit code 0', async () => {
    const r = await runPython('print(1 + 1)', { cwd });
    expect(r.stdout).toBe('2\n');
    expect(r.exitCode).toBe(0);
    expect(r.timedOut).toBe(false);
  });

  it('reports exceptions on stderr with exit code 1', async () => {
    const r = await runPython('raise ValueError("bad")', { cwd });
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain('ValueError: bad');
  });

  it('kills an infinite loop at the timeout', async () => {
    const r = await runPython('while True:\n    pass', { cwd, timeoutMs: 500 });
    expect(r.timedOut).toBe(true);
    expect(r.exitCode).toBeNull();
  });

  it('truncates output above the cap', async () => {
    const r = await runPython('print("x" * 200000)', { cwd, maxOutputBytes: 1024 });
    expect(r.truncated).toBe(true);
    expect(r.stdout.length).toBeLessThanOrEqual(1024 + 65536);
  });

  it('blocks network and subprocess', async () => {
    const net = await runPython('import socket\nsocket.create_connection(("example.com", 80))', { cwd });
    expect(net.exitCode).toBe(1);
    expect(net.stderr).toContain('network access is disabled');
    const sub = await runPython('import subprocess', { cwd });
    expect(sub.exitCode).toBe(1);
    expect(sub.stderr).toMatch(/ModuleNotFoundError|ImportError/); // 3.12 prints "ModuleNotFoundError: import of subprocess halted; None in sys.modules"
  });

  it('blocks subprocess creation via os', async () => {
    const system = await runPython('import os\nos.system("true")', { cwd });
    expect(system.exitCode).toBe(1);
    expect(system.stderr).toContain('disabled in this runner');
    const fork = await runPython('import os\nos.fork()', { cwd });
    expect(fork.exitCode).toBe(1);
    expect(fork.stderr).toContain('disabled in this runner');
  });

  it('runs in the given cwd', async () => {
    await fs.writeFile(path.join(cwd, 'hello.txt'), 'hi', 'utf8');
    const r = await runPython('print(open("hello.txt").read())', { cwd });
    expect(r.stdout).toBe('hi\n');
  });

  it('imports a module from the cwd', async () => {
    await fs.writeFile(path.join(cwd, 'helper.py'), 'VALUE = 7\n', 'utf8');
    const r = await runPython('import helper\nprint(helper.VALUE)', { cwd });
    expect(r.stdout).toBe('7\n');
    expect(r.exitCode).toBe(0);
  });
});
