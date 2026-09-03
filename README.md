# Gym & Tonic: Your week, well trained.

**A weekly training planner where ChatGPT is your coach.** Fourteen session slots a week (Mon–Sun × AM/PM), planned together on one live grid: the agent proposes sessions, swaps them around, aggregates your gear list, and calls you out when leg day goes missing — every change staged as a reviewable proposal you approve.

Built for the [OpenAI WebMCP Challenge](https://webmcp.devpost.com/) in September 2026.

[Try the live Vercel deployment](https://gym-and-tonic-five.vercel.app/)

## Why

"What's for dinner?" got solved. "What's today's workout?" is still 14 open tabs, a notes app full of guilt, and a program you abandoned in week two. Gym & Tonic applies WebMCP to the same problem shape: **one shared canvas, an agent that does the planning drudgery, and a human who stays in charge of their own body.**

- The agent works at tool speed: fills empty days, balances muscle groups, sums your gear.
- Every write is a **staged proposal**: 🟢 new session, 🟡 swap, 🔴 callout ("No leg day?! The squats know what you did.").
- You approve, reject, or drag things around yourself. The coach suggests; you decide.

## The 17 WebMCP site tools

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
| `get_progress` | read-only | Returns planned versus completed volume, consistency, and guidance. |
| `get_training_history` | read-only | Returns locally stored completed weeks and reflections. |
| `list_templates` | read-only | Lists saved weekly rhythms without applying them. |
| `get_calendar_plan` | read-only | Prepares calendar-ready events and an iCalendar export without sending it anywhere. |

Registered via `document.modelContext.registerTool()`; all writes flow through one `applyProposal()` path so review UI and audit trail are automatic. The agent can never silently change your training week.

## Global fitness, familiar food

Gym & Tonic is English-led and designed for people starting or returning to exercise anywhere. Choose weight loss, general fitness, or building strength, then plan manageable sessions, optional walking and daily habits. Meal ideas span familiar plates from different food traditions, with dietary filters and practical descriptions. Suggestions are informational, not recipes, calorie prescriptions, or medical advice.

## Product experience

- `/` is the public product showcase.
- `/today` is the daily dashboard for the next workout, habits, and quick check-ins.
- `/plan` is the fourteen-slot weekly planner with proposals, templates, and calendar export.
- `/workout` is the focused guided-workout screen with optional timers and reflection.
- `/progress`, `/meals`, and `/settings` provide focused supporting views.
- `/tools`, `/privacy`, `/data`, and `/safety` remain available for agent tools, trust information, and local data controls.
- Plans, reflections, progress, and active workouts are stored in the browser. Users can export, restore, or explicitly delete their local data.

## Verification

Run `npm test`, `npm run check`, `npm run typecheck`, and `npm run build` for the application gates. Run `npm run test:e2e` for isolated Chromium and WebKit browser journeys; the suite uses deterministic local test data and never touches a user's saved plan. Chromium is the local default, while CI installs the full browser matrix.
- The app shell and curated editorial images are available after the first successful load, even when connectivity drops.
- Production-only Plausible analytics can measure high-level product actions. It never receives session content, notes, reflections, or history; users can opt out in Data controls.

Read [Privacy](/privacy), [Your data](/data), and [Safety](/safety) before a public launch. This product gives general training ideas, not medical or nutritional advice.

## Stack

Astro · React island · Zustand · Tailwind · WebMCP · Web Audio · Vercel. No backend, no accounts, no payments, MIT licensed.

## Run it locally

```bash
npm install
npm run dev
npm test
npm run check
npm run typecheck
npm run build
npm run test:e2e
```

The dev server runs at `http://localhost:4321`. The full experience is available in Chrome with WebMCP or in the ChatGPT desktop app's built-in browser. Without an agent it works as a manual planner.

## License

Gym & Tonic is released under the [MIT License](LICENSE).
