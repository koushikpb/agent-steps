import type { AgentEvent, ChartSpec, ToolName } from './events';

export type Step = {
  id: string;
  tool: ToolName;
  label: string;
  status: 'running' | 'ok' | 'error';
  code: string;
  output: string;
  diff: string | null;
  chart: ChartSpec | null;
  durationMs: number | null;
};

export type ChatState = {
  status: 'idle' | 'streaming' | 'done' | 'error';
  text: string;
  steps: Step[];
  error: string | null;
};

export const initialState: ChatState = { status: 'idle', text: '', steps: [], error: null };

export type ChatAction = { type: 'reset' } | { type: 'event'; event: AgentEvent };

function updateStep(steps: Step[], id: string, patch: (step: Step) => Step): Step[] {
  return steps.map((step) => (step.id === id ? patch(step) : step));
}

/** Pure, immutable: only the step named by the event gets a new object. */
export function applyEvent(state: ChatState, event: AgentEvent): ChatState {
  switch (event.type) {
    case 'text_delta':
      return { ...state, status: 'streaming', text: state.text + event.text };
    case 'step_started':
      return {
        ...state,
        status: 'streaming',
        steps: [...state.steps, { id: event.stepId, tool: event.tool, label: event.label, status: 'running', code: '', output: '', diff: null, chart: null, durationMs: null }],
      };
    case 'step_delta':
      return { ...state, steps: updateStep(state.steps, event.stepId, (s) => ({ ...s, code: s.code + event.text })) };
    case 'step_done':
      return {
        ...state,
        steps: updateStep(state.steps, event.stepId, (s) => ({ ...s, label: event.label, status: event.status, output: event.output, diff: event.diff, durationMs: event.durationMs })),
      };
    case 'chart':
      return { ...state, steps: updateStep(state.steps, event.stepId, (s) => ({ ...s, chart: event.spec })) };
    case 'done':
      return { ...state, status: 'done' };
    case 'error':
      return { ...state, status: 'error', error: event.message };
  }
}

export function reducer(state: ChatState, action: ChatAction): ChatState {
  return action.type === 'reset' ? initialState : applyEvent(state, action.event);
}
