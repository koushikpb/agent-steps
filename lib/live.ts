import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from './system-prompt';
import { TOOLS } from './tools';
import type { ModelSource, ModelTurn } from './types';

export const MODEL = 'claude-sonnet-5';
export const MAX_TOKENS = 32000; // headroom for thinking if it is enabled; the recorded demo run used none

/** Streams one model turn per call through the Anthropic SDK; the client reads ANTHROPIC_API_KEY from the environment. */
export function liveSource(client: Anthropic): ModelSource {
  return {
    turn(messages): ModelTurn {
      const stream = client.messages.stream({ model: MODEL, max_tokens: MAX_TOKENS, system: SYSTEM_PROMPT, tools: TOOLS, messages });
      return { events: stream, final: () => stream.finalMessage() };
    },
  };
}
