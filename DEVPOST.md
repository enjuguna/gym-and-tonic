# Devpost Submission — Cold Case (paste-ready)

## Project name
Cold Case — A WebMCP Detective Game

## Tagline (short elevator)
A murder-mystery where ChatGPT is your detective partner: it searches, cross-references, and pins evidence to your shared corkboard — but only you can make the accusation.

## Inspiration
Browser agents interact with pages by looking at pixels and clicking. That works for booking flights — and fails completely for reasoning-heavy collaboration. Meanwhile, WebMCP lets a website declare its capabilities as structured tools. We asked: what web experience becomes possible when an agent can genuinely *reason over* a page's content instead of scraping its pixels? Our answer: a detective game — the purest form of shared human-AI reasoning under uncertainty.

## What it does
Cold Case ships with "The Vigil at Karura House": Nairobi, 1998. An investor is poisoned during a blackout. Five suspects, twenty pieces of evidence — witness statements, phone logs, a taxi receipt, a tampered medicine bottle — and six authored contradiction chains.

You and ChatGPT work one live evidence board:
- **It investigates** through site tools: `search_evidence`, `read_evidence`, `cross_reference` (returns real contradictions between items, with citations), `list_suspects`.
- **Every agent action is a proposal**: pins, notes, and theory cards appear as review rows you approve or reject before they touch the board.
- **It never accuses.** When the agent believes the case is ready it can stage a formal recommendation (`request_accusation_review`) — but the Accuse button belongs to the player alone.
- **The epilogue scores you**: correct culprit + how much of the true evidence chain you pinned + red herrings avoided.

## How we built it
Astro static site + React island for the board UI; Zustand store where every agent write flows through a single `applyProposal()` pipeline (the same trust pattern used for high-stakes domains like audit and legal discovery); a pure-function case engine (search ranking, citation extraction, contradiction detection) over JSON case files; 9 tools registered via `document.modelContext.registerTool()` with JSON-Schema inputs and honest `readOnlyHint` annotations; procedural Web Audio ambience (rain from filtered noise) — no assets, no backend, no accounts.

Challenges we ran into:
1. Designing contradictions that are *discoverable* — each one is verifiable between two specific evidence ids, so `cross_reference` returns real logic, not vibes.
2. Keeping the solution out of the agent's reach: the culprit flag lives in the case file but every tool strips it; a test asserts the briefing response never contains it.
3. Undo semantics: reverting a pin that filled a missing value had to restore "missing", which forced us to distinguish null ("restore this") from undefined ("no prior value").

## Accomplishments we're proud of
- A complete, replayable game — judges can play start-to-finish in ~10 minutes without any setup or account.
- An agent-safety story told through game design instead of compliance language: propose → review → commit, and the accusation gate.
- Zero-backend, zero-asset: fully client-side, procedurally generated sound, deployable anywhere static files live.

## What we learned
WebMCP's killer feature isn't speed — it's *shared context with accountability*. Tools that operate on live page state let the agent and the human see the same board; the proposal pipeline lets the human keep authorship. Also: writing a fair-play mystery is harder than writing the game engine.

## What's next
More cases as JSON content packs; a "challenge mode" where the agent actively argues against your theory; difficulty tiers that constrain which tools are available.

## Built with
astro, react, typescript, zustand, tailwindcss, webmcp, web-audio-api, vercel

---

# Demo video shot list (~2:30)

0:00–0:15 Hook — black screen, case file opens. VO: "Nairobi, 1998. An investor is dead,
poisoned during a blackout. Five suspects. You have a partner who has read everything."
0:15–0:40 The board — corkboard, dossiers tab, read Grace's alibi aloud.
0:40–1:20 Partnership — in ChatGPT desktop browser beside the page:
   "Cross-reference Grace's statement with the taxi receipt" → show tool call →
   approve the pin on-screen → "propose a theory" → Accept on the theory card.
1:20–1:50 The twist — "Can it accuse anyone?" → request_accusation_review proposal;
   point at the player-only Accuse button.
1:50–2:15 Epilogue — accuse Grace; scored epilogue; explanation of the med-bottle swap.
2:15–2:30 Close — "The agent reasons. The human decides. That's WebMCP." Repo URL card.

Recording checklist:
- [ ] Chrome with WebMCP enabled OR latest ChatGPT desktop app (Sol/Terra model)
- [ ] Mic level check; quiet room (rain ambience OFF during VO takes)
- [ ] Pre-pin nothing — fresh board state for the recording
- [ ] Second take of the epilogue with ambience ON for feel
