import { promises as fs } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import type { AgentStepsGlobal } from '../../lib/profiler-stats';

const SPEED = Number(process.env.PERF_SPEED ?? '1');
const RUNS = Number(process.env.PERF_RUNS ?? '2');
const CONFIGS = [
  { parser: 'buffered', memo: 'off' },
  { parser: 'streaming', memo: 'off' },
  { parser: 'buffered', memo: 'on' },
  { parser: 'streaming', memo: 'on' },
] as const;

type Sample = { parser: string; memo: string; ttfsMs: number; ttfdMs: number | null; totalMs: number; eventCount: number; commits: number; actualMs: number };
const samples: Sample[] = [];

test.describe.configure({ mode: 'serial' });

for (const cfg of CONFIGS) {
  test(`perf: parser=${cfg.parser} memo=${cfg.memo}`, async ({ page }) => {
    test.setTimeout(RUNS * 150_000);
    for (let i = 0; i < RUNS; i++) {
      await page.goto(`/?mode=replay&fixture=demo&speed=${SPEED}&parser=${cfg.parser}&memo=${cfg.memo}`);
      await page.getByTestId('run').click();
      await page.waitForFunction(
        () => (window as unknown as { __agentSteps?: AgentStepsGlobal }).__agentSteps?.metrics.totalMs != null,
        undefined,
        { timeout: 140_000 },
      );
      const stats = await page.evaluate(() => (window as unknown as { __agentSteps: AgentStepsGlobal }).__agentSteps);
      expect(stats.metrics.ttfsMs).not.toBeNull();
      samples.push({
        parser: cfg.parser,
        memo: cfg.memo,
        ttfsMs: stats.metrics.ttfsMs as number,
        ttfdMs: stats.metrics.ttfdMs,
        totalMs: stats.metrics.totalMs as number,
        eventCount: stats.metrics.eventCount,
        commits: stats.profiler.commits,
        actualMs: stats.profiler.actualMs,
      });
    }
  });
}

function median(xs: number[]): number {
  if (xs.length === 0) return NaN; // a config whose runs all failed; its row is skipped below
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

test.afterAll(async () => {
  const generatedAt = new Date().toISOString();
  const rows = CONFIGS.map((cfg) => {
    const mine = samples.filter((s) => s.parser === cfg.parser && s.memo === cfg.memo);
    const ttfd = mine.map((s) => s.ttfdMs).filter((v): v is number => v !== null);
    return {
      parser: cfg.parser,
      memo: cfg.memo,
      ttfsMs: median(mine.map((s) => s.ttfsMs)),
      ttfdMs: ttfd.length ? median(ttfd) : null,
      commits: median(mine.map((s) => s.commits)),
      actualMs: median(mine.map((s) => s.actualMs)),
      eventCount: median(mine.map((s) => s.eventCount)),
      totalMs: median(mine.map((s) => s.totalMs)),
    };
  });
  const docs = path.join(process.cwd(), 'docs');
  await fs.writeFile(path.join(docs, 'perf.json'), JSON.stringify({ generatedAt, speed: SPEED, runs: RUNS, samples, medians: rows }, null, 2), 'utf8');
  const n = (v: number | null) => (v === null ? 'n/a' : Math.round(v).toString());
  const table = rows.filter((r) => Number.isFinite(r.ttfsMs)).map((r) => `| ${r.parser} | ${r.memo} | ${n(r.ttfsMs)} | ${n(r.ttfdMs)} | ${n(r.commits)} | ${n(r.actualMs)} | ${n(r.eventCount)} | ${n(r.totalMs)} |`).join('\n');
  const md = `# Performance

Generated ${generatedAt} by \`npx playwright test tests/perf\` against \`next dev\` (the React Profiler is disabled in production builds, so these are development-mode numbers: compare rows, not absolutes). Fixture: \`demo\`, replay speed ${SPEED}x, ${RUNS} runs per configuration, medians.

| parser | memo | time-to-first-step (ms) | time-to-first-delta (ms) | Profiler commits | Profiler render (ms) | events | total (ms) |
|---|---|---|---|---|---|---|---|
${table}

Definitions: time-to-first-step = ms from clicking Run to the first \`step_started\` event parsed on the client; time-to-first-delta = ms to the first \`step_delta\`; Profiler commits and render ms = count and sum of \`actualDuration\` over every commit of the \`<Profiler id="steps">\` subtree.

Streaming JSON parsing (\`parser=streaming\`) moves time-to-first-step and time-to-first-delta: the step appears at \`content_block_start\` and code streams from each \`input_json_delta\` through \`extractStringField\`, instead of one \`JSON.parse\` at \`content_block_stop\`. A memoized step list (\`memo=on\`: \`memo(StepCardView)\` plus a reducer that keeps untouched steps identical) lowers Profiler render ms for the same commit count.
`;
  await fs.writeFile(path.join(docs, 'perf.md'), md, 'utf8');
});
