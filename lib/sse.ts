import type { AgentEvent } from './events';

export function encodeSse(event: AgentEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/** Incremental parser for `data: <json>\n\n` frames. Returns the parsed JSON of each complete frame. */
export class SseParser {
  private buffer = '';

  push(chunk: string): unknown[] {
    this.buffer += chunk;
    const out: unknown[] = [];
    let idx = this.buffer.indexOf('\n\n');
    while (idx !== -1) {
      const frame = this.buffer.slice(0, idx);
      this.buffer = this.buffer.slice(idx + 2);
      const data = frame
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n');
      if (data.length > 0) out.push(JSON.parse(data));
      idx = this.buffer.indexOf('\n\n');
    }
    return out;
  }
}
