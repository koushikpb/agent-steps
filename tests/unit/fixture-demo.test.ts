import type Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it } from 'vitest';
import demo from '../../fixtures/demo.json';
import type { Fixture } from '../../lib/types';

const fixture = demo as unknown as Fixture;

describe('fixtures/demo.json', () => {
  it('is a complete run that used all three tools and drew a chart', () => {
    expect(fixture.version).toBe(1);
    expect(fixture.turns.length).toBeGreaterThanOrEqual(2);
    const uses = fixture.turns.flatMap((t) => t.final.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'));
    const names = new Set(uses.map((u) => u.name));
    expect(names).toEqual(new Set(['run_python', 'edit_file', 'make_chart']));
    for (const u of uses) expect(fixture.toolResults[u.id], u.id).toBeDefined();
    expect(Object.values(fixture.toolResults).some((o) => o.chart !== null)).toBe(true);
    expect(fixture.turns[fixture.turns.length - 1].final.stop_reason).toBe('end_turn');
    const deltas = fixture.turns.flatMap((t) => t.events.filter((e) => e.event.type === 'content_block_delta'));
    expect(deltas.length).toBeGreaterThan(20);
  });

  it('replays in under 120 s and contains no local path', () => {
    const totalMs =
      fixture.turns.reduce((s, t) => s + (t.events[t.events.length - 1]?.t ?? 0), 0) +
      Object.values(fixture.toolResults).reduce((s, o) => s + o.durationMs, 0);
    expect(totalMs).toBeLessThan(120_000); // every Playwright wait in the plan derives from this bound
    expect(JSON.stringify(fixture)).not.toContain('/Users/');
  });
});
