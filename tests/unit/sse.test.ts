import { describe, expect, it } from 'vitest';
import { SseParser, encodeSse } from '../../lib/sse';

describe('SSE codec', () => {
  it('encodes one frame per event', () => {
    expect(encodeSse({ type: 'done' })).toBe('data: {"type":"done"}\n\n');
  });

  it('parses frames split across chunks and ignores non-data lines', () => {
    const parser = new SseParser();
    const frames = encodeSse({ type: 'text_delta', text: 'a' }) + ': comment\n\n' + encodeSse({ type: 'done' });
    const out = [...parser.push(frames.slice(0, 7)), ...parser.push(frames.slice(7, 30)), ...parser.push(frames.slice(30))];
    expect(out).toEqual([{ type: 'text_delta', text: 'a' }, { type: 'done' }]);
  });
});
