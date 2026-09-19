import { afterEach, describe, expect, it } from 'vitest';
import { POST } from '../../app/api/chat/route';
import { AgentEvent } from '../../lib/events';
import { SseParser } from '../../lib/sse';

function post(body: unknown): Promise<Response> {
  return POST(new Request('http://localhost/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
}

afterEach(() => { delete process.env.ALLOW_LIVE; });

describe('POST /api/chat', () => {
  it('streams a replayed fixture as SSE events', async () => {
    const res = await post({ prompt: 'ignored in replay', mode: 'replay', fixture: 'mini', speed: 1000 });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/event-stream; charset=utf-8');
    expect(res.headers.get('cache-control')).toBe('no-cache, no-transform');
    const parser = new SseParser();
    const events = parser.push(await res.text()).map((raw) => AgentEvent.parse(raw));
    const types = events.map((e) => e.type);
    expect(types).toContain('step_started');
    expect(types).toContain('step_done');
    expect(types[types.length - 1]).toBe('done');
  });

  it('rejects an invalid body', async () => {
    expect((await post({ mode: 'replay' })).status).toBe(400);
  });

  it('refuses live mode unless ALLOW_LIVE=1', async () => {
    expect((await post({ prompt: 'hi', mode: 'live' })).status).toBe(403);
  });

  it('returns 404 for an unknown fixture', async () => {
    expect((await post({ prompt: 'hi', mode: 'replay', fixture: 'nope' })).status).toBe(404);
  });
});
