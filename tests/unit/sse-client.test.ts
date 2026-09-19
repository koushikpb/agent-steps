import { describe, expect, it } from 'vitest';
import type { AgentEvent } from '../../lib/events';
import { encodeSse } from '../../lib/sse';
import { readEventStream } from '../../lib/sse-client';

function bodyFrom(text: string, chunkSize: number): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  let offset = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= bytes.length) { controller.close(); return; }
      controller.enqueue(bytes.slice(offset, offset + chunkSize));
      offset += chunkSize;
    },
  });
}

describe('readEventStream', () => {
  it('parses and validates events across arbitrary chunk boundaries', async () => {
    const text = encodeSse({ type: 'text_delta', text: 'héllo' }) + 'data: {"type":"bogus"}\n\n' + encodeSse({ type: 'done' });
    const events: AgentEvent[] = [];
    await readEventStream(bodyFrom(text, 3), (e) => events.push(e));
    expect(events).toEqual([{ type: 'text_delta', text: 'héllo' }, { type: 'done' }]);
  });
});
