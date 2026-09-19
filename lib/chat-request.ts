import { z } from 'zod';

const NAME = z.string().regex(/^[a-z0-9-]{1,40}$/);

export const ChatBody = z.object({
  prompt: z.string().min(1).max(2000),
  mode: z.enum(['live', 'replay']),
  fixture: NAME.default('demo'),
  parser: z.enum(['buffered', 'streaming']).default('streaming'),
  speed: z.number().min(0.1).max(1000).default(1),
  record: NAME.optional(),
});
export type ChatBody = z.infer<typeof ChatBody>;

export function liveEnabled(): boolean {
  return process.env.ALLOW_LIVE === '1';
}
