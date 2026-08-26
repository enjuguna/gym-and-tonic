# Immersive Story Experience Plan — "Feel Like the Mentalist"

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Transform Cold Case from a tabbed evidence tool into a cinematic detective experience modeled on WanderNote's three-act layout — so a first-time player feels like a mentalist reading minds: the app reveals, reacts, and performs around them.

**Architecture:** Rebuild `Corkboard.tsx` as a three-column "stage": left = case dossier & suspect profiles (the script), center = the live interrogation/evidence canvas (the performance), right = deduction panel with suspect mind-read meters and a location sketch map (the reveal). Add a narrative voice ("The Voice") that reacts to every action via a typewriter text component, suspect portrait cards with trust/doubt meters, chapter progression (Act I/II/III), and a dramatic accusation finale. Keep the existing store/engine/WebMCP layer untouched — this is presentation-layer surgery over proven logic.

**Tech Stack:** Existing React/Zustand/Tailwind stack. New: CSS keyframe animations + IntersectionObserver reveals (no deps), inline SVG for the Karura House floor-plan map (no map tiles needed — it's a house), procedural Web Audio already available for stings.

---

## Current context / assumptions

- Logic layer is DONE and tested (12 tests green): `src/lib/{store,caseEngine,timeline,webmcp,sound}.ts`, case content in `src/data/cases/vigil.json`.
- Current UI (`src/components/Corkboard.tsx`, 478 lines) is functional modern-noir but reads as a dashboard: header + tabs + card grids. No narrative voice, no portraits, no spatial map, no act structure.
- WanderNote's engagement mechanics to steal: (1) three-column input→performance→visualization flow, (2) serif editorial headlines against sans UI, (3) hero imagery per section, (4) agent persona naming ("agent suggestion"), (5) numbered spatial map pins, (6) micro-feedback on every interaction.
- "Mentalist feel" decomposed into concrete mechanics: suspects whose stories visibly crack (trust meters), reveals that arrive as staged performances (typewriter + sting), spatial reasoning (floor plan), and chapter titles that frame each session beat ("Act I: The Vigil").
- First-run onboarding plan exists at `.hermes/plans/2026-08-26_073000-first-run-onboarding.md`; this plan supersedes Task 3 (guided empty-state) and reshapes Tasks 2/4 visuals but keeps the hook/intro concept.

## Proposed approach

Seven workstreams, all presentation-layer:

1. **The Stage** — three-column responsive layout replacing tabs (columns collapse to swipeable sections on mobile).
2. **The Voice** — narrative reaction strip that types out responses to player actions ("You study the flask. Grace's prints. Only Grace's.") using an event-bus from the store.
3. **Suspect portraits & mind meters** — rich dossier cards with generated SVG silhouettes, alibi-status badges, and Doubt/Trust meters that shift when contradictions involving them are discovered.
4. **The floor plan** — inline SVG of Karura House (study, kitchen, veranda, corridor, gate); evidence and timeline events appear as numbered pins on rooms; clicking a room filters evidence.
5. **Acts & chapters** — progress framed as Act I (Arrival) → Act II (Contradictions) → Act III (The Accusation), unlocked by board activity, each with a full-screen title card.
6. **Reveal performances** — theory approvals and contradiction discoveries trigger a centered "MENTALIST MOMENT": dimmed screen, typewriter line, sting.
7. **Finale upgrade** — accusation becomes a staged confrontation sequence (suspect lineup, spotlight sweep animation) before the epilogue.

---

## Files likely to change

- Create: `src/components/stage/TheVoice.tsx`
- Create: `src/components/stage/SuspectPortrait.tsx`
- Create: `src/components/stage/FloorPlan.tsx`
- Create: `src/components/stage/MentalistMoment.tsx`
- Create: `src/components/stage/ActTitle.tsx`
- Create: `src/lib/narrator.ts` (event→narration mapping)
- Modify: `src/components/Corkboard.tsx` (rebuild as Stage layout)
- Modify: `src/lib/store.ts` (add `discoveredIds: Set<string>` + `actsUnlocked` derived state; pure additions, no changes to proposal pipeline)
- Test: `src/lib/narrator.test.ts`

---

### Task 1: Narrator engine — map actions to lines (TDD)

**Objective:** Pure function turning board events into atmospheric narration lines; deterministic per event id so replays are stable.

**Files:**
- Create: `src/lib/narrator.ts`
- Test: `src/lib/narrator.test.ts`

**Step 1: Write failing test**

```ts
// src/lib/narrator.test.ts
import { describe, expect, it } from "vitest";
import { narrate } from "./narrator";

describe("narrate", () => {
  it("returns a line for pinning evidence", () => {
    const line = narrate({ type: "pin", itemId: "ev-chai-flask", by: "player" });
    expect(line).toMatch(/flask|chai|print/i);
  });
  it("varies lines deterministically per item", () => {
    const a = narrate({ type: "pin", itemId: "ev-taxi-receipt", by: "player" });
    expect(a).toBe(narrate({ type: "pin", itemId: "ev-taxi-receipt", by: "player" }));
  });
  it("has distinct voice for agent proposals", () => {
    const p = narrate({ type: "pin", itemId: "ev-chai-flask", by: "agent" });
    expect(p).toMatch(/partner|suggests/i);
  });
  it("covers contradiction discoveries", () => {
    expect(narrate({ type: "contradiction", id: "con-veranda" })).toMatch(/crack|contradiction|lie|wobble/i);
  });
});
```

Run: `npx vitest run src/lib/narrator.test.ts` → Expected FAIL.

**Step 2: Implement**

```ts
// src/lib/narrator.ts
type Ev =
  | { type: "pin"; itemId: string; by: "player" | "agent" }
  | { type: "approve"; kind: string }
  | { type: "reject"; kind: string }
  | { type: "contradiction"; id: string }
  | { type: "theory"; status: string };

const LINES: Record<string, string[]> = {
  "pin:ev-chai-flask": [
    "The flask. Her prints alone — and she made sure everyone watched her carry it.",
    "Warm chai, cold trail. Whoever dosed him never touched the tea.",
  ],
  "pin:ev-taxi-receipt": ["Twenty past eight. The rain had not started. Wanda was already gone."],
  "pin:default": ["Another card for the board. The picture sharpens."],
  "contradiction": ["There it is — the story wobbles. Press on the crack."],
  "theory:accepted": ["You nod slowly. That's the shape of it."],
  "theory:challenged": ["Not so fast. A mentalist never accepts the first answer."],
  "reject": ["You let it pass. Instinct says nothing."],
  "approve": ["Good. Into the record."],
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function narrate(ev: Ev): string {
  if (ev.type === "pin") {
    const specific = LINES[`pin:${ev.itemId}`];
    if (specific && ev.by === "player") return specific[hash(ev.itemId) % specific.length];
    if (ev.by === "agent") return "Your partner suggests a card. Study it before you allow it.";
    return LINES["pin:default"][0];
  }
  if (ev.type === "contradiction") return LINES.contradiction[0];
  if (ev.type === "theory") return ev.status === "accepted" ? LINES["theory:accepted"][0] : LINES["theory:challenged"][0];
  return LINES[ev.type]?.[0] ?? "";
}
```

Run tests → PASS. Commit: `git commit -m "feat: narrator engine mapping board events to atmosphere lines"`

---

### Task 2: TheVoice component — typewriter narration strip

**Objective:** Fixed-bottom-left floating strip that types narration when events fire; auto-fades after 6s.

**Files:**
- Create: `src/components/stage/TheVoice.tsx`
- Modify: `src/lib/store.ts` — append-only `activityLog: Array<{id:number; ev:unknown; at:number}>` pushed by `pinItem/approveProposal/setTheoryStatus` (3 one-line additions)

**Implementation notes (complete behavior spec):**
- Subscribes to `useBoard((s) => s.activityLog)`; on new entry calls `narrate()`, sets current line, types at ~28ms/char via `setInterval`.
- Styled: monospace italic, amber-300/80, left border-l-2 amber-400, glass bg-zinc-900/80 backdrop-blur, max-w-sm, bottom-6 left-6 z-40.
- Sound hook: play `sound.tick(300)` on line start if ambience enabled.

Verify: pin a dossier → line types out → fades. Commit: `git commit -m "feat: The Voice — reactive narrator strip"`

---

### Task 3: Suspect portraits with doubt meters (TDD)

**Objective:** Dossier cards become character cards: SVG silhouette portrait, alibi badge, and a Doubt meter driven by how many discovered contradictions involve them.

**Files:**
- Create: `src/components/stage/SuspectPortrait.tsx`
- Test: add to `e2e/journey.test.ts` — assert `doubtFor(suspectId)` grows after approving a contradiction-related pin

**Step 1: failing test**

```ts
import { doubtFor } from "../src/lib/suspectState";
it("doubt rises with contradictions involving the suspect", () => {
  expect(doubtFor(LAUNCH_CASE, "sus-grace", [])).toBe(0);
  const d = doubtFor(LAUNCH_CASE, "sus-grace", ["con-veranda"]);
  expect(d).toBeGreaterThan(0);
});
```

Create `src/lib/suspectState.ts`: `doubtFor(caseFile, suspectId, discoveredConIds)` counts contradictions whose summary/evidence implicates them (map contradiction → suspects via authored `implicates?: string[]` field added to vigil.json contradictions). Meter thresholds: 0 = "clean", 1–2 = "questions remain" (amber), ≥3 = "under suspicion" (red pulse).

**Step 2:** Portrait SVG: 5 distinct silhouette variants (hair shape/path per suspect, seeded by id hash), amber duotone on dark. Badge chip shows role. Alibi text truncated with expand.

Verify: `npx vitest run` green; visually confirm 5 distinct portraits render. Commit: `git commit -m "feat: suspect character cards with doubt meters"`

---

### Task 4: Karura House floor plan (inline SVG)

**Objective:** Spatial reasoning surface — the house as a drawn blueprint; evidence/timeline pins land on rooms; click-to-filter.

**Files:**
- Create: `src/components/stage/FloorPlan.tsx`
- Data: add optional `"room"` field to vigil.json evidence entries (study/kitchen/veranda/corridor/gate/exterior)

**Spec:** 400×300 viewBox blueprint: stroke-only rooms in blueprints-blue (#7dd3fc at 40%) on zinc-950, hand-drawn feel via slight path jitter. Rooms: Study (with desk mark), Kitchen, Veranda, Corridor, Gate, Back fence. Pins: numbered circles matching the day's timeline order; pulsing ring for items pinned to board. Clicking a room sets a `roomFilter` (new local state lifted to Corkboard) that dims non-matching evidence cards.

Verify: pins render per room; click Study → only study evidence highlighted. Commit: `git commit -m "feat: blueprint floor plan with room-pinned evidence"`

---

### Task 5: MentalistMoment + Act titles

**Objective:** Full-screen performance beats: contradiction discovery and act transitions interrupt with drama.

**Files:**
- Create: `src/components/stage/MentalistMoment.tsx`
- Create: `src/components/stage/ActTitle.tsx`

**Behavior spec:**
- `MentalistMoment(line)`: fixed overlay, bg-zinc-950/90, line types center-screen at text-2xl serif italic, amber glow text-shadow, plays `sound.sting(true)`, dismisses on any click or after 3.5s. Trigger: first time each contradiction id enters view via cross_reference approval (track `seenContradictions` in localStorage).
- `ActTitle(actNumber)`: same treatment with "ACT I — THE VIGIL" kicker. Acts unlock: I immediately, II when ≥2 pins, III when a review-request is approved. Track via derived selector `currentAct(pins, theories, proposals)` added to store as pure function export (testable).

Verify: approve a contradiction-citing pin → moment plays once only. Commit: `git commit -m "feat: mentalist reveal moments and act structure"`

---

### Task 6: Stage layout rebuild of Corkboard

**Objective:** Replace tabbed dashboard with the three-act column layout (desktop) / stacked scenes (mobile).

**Files:**
- Modify: `src/components/Corkboard.tsx` (full rewrite of return tree; keep all hooks/logic)

**Layout spec (desktop ≥lg):**
```
┌─────────────┬──────────────────────┬─────────────┐
│ LEFT 320px  │ CENTER flex-1        │ RIGHT 360px │
│ THE SCRIPT  │ THE BOARD            │ THE MINDS   │
│ case card   │ evidence stream      │ 5 portraits │
│ (serif      │ + proposals to       │ w/ meters   │
│ headline,   │ approve (center      │             │
│ victim)     │ stage, biggest)      │ FLOOR PLAN  │
│ suspect     │                      │ + timeline  │
│ mini-list   │                      │ stats       │
│ nav         │                      │             │
└─────────────┴──────────────────────┴─────────────┘
TheVoice floats bottom-left · Accuse stays top-right
```
- Serif headlines via `font-serif` (Tailwind default stack fine): "The Vigil at Karura House", "Five minds to read.", "Where the night went wrong."
- Center column keeps proposal-review rows ABOVE pinned evidence — approvals are the performance.
- Mobile (<lg): single column ordered Script → Board → Minds; columns become horizontally-scrollable chips nav.
- Keep: keyboard shortcuts, sound toggle, help drawer mount point, IntroOverlay integration point (from prior plan).

**Verify:** `npx astro check` 0 errors; manual preview at 1440px and 375px widths. Commit: `git commit -m "feat: three-stage layout — script, board, minds"`

---

### Task 7: Accusation finale + regression pass

**Objective:** Staged endgame and full verification.

**Steps:**
1. Upgrade `AccuseDialog`: on pick, show lineup of 5 portraits in a row, red spotlight sweep (CSS translateX animation, 1.8s) landing on chosen suspect, hold 1s, then epilogue with `sound.sting`. Pure CSS/keyframes + setTimeout sequencing.
2. Run: `npx astro check` → `- 0 errors`
3. Run: `npx vitest run` → all green (12 existing + ~8 new)
4. Run: `npx astro build` → complete; grep dist for "THE SCRIPT" marker
5. Manual preview: fresh localStorage → full journey intro→act I→pins→moment→act II→theory accept→act III→accuse→lineup→epilogue. Zero console errors.
6. Deploy: `npx vercel --prod`; smoke-check prod URL returns 200.
7. Commit + push: `git push origin main`.

---

## Tests / validation summary

| Layer | Command | Target |
|---|---|---|
| Narrator unit | `npx vitest run src/lib/narrator.test.ts` | 4 passing |
| Suspect state | included in journey suite | doubtFor assertions |
| Regression | `npx vitest run` | all green |
| Types | `npx astro check` | 0 errors |
| Build | `npx astro build` | completes, markers present |

## Risks, tradeoffs & open questions

- **R1: Scope vs deadline (~Sept 3).** This is the largest UI change yet. Mitigation: tasks are independently shippable — even landing Tasks 1–3 + 6 transforms the feel; floor plan (Task 4) and lineup finale (Task 7) are the cut line if time runs short.
- **R2: Store additions must stay additive.** `activityLog` and act selectors touch `store.ts`, which the E2E journey test depends on — run the full suite after Task 2, not just new tests.
- **R3: Performance of animations on low-end devices.** All effects are CSS/compositor-friendly (transform/opacity only); typewriter uses one interval, cleaned up on unmount.
- **T1: SVG portraits are stylized silhouettes, not faces.** Deliberate: abstract portraits avoid uncanny valley and keep the noir aesthetic. If Eric wants illustrated faces instead, that's a commissioned-art dependency — flag before Task 3.
- **Q1:** Should The Voice also narrate agent rejections ("Your partner withdraws the card")? Currently planned yes — cheap and adds persona.
- **Q2:** Does the floor plan replace the Timeline tab or absorb it? Recommendation: absorb — timeline events ARE floor-plan pins chronologically; drop the separate tab, keep chronological list under the map.
