# agent-steps

A streaming "tool steps" UI kit for code-running agents: typed step events over SSE, rendered as collapsible steps with code, diff, and one chart artifact, with a measured performance write-up. It answers a job posting that asks for "streaming UIs, and performance profiling" (https://www.workatastartup.com/jobs/93234) and the step-labeled interface described at https://julius.ai/docs/get-started/tools.

Built by Koushik Karthikeyan as a skills demonstration. Every line is owned and understood by the author.

## Commands
- Install: TBD (planner fills in; expected `npm install`)
- Test: TBD (expected `npm test`; e2e `npx playwright test`)
- Run: TBD (expected `npm run dev`)
- Lint / typecheck: TBD (expected `npm run lint && npx tsc --noEmit`)

## Stack and versions
- TypeScript, Next.js (App Router), Tailwind CSS, zod, Anthropic SDK with tools, SSE from a route handler, Plotly for the chart artifact, Python 3.12 runner as a local subprocess with a timeout, Playwright for e2e, Vercel free tier for the deploy. Exact versions come from `docs/plan.md`; update this line when they are pinned.

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
