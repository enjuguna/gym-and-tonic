# Gym & Tonic — "What's cooking today?" for your muscles

**A weekly training planner where ChatGPT is your coach.** Fourteen session slots a week (Mon–Sun × AM/PM), planned together on one live grid: the agent proposes sessions, swaps them around, aggregates your gear list, and calls you out when leg day goes missing — every change staged as a reviewable proposal you approve.

Built for the [OpenAI WebMCP Challenge](https://webmcp.devpost.com/) · September 2026.

## Why

"What's for dinner?" got solved. "What's today's workout?" is still 14 open tabs, a notes app full of guilt, and a program you abandoned in week two. Gym & Tonic applies WebMCP to the same problem shape: **one shared canvas, an agent that does the planning drudgery, and a human who stays in charge of their own body.**

- The agent works at tool speed: fills empty days, balances muscle groups, sums your gear.
- Every write is a **staged proposal**: 🟢 new session, 🟡 swap, 🔴 callout ("No leg day?! The squats know what you did.").
- You approve, reject, or drag things around yourself. The coach suggests; you decide.

## The 11 site tools

| Tool | Type | What it does |
|---|---|---|
| `get_week_plan` | read-only | The whole grid with focus/intensity/minutes per slot. |
| `list_exercises` | read-only | Catalogue filtered by muscle group / equipment. |
| `read_exercise` | read-only | Full entry incl. form cues. |
| `check_balance` | read-only | Minutes per group + neglected groups + a verdict with attitude. |
| `aggregate_gear` | read-only | One deduplicated equipment list for the planned week. |
| `suggest_session` | read-only | Generates a session for a focus group (no board changes). |
| `propose_session` | proposal | Stages a session into a slot for approval. |
| `swap_sessions` | proposal | Proposes exchanging two slots' contents. |
| `clear_slot` | proposal | Proposes resting that slot (rest is programming too). |
| `fill_week` | proposal | Proposes filling empty weekday evening slots as one approval. |
| `overload_report` | read-only | Compares this week with locally recorded history. |

Registered via `document.modelContext.registerTool()`; all writes flow through one `applyProposal()` path so review UI and audit trail are automatic. The agent can never silently change your training week.

## Kenyan at heart

Post-workout refuel suggestions come from home: ugali na ndengu, sukuma wiki rolls, githeri bowls, mukimo on leg day. The default cardio day is a Karura trail run.

## Stack

Astro · React island · Zustand · Tailwind · WebMCP · Web Audio · Vercel. No backend, no accounts, MIT licensed.

## Run it

```bash
npm install
npm run dev
npm test
npm run check
```

Full experience: Chrome with WebMCP or the ChatGPT desktop app's built-in browser. Without an agent it works as a manual planner.
