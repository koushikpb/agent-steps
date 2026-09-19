import type Anthropic from '@anthropic-ai/sdk';
import type { Fixture, FixtureEvent, FixtureTurn, Recorder, StreamEvent, ToolOutcome } from './types';

/** Collects raw model events (with ms offsets from the start of each turn) and tool outcomes into a Fixture. */
export function createRecorder(prompt: string, now: () => number = () => performance.now()): { recorder: Recorder; toFixture(): Fixture } {
  const turns: FixtureTurn[] = [];
  const toolResults: Record<string, ToolOutcome> = {};
  let events: FixtureEvent[] = [];
  let turnStart = 0;
  const recorder: Recorder = {
    beginTurn() { events = []; turnStart = now(); },
    event(e: StreamEvent) { events.push({ t: Math.round(now() - turnStart), event: e }); },
    endTurn(final: Anthropic.Message) { turns.push({ events, final }); },
    tool(toolUseId: string, outcome: ToolOutcome) { toolResults[toolUseId] = outcome; },
  };
  return {
    recorder,
    toFixture: () => ({ version: 1, prompt, recordedAt: new Date().toISOString(), turns, toolResults }),
  };
}
