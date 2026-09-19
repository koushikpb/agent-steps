import { promises as fs } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { applyEdit, createWorkspace, resolveInside, type Workspace } from '../../lib/workspace';

let ws: Workspace | null = null;
afterEach(async () => { await ws?.cleanup(); ws = null; });

describe('workspace', () => {
  it('copies the template files into a temp dir and cleans up', async () => {
    ws = await createWorkspace();
    const names = (await fs.readdir(ws.dir)).sort();
    expect(names).toEqual(['sales.csv', 'summarize.py']);
    const dir = ws.dir;
    await ws.cleanup();
    ws = null;
    await expect(fs.stat(dir)).rejects.toThrow();
  });

  it('confines paths to the workspace', () => {
    expect(resolveInside('/w', 'summarize.py')).toBe(path.resolve('/w', 'summarize.py'));
    expect(resolveInside('/w', '../etc/passwd')).toBeNull();
    expect(resolveInside('/w', '/etc/passwd')).toBeNull();
    expect(resolveInside('/w', '.')).toBeNull();
  });

  it('applies a unique replacement and returns a unified diff', async () => {
    ws = await createWorkspace();
    const r = await applyEdit(ws.dir, {
      path: 'summarize.py',
      old_text: 'totals[month] += float(row["quantity"])  # BUG: ignores unit_price',
      new_text: 'totals[month] += float(row["quantity"]) * float(row["unit_price"])',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.diff).toContain('-        totals[month] += float(row["quantity"])  # BUG: ignores unit_price');
    expect(r.diff).toContain('+        totals[month] += float(row["quantity"]) * float(row["unit_price"])');
    const after = await fs.readFile(path.join(ws.dir, 'summarize.py'), 'utf8');
    expect(after).toContain('* float(row["unit_price"])');
  });

  it('rejects missing files, missing text, and ambiguous text', async () => {
    ws = await createWorkspace();
    expect(await applyEdit(ws.dir, { path: 'nope.py', old_text: 'a', new_text: 'b' })).toEqual({ ok: false, error: 'no such file: nope.py' });
    expect(await applyEdit(ws.dir, { path: 'summarize.py', old_text: 'zzz', new_text: 'b' })).toEqual({ ok: false, error: 'old_text not found in file' });
    expect(await applyEdit(ws.dir, { path: 'summarize.py', old_text: 'import', new_text: 'b' })).toEqual({ ok: false, error: 'old_text occurs more than once; include more context' });
    expect(await applyEdit(ws.dir, { path: '../x', old_text: 'a', new_text: 'b' })).toEqual({ ok: false, error: 'path escapes the workspace: ../x' });
  });
});
