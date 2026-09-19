# agent-steps

A streaming "tool steps" UI kit for code-running agents: typed step events over SSE, rendered as collapsible steps with code, diff, and one chart artifact, with a measured performance write-up. It answers a job posting that asks for "streaming UIs, and performance profiling" (https://www.workatastartup.com/jobs/93234) and the step-labeled interface described at https://julius.ai/docs/get-started/tools.

Built by Koushik Karthikeyan as a skills demonstration. Every line is owned and understood by the author.

## Commands
- Install: `npm install` (Node 22; python3 >= 3.12 on PATH for the runner; `npx playwright install chromium` once for e2e)
- Test: `npx vitest run` (unit, `tests/unit/**/*.test.ts`); e2e `npx playwright test tests/e2e`; perf numbers `npx playwright test tests/perf` (writes `docs/perf.json` and `docs/perf.md`)
- Run: `npm run dev` (replay mode, http://localhost:3117, telemetry disabled by the script); live agent runs need `ALLOW_LIVE=1 npm run dev` plus `ANTHROPIC_API_KEY` in `.env.local`; record a fixture with `npm run record -- <name>` while the live server runs. Stop a stray server with `lsof -ti tcp:3117 | xargs kill 2>/dev/null || true` (never `pkill next`)
- Lint / typecheck: `npx tsc --noEmit` (no ESLint; TypeScript strict is the gate)

## Stack and versions
- TypeScript 5.9.2, Next.js 16.2.9 (App Router, route handler streaming `Response`), React 19.2.7 / react-dom 19.2.7, Tailwind CSS 4.1.10 (+ @tailwindcss/postcss 4.1.10), zod 4.0.1, @anthropic-ai/sdk 0.110.0 (`client.messages.stream`, tools with `eager_input_streaming`, model `claude-sonnet-5`), diff 9.1.0, react-plotly.js 4.1.0 + plotly.js-dist-min 4.1.0, Python 3.12 stdlib runner (`runner/sandbox.py`, `python3 -I`, 10 s timeout, 64 KiB output cap, no network), vitest 4.1.6, @playwright/test 1.61.0, Node 22. All pins exact; versions marked UNVERIFIED in the plan are checked with `npm view` in Task 1. Vercel deploy is replay-only (no server-side Python); see the spec's decision 3.

## Layout
- `app/`: Next.js routes; the chat page and the SSE route handler
- `components/`: step list, step card (code, diff, chart), chat input
- `lib/`: event schemas (zod), agent loop, tool definitions, Python runner client
- `runner/`: the local Python subprocess runner with a timeout and no network
- `tests/`: unit tests; `tests/e2e/`: Playwright
- `docs/superpowers/specs/` (spec), `docs/superpowers/plans/` (plan), `docs/plan-review.md`, `docs/api-notes.md`, `docs/screenshots/`, `docs/perf.md`
- `TRACKER.md`: task list and status; the session running the build updates it, subagents do not

## Rules for agents working in this repo
1. Read `TRACKER.md` and the task you were given before touching code. Do only that task.
2. Test first: write the failing test, make it pass, refactor, stop. No code without a test unless the task says "no test" and why.
3. Never write code against a library API from memory. Use Context7 or `docs/api-notes.md`; if the answer is not there, say so in the report instead of guessing.
4. No secrets in the repo. Read keys from env vars; keep `.env.example` current.
5. Boring, readable code. Match the conventions already in the repo. No new dependencies unless the task lists them.
6. Do not push, deploy, open PRs, or touch anything outside this directory.
7. Report at the end: files changed, test command and result, anything you could not verify, anything that surprised you.

## Scope
- In: a chat page where an agent (tools: `run_python`, `edit_file`, `make_chart`) streams typed events (`step_started`, `step_delta`, `step_done`, `chart`) over SSE; collapsible steps with code, diff, and a Plotly chart; a local Python runner with a timeout; a Performance section with React Profiler numbers and time-to-first-step before and after two optimizations (memoized step list, streaming JSON parsing); 1–3 Playwright e2e tests; Vercel deploy; 60-second GIF.
- Out: any copy of Julius's UI; more than one artifact type; a hosted or shared code executor; accounts or connectors; auth; persistence beyond the session. Left out on purpose and said so in the README.
