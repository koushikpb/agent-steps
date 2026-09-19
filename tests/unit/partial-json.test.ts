import { describe, expect, it } from 'vitest';
import { extractStringField } from '../../lib/partial-json';

describe('extractStringField', () => {
  it('reads a complete value', () => {
    expect(extractStringField('{"code":"print(1)"}', 'code')).toBe('print(1)');
  });
  it('reads a value cut off mid-string', () => {
    expect(extractStringField('{"code": "pri', 'code')).toBe('pri');
  });
  it('skips earlier properties', () => {
    expect(extractStringField('{"path":"a.py","old_text":"x","new_text":"y = 1\\n', 'new_text')).toBe('y = 1\n');
  });
  it('ignores the key when it appears inside another value', () => {
    expect(extractStringField('{"old_text":"say \\"code\\": 1","code":"ok"}', 'code')).toBe('ok');
  });
  it('ignores nested objects', () => {
    expect(extractStringField('{"meta":{"code":"no"},"code":"yes"}', 'code')).toBe('yes');
  });
  it('drops an incomplete escape at the cut and completes it later', () => {
    expect(extractStringField('{"code":"a\\', 'code')).toBe('a');
    expect(extractStringField('{"code":"a\\n', 'code')).toBe('a\n');
    expect(extractStringField('{"code":"\\u00e', 'code')).toBe('');
    expect(extractStringField('{"code":"\\u00e9"}', 'code')).toBe('é');
  });
  it('returns empty when the key is absent or not started', () => {
    expect(extractStringField('{"path":"a.py"}', 'code')).toBe('');
    expect(extractStringField('{"co', 'code')).toBe('');
  });
  it('grows monotonically over prefixes', () => {
    const full = '{"path":"s.py","code":"x = \\"q\\"\\nprint(x)"}';
    const final = extractStringField(full, 'code');
    let prev = '';
    for (let i = 0; i <= full.length; i++) {
      const cur = extractStringField(full.slice(0, i), 'code');
      expect(cur.startsWith(prev)).toBe(true);
      expect(final.startsWith(cur)).toBe(true);
      prev = cur;
    }
  });
});
