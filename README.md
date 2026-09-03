# Gym & Tonic

## Your week, well trained.

Gym & Tonic is a local-first fitness companion I built for people who keep saying, “I should really start working out,” and then somehow end up reorganising their entire phone instead.

It helps you plan a realistic week, follow guided workouts, reflect briefly, and notice the consistency you are building. No accounts. No backend. No guilt trip disguised as a notification.

[Try the live app](https://gym-and-tonic-five.vercel.app/)

Built for the [OpenAI WebMCP Challenge](https://webmcp.devpost.com/).

## Why I built it

Most fitness apps either give you too much information or make you feel like you have already failed before you begin.

I wanted to build something calmer and more useful. Gym & Tonic gives you one weekly board, one next action, and an optional AI coach that helps with the planning work while leaving the final decision with you.

The basic loop is simple:

1. Plan a manageable week.
2. Open a workout and follow it at your own pace.
3. Mark it complete and add a quick reflection.
4. Look back at the work you actually did.

## What it does

- Plans fourteen weekly slots across Monday to Sunday, morning and evening.
- Creates short, practical sessions for home or gym training.
- Offers a Today dashboard with the next useful action.
- Includes Guided Workout Mode with optional timers, pause, resume, skip, and finish controls.
- Keeps completion, effort, notes, progress, walking, habits, templates, and calendar export local to the browser.
- Provides meal ideas with search, dietary filters, preparation times, favourites, ingredients, and substitutions.
- Includes progress history and optional weight tracking without calorie targets or medical claims.
- Works as a manual planner even when no AI client is connected.

## The WebMCP part

Gym & Tonic exposes seventeen tools through `document.modelContext.registerTool()`.

### Read-only tools

- `get_week_plan`
- `list_exercises`
- `read_exercise`
- `check_balance`
- `aggregate_gear`
- `suggest_session`
- `overload_report`
- `get_progress`
- `get_training_history`
- `list_templates`
- `get_calendar_plan`
- `get_fitness_preferences`
- `list_meal_ideas`

### Proposal tools

- `propose_session`
- `swap_sessions`
- `clear_slot`
- `fill_week`

The important bit is that the agent does not get to quietly rewrite somebody’s week. Every planning change becomes a proposal that the user can approve or reject. The agent can help organise the plan, but it cannot silently complete workouts, write reflections, record habits, or change personal tracking data.

## Main pages

- `/` is the public showcase.
- `/today` is the daily dashboard.
- `/plan` is the full fourteen-slot planner.
- `/workout` is the focused workout experience.
- `/progress` shows consistency, history, and optional weight trends.
- `/meals` contains searchable meal ideas.
- `/settings` contains preferences, alerts, analytics, and data controls.
- `/tools` explains the WebMCP connection.
- `/privacy`, `/data`, and `/safety` explain how local data and suggestions work.

## Local-first by design

Plans, workouts, reflections, progress, and preferences stay in the browser. The app includes versioned storage, migrations, corrupted-data recovery, export, import, and reset controls.

There is no login and no account system. If you clear your browser data without exporting first, that data is gone. The app tells you this because surprises are not a feature.

## Tech stack

Astro, React, Zustand, Tailwind CSS, WebMCP, Web Audio, Playwright, Vitest, and Vercel.

## Run it locally

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:4321`.

## Validate it

```bash
npm test
npm run check
npm run typecheck
npm run build
npm run test:e2e
```

The browser tests use isolated deterministic data, so they do not touch a real saved plan. Chromium is the local default. CI also covers WebKit and Firefox smoke navigation.

## Project notes

The visual direction uses Fraunces and Inter, editorial photography, strong contrast, keyboard-friendly controls, responsive layouts, and reduced-motion support.

The fitness and weight-management copy is informational. Gym & Tonic is not a medical service, nutrition prescription, calorie tracker, or replacement for professional advice.

## License

Gym & Tonic is released under the [MIT License](LICENSE).
