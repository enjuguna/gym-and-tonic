# Cold Case — A WebMCP Detective Game

**A murder mystery where ChatGPT is your detective partner.** You work one live evidence board together: the agent searches case files, cross-references testimonies, and pins theories — but **you** decide what gets pinned, what gets challenged, and who gets accused.

Built for the [OpenAI WebMCP Challenge](https://webmcp.devpost.com/) · September 2026.

## The pitch

Browser agents today interact with web pages by looking at pixels and clicking. That's fine for booking flights. It's useless for **reasoning-heavy collaboration** — going through forty documents, holding contradictions in mind, proposing hypotheses for a human to judge.

Cold Case shows the alternative: a web app that exposes its *thinking surfaces* as structured tools. The agent doesn't click around our evidence board — it calls `search_evidence`, `cross_reference`, `propose_theory`. Every agent action lands on the shared corkboard as a **reviewable pin**: you can accept it, challenge it, or yank it off the board.

The human stays the lead detective. The agent is the tireless partner who has read everything, remembers everything, and never gets bored of re-reading witness statements.

## Why this is what WebMCP is for

The WebMCP docs name the target pattern: *"you and the agent need to see the same thing."* Cold Case pushes that pattern somewhere new — not editing a document or a spreadsheet, but **shared reasoning under uncertainty**:

- **Same canvas:** the agent's theory pins appear on the exact corkboard you're staring at, next to your own.
- **Structured over pixel-clicking:** `cross_reference(witnessA, witnessB)` returns real contradictions from the case text — something a screenshot-reading agent cannot do reliably.
- **Human accountability:** an accusation (the game's consequential action) can only be made by the player. The agent builds the case; you close it.
- **Trust through reviewability:** every agent pin records which tool call produced it and which evidence it cites. Nothing enters the case file silently.

That last point generalizes far beyond a game: the propose → review → commit loop demonstrated here is the trust model every high-stakes agent domain needs — legal discovery, medical diagnosis, audit. We built it in a format judges will actually enjoy testing.

## The case: "The Vigil at Karura House" *(launch case)*

Nairobi, July 1998. A tech investor is found dead in his study during a blackout, hours after sealing a term sheet that would have bankrupted three of his partners. Five suspects, ~40 pieces of evidence — witness statements, phone logs, a burnt note fragment, security footage timestamps, a poisoned flask of chai. One contradiction chain leads to the truth; two plausible innocent suspects are designed to catch sloppy reasoning.

Cases are pure JSON content (`src/data/cases/`), so the game ships with one polished launch case and the structure for more.

## How to play / how to judge

1. Open Cold Case in Chrome with WebMCP enabled or the ChatGPT desktop app's built-in browser.
2. Read the briefing. Ask your partner anything: *"What do we know about the night guard's alibi?"*
3. Watch it search, cite, and pin. Challenge a pin if you disagree — the agent defends or retracts.
4. Say *"cross-reference Wanda against the phone log"* and watch contradictions surface with citations.
5. When you're confident, make the accusation yourself. The epilogue scores your deduction **and** your partnership.

No account needed; the full first case ships with the app so judges can play immediately.

## Site tools (the 9 registered WebMCP tools)

| Tool | Type | What it does |
|---|---|---|
| `get_case_briefing` | read-only | Returns the case intro, victim, location, suspect list. |
| `search_evidence` | read-only | Full-text search across all evidence with excerpts + ids. |
| `read_evidence` | read-only | Full content of one item (statement, log, photo caption…). |
| `list_suspects` | read-only | Dossiers: alibi, motive, relationship to victim. |
| `cross_reference` | read-only | Compares two+ items/suspects; returns detected contradictions and corroborations with citations. |
| `pin_evidence` | write→proposal | Pins an evidence card to the corkboard (agent must cite why). |
| `add_note` | write→proposal | Adds an annotation to any pinned item. |
| `propose_theory` | write→proposal | Stages a theory card: claim + supporting evidence links + open questions. Player approves/challenges. |
| `request_accusation_review` | gated | Agent requests the player consider accusing X — never accuses itself; triggers the endgame only on player action. |

All writes flow through one `applyProposal()` path in the store, so the review UI and audit trail are automatic — the same discipline that makes agents safe in finance, applied to fiction.

## How it's built

- **Astro** static site, React island for the corkboard UI
- **Zustand** store: `pins`, `notes`, `theories`, `proposals`; single proposal pipeline
- **WebMCP layer** (`src/lib/webmcp.ts`) registers all tools against store actions; graceful manual-mode fallback without `document.modelContext`
- **Case engine**: pure functions over JSON case files — search, citation extraction, contradiction detection (rule-based: conflicting times/places/claims)
- **Hosting:** Vercel · fully client-side, no backend, no accounts
- MIT licensed. Case content is original fiction.

```
src/
  lib/webmcp.ts        # tool registrations
  lib/store.ts         # board state + applyProposal()
  lib/caseEngine.ts    # search, citations, contradiction detection
  components/Corkboard.tsx   # the shared live canvas
  data/cases/vigil.json      # launch case content
```

## Running locally

```bash
npm install
npm run dev      # http://localhost:4321
npm run build && npm run preview
```

For the full experience use Chrome with WebMCP enabled or the latest ChatGPT desktop app; without an agent, Cold Case plays as a classic solo detective game.

## License

MIT — see [LICENSE](LICENSE).
