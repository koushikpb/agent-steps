# agent-steps

A streaming "tool steps" UI kit for code-running agents. An agent streams typed step events over SSE, and a React UI renders them as collapsible steps with code, a diff, and one interactive chart. I measure two optimizations before and after.

The six step labels ("Generating code → Generated code", and the rest) are quoted from https://julius.ai/docs/get-started/tools. Nothing else in Julius's UI is copied.

## Run it

```
npm install
npm run dev            # http://localhost:3117 — Replay mode plays a recorded run through the real pipeline
npm test               # unit tests; e2e: npx playwright install chromium && npx playwright test tests/e2e ; perf: npx playwright test tests/perf
```

Unit tests (`npm test`) and Live mode need a local `python3` (3.12+). The hosted replay demo needs none.

Live mode runs model-written Python on your machine. The runner is a bounded guard, not a security sandbox: the script runs as you, with your file access. `subprocess` and `os.system` are disabled, and the working directory is on `sys.path`, so scripts can import `summarize.py`. Live mode is off unless you set `ANTHROPIC_API_KEY` in `.env.local` (copy `.env.example`) and start with `ALLOW_LIVE=1 npm run dev`. Record a new fixture with `npm run record -- <name>` while the live server runs.

The dev server uses port 3117 and the scripts set `NEXT_TELEMETRY_DISABLED=1`. Stop a stray server with `lsof -ti tcp:3117 | xargs kill` before running the Playwright suites.

URL switches for the two optimizations: `?parser=buffered|streaming` and `?memo=off|on`; `?speed=N` (0.5 to 1000) scales replay timing.

## What was measured

Time-to-first-step, time-to-first-delta, and React Profiler commit count / render ms for the 2×2 grid {buffered, streaming parser} × {memo off, on}, produced by `npx playwright test tests/perf` (medians; details and definitions in `docs/perf.md`). The ~5.9 s common to every row is the recorded API's time to its first event, replayed as-is: 5.4 s before `message_start`, with no thinking tokens used. The streaming parser moves the step from the end of the tool-input stream to its start. That is 230 to 300 ms for this 81-character script (102 characters of tool-input JSON), and it scales with the length of the streamed code.

Each median is over 2 runs, so it is the mean of two. Run `PERF_RUNS=4 npx playwright test tests/perf` for more.

## Demo

![Demo (recorded run replayed at half speed, condensed to 22 s)](docs/demo.gif)

## Performance (from docs/perf.md)

| parser | memo | time-to-first-step (ms) | time-to-first-delta (ms) | Profiler commits | Profiler render (ms) | events | total (ms) |
|---|---|---|---|---|---|---|---|
| buffered | off | 6174 | 6175 | 37 | 70 | 56 | 25877 |
| streaming | off | 5874 | 5878 | 46 | 76 | 67 | 25806 |
| buffered | on | 6107 | 6107 | 40 | 17 | 56 | 25815 |
| streaming | on | 5868 | 5873 | 48 | 22 | 67 | 25790 |
