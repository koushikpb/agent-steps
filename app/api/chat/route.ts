import Anthropic from '@anthropic-ai/sdk';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { runAgent } from '../../../lib/agent';
import { ChatBody, liveEnabled } from '../../../lib/chat-request';
import type { AgentEvent } from '../../../lib/events';
import { liveExecutor } from '../../../lib/executor';
import { loadFixture } from '../../../lib/fixtures';
import { liveSource } from '../../../lib/live';
import { createRecorder } from '../../../lib/recorder';
import { replayExecutor, replaySource } from '../../../lib/replay';
import { encodeSse } from '../../../lib/sse';
import { createWorkspace } from '../../../lib/workspace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Seconds. A full-speed replay streams for the length of the recorded run (under 120 s); lower this if the Vercel plan rejects it.
export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  const body = ChatBody.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: 'invalid body' }, { status: 400 });
  const { prompt, mode, parser, speed, record } = body.data;
  if (mode === 'live' && !liveEnabled()) return Response.json({ error: 'live mode is disabled; set ALLOW_LIVE=1' }, { status: 403 });
  const fixture = mode === 'replay' ? await loadFixture(body.data.fixture) : null;
  if (mode === 'replay' && !fixture) return Response.json({ error: 'unknown fixture' }, { status: 404 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      request.signal.addEventListener('abort', () => { closed = true; });
      const emit = (event: AgentEvent) => {
        if (!closed) controller.enqueue(encoder.encode(encodeSse(event)));
      };
      let workspace: Awaited<ReturnType<typeof createWorkspace>> | null = null;
      const recording = !fixture && record ? createRecorder(prompt) : null;
      try {
        if (!fixture) workspace = await createWorkspace();
        if (fixture) {
          await runAgent({ prompt: fixture.prompt, source: replaySource(fixture, speed), execute: replayExecutor(fixture, speed), emit, parser });
        } else if (workspace) {
          await runAgent({ prompt, source: liveSource(new Anthropic()), execute: liveExecutor(workspace.dir), emit, parser, recorder: recording?.recorder });
          if (recording && record) {
            await fs.writeFile(path.join(process.cwd(), 'fixtures', `${record}.json`), JSON.stringify(recording.toFixture()), 'utf8');
          }
        }
      } catch (err) {
        emit({ type: 'error', message: err instanceof Error ? err.message : String(err) });
      } finally {
        await workspace?.cleanup();
        closed = true;
        try {
          controller.close();
        } catch {
          // the client already cancelled the stream
        }
      }
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
