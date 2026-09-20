import type Anthropic from '@anthropic-ai/sdk';
import { DONE_LABELS, RUNNING_LABELS, TOOL_NAMES, type AgentEvent, type ToolName } from './events';
import { extractStringField } from './partial-json';
import { STREAM_FIELD } from './tools';
import type { ModelSource, ParserMode, Recorder, ToolExecutor } from './types';

export const MAX_TURNS = 8;

export type RunAgentOptions = {
  prompt: string;
  source: ModelSource;
  execute: ToolExecutor;
  emit: (event: AgentEvent) => void;
  parser: ParserMode;
  recorder?: Recorder;
  maxTurns?: number;
};

type OpenBlock = { id: string; name: ToolName; json: string; emitted: number };

function isToolName(name: string): name is ToolName {
  return (TOOL_NAMES as readonly string[]).includes(name);
}

function parseField(json: string, field: string): string {
  try {
    const value = (JSON.parse(json) as Record<string, unknown>)[field];
    return typeof value === 'string' ? value : '';
  } catch {
    return '';
  }
}

/**
 * Drives model turns until the model stops calling tools. `parser` decides when a step
 * becomes visible: 'streaming' emits step_started at content_block_start and a step_delta
 * for every input_json_delta; 'buffered' waits for content_block_stop and one JSON.parse.
 */
export async function runAgent(opts: RunAgentOptions): Promise<void> {
  const { source, execute, emit, parser, recorder } = opts;
  const maxTurns = opts.maxTurns ?? MAX_TURNS;
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: opts.prompt }];
  let finishedCleanly = false;
  let sawTextBlock = false;
  try {
    for (let turn = 0; turn < maxTurns; turn++) {
      const current = source.turn(messages);
      const open = new Map<number, OpenBlock>();
      const pendingTextSeparator = new Set<number>();
      recorder?.beginTurn();
      for await (const ev of current.events) {
        recorder?.event(ev);
        if (ev.type === 'content_block_start') {
          if (ev.content_block.type === 'text') {
            if (sawTextBlock) pendingTextSeparator.add(ev.index);
            sawTextBlock = true;
            continue;
          }
          if (ev.content_block.type !== 'tool_use' || !isToolName(ev.content_block.name)) continue;
          const block: OpenBlock = { id: ev.content_block.id, name: ev.content_block.name, json: '', emitted: 0 };
          open.set(ev.index, block);
          if (parser === 'streaming') emit({ type: 'step_started', stepId: block.id, tool: block.name, label: RUNNING_LABELS[block.name] });
        } else if (ev.type === 'content_block_delta') {
          if (ev.delta.type === 'text_delta') {
            const sep = pendingTextSeparator.delete(ev.index) ? '\n\n' : '';
            emit({ type: 'text_delta', text: sep + ev.delta.text });
            continue;
          }
          const block = open.get(ev.index);
          if (!block || ev.delta.type !== 'input_json_delta') continue;
          block.json += ev.delta.partial_json;
          const field = STREAM_FIELD[block.name];
          if (parser === 'streaming' && field) {
            const value = extractStringField(block.json, field);
            if (value.length > block.emitted) {
              emit({ type: 'step_delta', stepId: block.id, field: 'code', text: value.slice(block.emitted) });
              block.emitted = value.length;
            }
          }
        } else if (ev.type === 'content_block_stop') {
          const block = open.get(ev.index);
          if (!block || parser !== 'buffered') continue;
          emit({ type: 'step_started', stepId: block.id, tool: block.name, label: RUNNING_LABELS[block.name] });
          const field = STREAM_FIELD[block.name];
          if (field) emit({ type: 'step_delta', stepId: block.id, field: 'code', text: parseField(block.json, field) });
        }
      }
      const final = await current.final();
      recorder?.endTurn(final);
      const toolUses = final.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
      if (final.stop_reason === 'refusal') {
        emit({ type: 'error', message: 'The model declined this request.' });
        return;
      }
      if (final.stop_reason === 'max_tokens' && toolUses.length > 0) {
        emit({ type: 'error', message: 'Tool input was cut off at max_tokens; try a smaller task.' });
        return;
      }
      if (final.stop_reason === 'max_tokens') {
        emit({ type: 'error', message: 'The answer was cut off at max_tokens; try a smaller task.' });
        return;
      }
      if (toolUses.length === 0) { finishedCleanly = true; break; }
      messages.push({ role: 'assistant', content: final.content });
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const use of toolUses) {
        if (!isToolName(use.name)) {
          results.push({ type: 'tool_result', tool_use_id: use.id, content: `unknown tool ${use.name}`, is_error: true });
          continue;
        }
        const outcome = await execute(use.name, use.input, use.id);
        recorder?.tool(use.id, outcome);
        emit({
          type: 'step_done',
          stepId: use.id,
          label: DONE_LABELS[use.name],
          status: outcome.isError ? 'error' : 'ok',
          output: outcome.output,
          diff: outcome.diff,
          durationMs: outcome.durationMs,
        });
        if (outcome.chart) emit({ type: 'chart', stepId: use.id, spec: outcome.chart });
        results.push({ type: 'tool_result', tool_use_id: use.id, content: outcome.resultText, is_error: outcome.isError });
      }
      messages.push({ role: 'user', content: results });
    }
    if (finishedCleanly) {
      emit({ type: 'done' });
    } else {
      emit({ type: 'error', message: `Stopped after ${maxTurns} model turns; the task did not finish.` });
    }
  } catch (err) {
    emit({ type: 'error', message: err instanceof Error ? err.message : String(err) });
  }
}
