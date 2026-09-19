import type { Fixture, FixtureEvent, ModelSource, ModelTurn, StreamEvent, ToolExecutor } from './types';

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function* timed(events: FixtureEvent[], speed: number): AsyncGenerator<StreamEvent> {
  let last = 0;
  for (const { t, event } of events) {
    const wait = (t - last) / speed;
    if (wait > 0) await sleep(wait);
    last = t;
    yield event;
  }
}

/** Plays a recorded fixture's raw model events back with their original gaps divided by `speed`. */
export function replaySource(fixture: Fixture, speed: number): ModelSource {
  let index = 0;
  return {
    turn(): ModelTurn {
      const turn = fixture.turns[index];
      if (!turn) throw new Error(`fixture has no turn ${index}`);
      index += 1;
      return { events: timed(turn.events, speed), final: async () => turn.final };
    },
  };
}

/** Returns the recorded outcome for each tool_use id after its recorded duration divided by `speed`. */
export function replayExecutor(fixture: Fixture, speed: number): ToolExecutor {
  return async (_name, _input, toolUseId) => {
    const outcome = fixture.toolResults[toolUseId];
    if (!outcome) throw new Error(`fixture has no tool result for ${toolUseId}`);
    await sleep(outcome.durationMs / speed);
    return outcome;
  };
}
