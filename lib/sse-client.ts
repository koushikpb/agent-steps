import { AgentEvent } from './events';
import { SseParser } from './sse';

/** Reads an SSE response body and calls onEvent for every frame that validates as an AgentEvent. */
export async function readEventStream(body: ReadableStream<Uint8Array>, onEvent: (event: AgentEvent) => void): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const parser = new SseParser();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    for (const raw of parser.push(decoder.decode(value, { stream: true }))) {
      const parsed = AgentEvent.safeParse(raw);
      if (parsed.success) onEvent(parsed.data);
    }
  }
}
