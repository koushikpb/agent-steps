import { describe, expect, it } from 'vitest';
import { classifyDiffLine, splitDiff } from '../../lib/diff-lines';

describe('diff lines', () => {
  it('classifies unified diff lines', () => {
    expect(classifyDiffLine('Index: a.py')).toBe('header');
    expect(classifyDiffLine('===')).toBe('header');
    expect(classifyDiffLine('--- a.py')).toBe('header');
    expect(classifyDiffLine('+++ a.py')).toBe('header');
    expect(classifyDiffLine('@@ -1,3 +1,3 @@')).toBe('hunk');
    expect(classifyDiffLine('+new')).toBe('add');
    expect(classifyDiffLine('-old')).toBe('del');
    expect(classifyDiffLine(' same')).toBe('context');
  });
  it('splits a diff and drops the trailing newline', () => {
    expect(splitDiff('@@ -1 +1 @@\n-a\n+b\n')).toEqual([
      { kind: 'hunk', text: '@@ -1 +1 @@' },
      { kind: 'del', text: '-a' },
      { kind: 'add', text: '+b' },
    ]);
  });
});
