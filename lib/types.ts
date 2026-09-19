import type Anthropic from '@anthropic-ai/sdk';
import type { ChartSpec, ToolName } from './events';

export type StreamEvent = Anthropic.Messages.RawMessageStreamEvent;
export type ParserMode = 'buffered' | 'streaming';

export interface ModelTurn {
  events: AsyncIterable<StreamEvent>;
  final(): Promise<Anthropic.Message>;
}
export interface ModelSource {
  turn(messages: Anthropic.MessageParam[]): ModelTurn;
}

export type ToolOutcome = {
  resultText: string; // what goes back to the model as tool_result content
  isError: boolean;
  output: string; // stdout/stderr shown in the step
  diff: string | null;
  chart: ChartSpec | null;
  durationMs: number;
};
export type ToolExecutor = (name: ToolName, input: unknown, toolUseId: string) => Promise<ToolOutcome>;

export type FixtureEvent = { t: number; event: StreamEvent };
export type FixtureTurn = { events: FixtureEvent[]; final: Anthropic.Message };
export type Fixture = {
  version: 1;
  prompt: string;
  recordedAt: string;
  turns: FixtureTurn[];
  toolResults: Record<string, ToolOutcome>;
};

export interface Recorder {
  beginTurn(): void;
  event(e: StreamEvent): void;
  endTurn(final: Anthropic.Message): void;
  tool(toolUseId: string, outcome: ToolOutcome): void;
}
