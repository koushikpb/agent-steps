# Performance

Generated 2026-09-19T23:51:52.816Z by `npx playwright test tests/perf` against `next dev` (the React Profiler is disabled in production builds, so these are development-mode numbers: compare rows, not absolutes). Fixture: `demo`, replay speed 1x, 2 runs per configuration, medians.

| parser | memo | time-to-first-step (ms) | time-to-first-delta (ms) | Profiler commits | Profiler render (ms) | events | total (ms) |
|---|---|---|---|---|---|---|---|
| buffered | off | 6174 | 6175 | 37 | 70 | 56 | 25877 |
| streaming | off | 5874 | 5878 | 46 | 76 | 67 | 25806 |
| buffered | on | 6107 | 6107 | 40 | 17 | 56 | 25815 |
| streaming | on | 5868 | 5873 | 48 | 22 | 67 | 25790 |

Definitions: time-to-first-step = ms from clicking Run to the first `step_started` event parsed on the client; time-to-first-delta = ms to the first `step_delta`; Profiler commits and render ms = count and sum of `actualDuration` over every commit of the `<Profiler id="steps">` subtree.

Streaming JSON parsing (`parser=streaming`) moves time-to-first-step and time-to-first-delta: the step appears at `content_block_start` and code streams from each `input_json_delta` through `extractStringField`, instead of one `JSON.parse` at `content_block_stop`. A memoized step list (`memo=on`: `memo(StepCardView)` plus a reducer that keeps untouched steps identical) lowers Profiler render ms for the same commit count.
