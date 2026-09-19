export type DiffLineKind = 'header' | 'hunk' | 'add' | 'del' | 'context';

export function classifyDiffLine(line: string): DiffLineKind {
  if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('Index:') || line.startsWith('===')) return 'header';
  if (line.startsWith('@@')) return 'hunk';
  if (line.startsWith('+')) return 'add';
  if (line.startsWith('-')) return 'del';
  return 'context';
}

export function splitDiff(diff: string): { kind: DiffLineKind; text: string }[] {
  return diff.replace(/\n$/, '').split('\n').map((text) => ({ kind: classifyDiffLine(text), text }));
}
