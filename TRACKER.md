# TRACKER — agent-steps
Company: Julius · Idea: #1 `agent-steps` streaming tool-steps UI kit + perf write-up · Effort budget: M, ~14 hours
Spec: docs/superpowers/specs/2026-09-19-julius-design.md · Plan: docs/superpowers/plans/2026-09-19-julius.md · Review: docs/plan-review.md (round –, verdict –)
Planner: Fable 5.1 (claude-fable-5-1) · Reviewer: Fable 5.1, fresh context · Implementers: Sonnet 5 (claude-sonnet-5)

## Phases
| Phase | Status | Notes |
|---|---|---|
| 0 Workspace (git, CLAUDE.md, TRACKER.md, api-notes) | done | .gitignore 937f756; CLAUDE.md, TRACKER.md, docs/api-notes.md committed 2026-09-19 by the composer |
| 1 Design + plan (Fable) | done | revised after round 1 (2026-09-19) |
| 2 Plan review, fresh context (Fable) | done | round 1: REVISE (1 blocker, 7 major, 9 minor; all addressed); round 2: REVISE (1 blocker, 4 major, 7 minor; all addressed, verified by composer grep); no round 3 (user's choice); composer ruling APPROVE |
| 3 Go from user (recorded by /plan-demo) | done | Go: 2026-09-19 by user, in the composer session |
| 4 Execute tasks (Superpowers subagent-driven-development, Sonnet 5) | todo | |
| 5 Verify (tests, e2e/smoke, GIF) | todo | |
| 6 Specialist review + fixes | todo | |
| 7 README, demo-summary.md, tracker | todo | |

## Tasks
| # | Task | Files | Test | Status | Model | Commit | Notes |
|---|---|---|---|---|---|---|---|
| 1 | Project scaffold and pinned dependencies | package.json, tsconfig.json, next.config.ts, postcss.config.mjs, vitest.config.ts, .env.example, .gitignore, app/layout.tsx, app/globals.css, app/page.tsx | tests/unit/pins.test.ts | todo | sonnet | | verifies all 16 pins with `npm view <pkg>@<ver> version` before install (same-major, else newest); dev on port 3117 with NEXT_TELEMETRY_DISABLED=1; no dev-server smoke |
| 2 | Event schemas, labels, SSE codec | lib/events.ts, lib/sse.ts | tests/unit/events.test.ts, tests/unit/sse.test.ts | todo | sonnet | | |
| 3 | Streaming JSON string-field extractor | lib/partial-json.ts | tests/unit/partial-json.test.ts | todo | sonnet | | |
| 4 | Tool definitions, shared types, system prompt | lib/tools.ts, lib/types.ts, lib/system-prompt.ts | tests/unit/tools.test.ts | todo | sonnet | | tsc verifies `eager_input_streaming` typing in SDK 0.110.0 |
| 5 | Sample workspace and edit_file with unified diff | workspace/sales.csv, workspace/summarize.py, lib/workspace.ts | tests/unit/workspace.test.ts | todo | sonnet | | |
| 6 | Local Python runner | runner/sandbox.py, lib/runner.ts | tests/unit/runner.test.ts | todo | sonnet | | needs python3 >= 3.12; checks RLIMIT constants first; tracebacks scrubbed of the sandbox's absolute path |
| 7 | Live tool executor | lib/executor.ts | tests/unit/executor.test.ts | todo | sonnet | | |
| 8 | Replay source, recorder, mini fixture | lib/replay.ts, lib/recorder.ts, fixtures/mini.json | tests/unit/replay.test.ts | todo | sonnet | | |
| 9 | Agent loop (buffered/streaming parsers) | lib/agent.ts | tests/unit/agent.test.ts | todo | sonnet | | |
| 10 | Live source, fixture registry, request schema, SSE route | lib/live.ts, lib/fixtures.ts, lib/chat-request.ts, app/api/chat/route.ts | tests/unit/route.test.ts | todo | sonnet | | POST only (GET cut); `maxDuration = 300`; `max_tokens` 32000 |
| 11 | Client state reducer | lib/reducer.ts | tests/unit/reducer.test.ts | todo | sonnet | | |
| 12 | Client stream reader, profiler stats, useAgentStream | lib/sse-client.ts, lib/profiler-stats.ts, lib/use-agent-stream.ts | tests/unit/sse-client.test.ts, tests/unit/profiler-stats.test.ts | todo | sonnet | | hook covered by e2e |
| 13 | DiffView and ChartArtifact (Plotly) | lib/diff-lines.ts, lib/plotly-figure.ts, types/plotly-dist-min.d.ts, components/DiffView.tsx, components/PlotlyPlot.tsx, components/ChartArtifact.tsx | tests/unit/diff-lines.test.ts, tests/unit/plotly-figure.test.ts | todo | sonnet | | |
| 14 | StepCard (memo/plain) and StepList with Profiler | components/StepCard.tsx, components/StepList.tsx | none (tsc; e2e in Task 15) | todo | sonnet | | |
| 15 | Chat page, URL settings, Playwright config, first e2e | lib/settings.ts, components/Chat.tsx, app/page.tsx, playwright.config.ts | tests/unit/settings.test.ts, tests/e2e/replay-mini.spec.ts | todo | sonnet | | explicit `npx playwright install chromium` step; Run button gated on hydration; `retries: 1` |
| 16 | Record script and demo fixture (one live run) | scripts/record.mjs, fixtures/demo.json, lib/fixtures.ts | tests/unit/fixture-demo.test.ts | todo | sonnet | | uses the API key; up to 3 recording attempts; fixture must replay < 120 s and hold no /Users/ path; dev server on :3117 via dev.log/dev.pid + node readiness loop |
| 17 | Second e2e test (label transition, three step types) | tests/e2e/demo.spec.ts | that file | todo | sonnet | | live-gate e2e cut (round 1, finding 17a) |
| 18 | Perf measurement writing docs/perf.json and docs/perf.md | tests/perf/perf.spec.ts, docs/perf.json, docs/perf.md | tests/perf/perf.spec.ts | todo | sonnet | | 8–16 min at speed 1, PERF_RUNS default 2; runs with run_in_background into perf.log |
| 19 | README, build check, deployability | README.md | npm run build + full test run | todo | sonnet | | Performance table appended by command from docs/perf.md |
| 20 | Record the 60-second demo | tests/video/demo-video.spec.ts, docs/demo.gif (or docs/demo.webm) | none | todo | sonnet | | main session uses `mcp__claude-in-chrome__gif_creator`, GIF copied (not moved) from ~/Downloads; fallback Playwright recordVideo → docs/demo.webm |

## Log
- 2026-09-19 00:16 a build session committed .gitignore (937f756), activated Serena, and created .env.local (ignored).
- 2026-09-19 00:22 the composer wrote CLAUDE.md and TRACKER.md from the plan-demo templates.
- 2026-09-19 composer gathered docs/api-notes.md (Julius tool labels, artifacts, containers; libraries to pin) and committed phase 0.
- 2026-09-19 planner (Fable 5.1) wrote the spec and the 20-task plan; Context7 verified the APIs used for next (v16.2.9), react (v19.2.7), zod (v4.0.1), vitest (v4.1.6), playwright (v1.61.0), node (v22.20.0), cpython (v3.13.9), and the untagged docs of @anthropic-ai/sdk, tailwindcss, react-plotly.js, plotly.js, jsdiff; version numbers for the untagged five come from their docs text or the claude-api skill and are checked by `npm view` in Task 1.
- 2026-09-19 round-1 review: REVISE. Planner revised the plan (smoke steps removed, all pins verified in Task 1, runner assertion fixed, dev server via dev.log/dev.pid + node readiness loop, `maxDuration = 300`, hydration-gated Run button + retries, GIF via gif_creator with Playwright video fallback, cuts: live-gate e2e, GET endpoint, settings span, PERF_RUNS 2) and the spec (thinking/max_tokens, maxDuration, replay-only hosted demo, Not doing).
- 2026-09-19 round-2 review: REVISE (1 blocker, 4 major, 7 minor). Planner revised: Bash-tool timeouts (`timeout: 600000`, perf run in the background into perf.log), MISSING-pin rule completed, dedicated port 3117 with `lsof` kill and `reuseExistingServer: false`, fixture length < 120 s and no-local-path assertions, sandbox traceback scrubbed, route start() catch, record.mjs stream-failure exit, README fixes (python3 for tests, port, fences), NEXT_TELEMETRY_DISABLED=1, GIF copied not moved, `.env.local` note dropped (verified by the reviewer).
- 2026-09-19 13:xx round-2 fixes applied by the planner; composer verified by grep; user gave the go. Tracker set to planned. Next: /build-demo julius.
