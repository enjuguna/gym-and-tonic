# Devpost Submission — Gym & Tonic (paste-ready)

## Project name
Gym & Tonic — "What's cooking today?" for your muscles

## Tagline
A weekly training planner where ChatGPT is your coach. Fourteen slots, one live grid, and a coach who proposes while you decide.

## Inspiration
"What's for dinner?" got solved by a hundred meal-planning apps. "What's today's workout?" is still 14 open tabs, a notes app full of guilt, and a program abandoned in week two. When WebMCP arrived — letting a website declare its capabilities as structured tools an agent can call directly on the page — we saw the same collaboration pattern that fixed meal planning applied to fitness: one shared canvas, an agent doing the planning drudgery, a human staying in charge.

## What it does
Gym & Tonic is a global English-language weekly fitness planner for people starting or returning to exercise (Mon–Sun × AM/PM = 14 session slots). Open it in ChatGPT's built-in browser or Chrome with WebMCP and your AI coach can:

- **Read the week** — `get_week_plan`, `check_balance` (minutes per muscle group, neglected groups, a verdict with attitude: "No leg day?! The squats know what you did.")
- **Know the catalogue** — `list_exercises`, `read_exercise` with real form cues ("Red dirt underfoot, canopy overhead. Zone 2 — gossip pace.")
- **Do the drudgery** — `propose_session` fills empty slots, `swap_sessions` rebalances the week, `clear_slot` programs rest days. Every write lands as a **pending proposal** you approve or reject — nothing silently changes your plan.
- **Pack your bag** — `aggregate_gear` builds one deduplicated equipment list for the week, shareable via WhatsApp in one tap.

The player experience is editorial, not dashboard-y: photo heroes with slow zoom, a coach voice that reacts to every action, DayStory spreads with numbered exercises and practical meal ideas, a muscle-group coverage strip that lights up as groups get planned, and a rotated rubber stamp at 14/14: **"WEEK COMPLETE · WELL TRAINED."**

## How we built it
Astro static site + React island; Zustand store where every agent write funnels through a single `applyProposal()` pipeline (the trust pattern high-stakes domains need); pure-function domain layer (exercise catalogue, gear aggregation, balance analysis, non-repeating session generator); 17 tools registered via `document.modelContext.registerTool()` with JSON-Schema inputs and honest `readOnlyHint` annotations; Fraunces/Inter typography, credited editorial photography with gradient fallbacks, procedural Web Audio stings. Fully client-side, no backend, no accounts.

Challenges:
1. **Trust as UX.** An agent editing your training plan must feel like a partner, not a hijacker — the proposal pipeline plus visible tool-source labels solved it.
2. **Representation matters.** Generic stock photos can make fitness feel remote. We use carefully selected, credited editorial imagery and practical meal examples that reflect more than one food tradition.
3. **Non-repeating variety.** The session generator originally produced duplicate titles across slots; it now guarantees no immediate repeats per focus, enforced by test.

## Accomplishments we're proud of
- A complete, working product a judge can use for their *actual* training week in under two minutes.
- Agent safety told through design language ("Your coach proposes…") instead of compliance warnings.
- Global accessibility through clear language, beginner-friendly options, practical food ideas, and local-first privacy.

## What we learned
WebMCP shines when the agent needs **live page state the human is looking at** — there's no server copy of your training week to desynchronize from. And the propose→approve→commit loop is what makes people let an agent near things they care about.

## What's next
Printable Training Diary export; PWA install; more exercise catalogue depth; a "coach argues back" mode where rejected proposals get defended with evidence from your balance report.

## Built with
astro, react, typescript, zustand, tailwindcss, webmcp, web-audio-api, pexels, vercel
