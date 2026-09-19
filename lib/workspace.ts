import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createTwoFilesPatch } from 'diff';

export const TEMPLATE_DIR = path.join(process.cwd(), 'workspace');

export type Workspace = { dir: string; cleanup(): Promise<void> };

export async function createWorkspace(template: string = TEMPLATE_DIR): Promise<Workspace> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-steps-'));
  for (const name of await fs.readdir(template)) {
    await fs.copyFile(path.join(template, name), path.join(dir, name));
  }
  return { dir, cleanup: () => fs.rm(dir, { recursive: true, force: true }) };
}

/** Resolves a model-supplied relative path and returns null if it is the dir itself or escapes it. */
export function resolveInside(dir: string, relPath: string): string | null {
  const target = path.resolve(dir, relPath);
  const rel = path.relative(dir, target);
  if (rel === '' || rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) return null;
  return target;
}

export type EditResult = { ok: true; diff: string } | { ok: false; error: string };

export async function applyEdit(dir: string, input: { path: string; old_text: string; new_text: string }): Promise<EditResult> {
  const target = resolveInside(dir, input.path);
  if (!target) return { ok: false, error: `path escapes the workspace: ${input.path}` };
  let before: string;
  try {
    before = await fs.readFile(target, 'utf8');
  } catch {
    return { ok: false, error: `no such file: ${input.path}` };
  }
  const first = before.indexOf(input.old_text);
  if (first === -1) return { ok: false, error: 'old_text not found in file' };
  if (before.indexOf(input.old_text, first + 1) !== -1) return { ok: false, error: 'old_text occurs more than once; include more context' };
  const after = before.slice(0, first) + input.new_text + before.slice(first + input.old_text.length);
  await fs.writeFile(target, after, 'utf8');
  return { ok: true, diff: createTwoFilesPatch(input.path, input.path, before, after) };
}
