# First-Run Experience (Onboarding) Implementation Plan — Cold Case

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make a first-time visitor understand what Cold Case is, what to do, and reach their first "aha" moment (first pin on the board) within 60 seconds — without reading any documentation.

**Architecture:** A full-screen intro overlay (`IntroOverlay.tsx`) shown once per browser via `localStorage`, followed by a dismissible 3-step coach-mark strip that highlights the Board/Suspects/Timeline tabs and the Accuse button. A persistent "How to play" help drawer (`HelpDrawer.tsx`) is reachable from the header at any time. All state lives in a tiny `useOnboarding` hook so logic is testable separately from UI. No routing changes; no backend.

**Tech Stack:** React 19 (existing island), Zustand (existing store pattern), Tailwind v4, localStorage for one-time flags, vitest for hook/engine tests.

---

## Current context / assumptions

- App entry: `src/components/Corkboard.tsx` (478 lines) renders header → case card → tabs → board. It is already responsive and keyboard-navigable.
- Store: `src/lib/store.ts` exposes `useBoard`; pins/notes/theories/proposals. First pin = first "aha".
- The game currently opens straight onto an empty corkboard with a small empty-state blurb. A newcomer has no idea WebMCP/partner mechanics exist until they read README.
- `sound.toggle()` requires user gesture; intro overlay's "Begin" click is the perfect gesture to enable ambience opt-in.
- Tests live in `src/lib/caseEngine.test.ts` and `e2e/journey.test.ts` (vitest). `npx astro check` + `npx vitest run` are the verification commands.
- Deploy target: Vercel production (`npx vercel --prod`). Live URL must keep working; overlay must not break solo mode or agent mode.

## Proposed approach

1. **IntroOverlay** — cinematic 3-slide welcome (What is this → Your partner → Make it yours), shown on first visit only. Sets `localStorage.cc_onboarded=1`. "Enable rain ambience" checkbox on final slide wires the sound toggle through the existing `sound` engine.
2. **CoachMarks** — after dismissal, a 3-step spotlight sequence (tabs → proposal review concept → accuse button) driven by the same hook; skippable, never re-shown.
3. **HelpDrawer** — right-side slide-over with "How to play", example prompts to paste into ChatGPT, keyboard shortcuts. Opened via "?" button in header.
4. **Empty-board upgrade** — replace static text with 3 clickable example actions that work in solo mode (pin a dossier, open timeline) and copy-to-clipboard prompts for agent mode.

## Files likely to change

- Create: `src/hooks/useOnboarding.ts`
- Create: `src/components/IntroOverlay.tsx`
- Create: `src/components/HelpDrawer.tsx`
- Modify: `src/components/Corkboard.tsx` (mount overlay/drawer, add "?" button, replace `EmptyBoard`)
- Test: `src/hooks/useOnboarding.test.ts`

---

## Task 1: Onboarding hook with localStorage persistence

**Objective:** Centralize onboarding state machine (intro → coachmarks → done) in a testable hook.

**Files:**
- Create: `src/hooks/useOnboarding.ts`
- Test: `src/hooks/useOnboarding.test.ts`

**Step 1: Write failing test**

```ts
// src/hooks/useOnboarding.test.ts
import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnboarding } from "./useOnboarding";

describe("useOnboarding", () => {
  beforeEach(() => localStorage.clear());

  it("starts on 'intro' for a fresh visitor", () => {
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.stage).toBe("intro");
  });

  it("skips everything when previously completed", () => {
    localStorage.setItem("cc_onboarded", "1");
    const { result } = renderHook(() => useOnboarding());
    expect(result.current.stage).toBe("done");
  });

  it("advances intro -> coachmarks -> done and persists", () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => result.current.completeIntro());
    expect(result.current.stage).toBe("coachmarks");
    expect(localStorage.getItem("cc_intro_seen")).toBe("1");
    act(() => result.current.finish());
    expect(result.current.stage).toBe("done");
    expect(localStorage.getItem("cc_onboarded")).toBe("1");
  });

  it("skipAll jumps straight to done", () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => result.current.skipAll());
    expect(result.current.stage).toBe("done");
    expect(localStorage.getItem("cc_onboarded")).toBe("1");
  });
});
```

**Step 2: Run test to verify failure**

Run: `npx vitest run src/hooks/useOnboarding.test.ts`
Expected: FAIL — cannot resolve `./useOnboarding`.

**Step 3: Write minimal implementation**

```ts
// src/hooks/useOnboarding.ts
import { useState, useEffect } from "react";

export type OnboardingStage = "intro" | "coachmarks" | "done";

const DONE_KEY = "cc_onboarded";
const INTRO_KEY = "cc_intro_seen";

export function useOnboarding() {
  const [stage, setStage] = useState<OnboardingStage>("done"); // SSR-safe default

  useEffect(() => {
    if (localStorage.getItem(DONE_KEY) !== "1") {
      setStage(localStorage.getItem(INTRO_KEY) === "1" ? "coachmarks" : "intro");
    }
  }, []);

  const completeIntro = () => {
    localStorage.setItem(INTRO_KEY, "1");
    setStage("coachmarks");
  };
  const finish = () => {
    localStorage.setItem(DONE_KEY, "1");
    setStage("done");
  };
  const skipAll = finish;
  const reopenHelp = () => setStage("coachmarks"); // reused by HelpDrawer trigger

  return { stage, completeIntro, finish, skipAll, reopenHelp };
}
```

**Step 4: Run test to verify pass**

Run: `npx vitest run src/hooks/useOnboarding.test.ts`
Expected: PASS (4 tests).

**Step 5: Commit**

```bash
git add src/hooks/useOnboarding.ts src/hooks/useOnboarding.test.ts
git commit -m "feat: onboarding stage hook with localStorage persistence"
```

---

## Task 2: IntroOverlay component (3 slides)

**Objective:** Full-screen welcome that explains the game, the partner concept, and offers ambience — dismissible in ≤3 clicks.

**Files:**
- Create: `src/components/IntroOverlay.tsx`
- Modify: `src/components/Corkboard.tsx:22-34` (add state + mount)

**Step 1: Write failing test**

Add to `e2e/onboarding.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IntroOverlay } from "../src/components/IntroOverlay";

describe("IntroOverlay", () => {
  it("renders slide 1 then advances through slides to Begin", () => {
    const onComplete = vi.fn();
    render(<IntroOverlay onComplete={onComplete} />);
    expect(screen.getByText(/murder/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText(/ambience/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /begin/i }));
    expect(onComplete).toHaveBeenCalledOnce();
  });
  it("Skip jumps straight to completion", () => {
    const onComplete = vi.fn();
    render(<IntroOverlay onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
```

Run: `npx vitest run e2e/onboarding.test.tsx` → Expected FAIL (module missing).
Note: requires `@testing-library/react` + `jsdom`. Add devDeps: `npm i -D @testing-library/react jsdom` and add `test.environment: "jsdom"` fallback via `// @vitest-environment jsdom` comment at file top.

**Step 2: Implement**

```tsx
// src/components/IntroOverlay.tsx
import { useState } from "react";
import { sound } from "../lib/sound";

const SLIDES = [
  {
    kicker: "A murder. Five suspects.",
    title: "The Vigil at Karura House",
    body: "Nairobi, 1998. An investor is poisoned during a blackout. Twenty pieces of evidence wait on your corkboard — statements, logs, a tampered medicine bottle.",
    art: "🕯️",
  },
  {
    kicker: "You don't work alone.",
    title: "ChatGPT is your partner",
    body: "Ask it things like “cross-reference Grace's statement with the taxi receipt”. It reads everything, cites its sources, and proposes pins for the board — you approve every single one.",
    art: "🤝",
  },
  {
    kicker: "One rule.",
    title: "Only you can accuse",
    body: "Your partner builds the case; you close it. Accuse correctly and the case is solved — the epilogue scores your deduction.",
    art: "⚖️",
  },
];

export function IntroOverlay({ onComplete }: { onComplete: (soundWanted: boolean) => void }) {
  const [slide, setSlide] = useState(0);
  const [wantSound, setWantSound] = useState(true);
  const s = SLIDES[slide];
  const last = slide === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950 p-6" role="dialog" aria-modal="true">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-500/[0.06] blur-[130px]" />
      </div>
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-zinc-900/90 p-8 text-center shadow-2xl backdrop-blur-xl">
        <p className="text-5xl">{s.art}</p>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-400/90">{s.kicker}</p>
        <h2 className="mt-2 text-xl font-bold tracking-tight">{s.title}</h2>
        <p className="mt-3 min-h-[72px] text-sm leading-relaxed text-zinc-400">{s.body}</p>

        <div className="mt-5 flex justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === slide ? "w-6 bg-amber-400" : "w-1.5 bg-white/15"}`} />
          ))}
        </div>

        {!last || true ? null : null}
        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => onComplete(wantSound)} className="text-xs text-zinc-600 hover:text-zinc-400">Skip</button>
          <div className="flex items-center gap-3">
            {last && (
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-400">
                <input type="checkbox" checked={wantSound} onChange={(e) => setWantSound(e.target.checked)} className="accent-amber-400" />
                🔊 Rain ambience
              </label>
            )}
            <button
              onClick={() => (last ? onComplete(wantSound) : setSlide(slide + 1))}
              className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-amber-400 active:scale-[0.98]"
            >
              {last ? "Begin investigating" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

Wire into Corkboard:

```tsx
// top of Corkboard component, alongside existing hooks:
const onboarding = useOnboarding();
const [showIntro, setShowIntro] = useState(false);
useEffect(() => { if (onboarding.stage === "intro") setShowIntro(true); }, [onboarding.stage]);

// just inside the main return, before other content:
{showIntro && (
  <IntroOverlay
    onComplete={(wantSound) => {
      setShowIntro(false);
      if (wantSound) { setSoundOn(true); sound.startRain(); }
      else setSoundOn(false);
      onboarding.completeIntro();
    }}
  />
)}
```

Note: remove the dead line `{!last || true ? null : null}` from the draft above during implementation — it was scaffolding noise.

**Step 3: Run tests**

Run: `npx vitest run e2e/onboarding.test.tsx && npx astro check`
Expected: PASS + 0 errors.

**Step 4: Manual verify**

Run: `npx astro dev --force --port 4321` then open http://localhost:4321 in preview.
Expected: overlay appears; Skip works; Begin closes and rain starts if checked; refresh → no overlay.

**Step 5: Commit**

```bash
git add src/components/IntroOverlay.tsx src/components/Corkboard.tsx e2e/onboarding.test.tsx package.json package-lock.json
git commit -m "feat: cinematic first-run intro overlay with ambience opt-in"
```

---

## Task 3: Upgrade empty board into guided first actions

**Objective:** Replace passive empty-state text with three actionable cards that each produce visible progress in one click.

**Files:**
- Modify: `src/components/Corkboard.tsx` — replace `EmptyBoard` function (~line 380) with `GuidedStart`

**Implementation sketch (complete code):**

```tsx
function GuidedStart({ onPin }: { onPin: (id: string) => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const actions = [
    { icon: "👤", label: "Read the suspects", desc: "Five dossiers. Start with Grace Akinyi.", go: "dossiers" as const },
    { icon: "🕒", label: "Rebuild the night", desc: "Timeline view orders every claim from 19:58 to 22:47.", go: "timeline" as const },
    { icon: "🤝", label: "Brief your partner", desc: "Paste this into ChatGPT:", prompt: "Cross-reference Grace's statement with the taxi receipt, then propose a theory." },
  ];
  // renders 3 glass cards; first two call setTab via prop, third copies prompt
  // with navigator.clipboard.writeText + "Copied ✓" feedback
}
```

Corkboard passes `setTab` down: `<GuidedStart onPin={() => setTab("dossiers")} />` — adjust signature so cards 1–2 switch tabs directly. Keep total under 80 lines; reuse existing card classes (`rounded-xl border border-white/[0.07] bg-white/[0.03]`).

**Verify:** preview → empty board shows 3 cards → clicking card 1 lands on Suspects tab; card 3 copies prompt (clipboard permission in insecure contexts may fail — wrap in try/catch and fall back to showing the text inline).

Commit: `git commit -m "feat: guided empty-state with one-click first actions"`

---

## Task 4: HelpDrawer ("?" button, always available)

**Objective:** Persistent in-app reference so nobody is ever stuck: how to play, example prompts, shortcuts.

**Files:**
- Create: `src/components/HelpDrawer.tsx`
- Modify: `src/components/Corkboard.tsx` header — add "?" icon button next to the sound toggle

**Key content sections (static JSX, ~120 lines):**
1. **How to play** — 4 numbered steps mirroring the intro slides.
2. **Prompts your partner understands** — 4 copyable chips:
   - `search for anything about the chai`
   - `cross-reference David's statement with the phone log`
   - `read ev-med-bottle` (advanced: direct ids)
   - `when you're confident, request accusation review`
3. **Shortcuts table** — 1/2/3 tabs, S ambience.
4. Footer link to `/tools` ("See all 9 site tools").

Mount: fixed right slide-over `w-full max-w-sm`, backdrop `bg-black/50`, Escape-to-close via existing keydown listener pattern. Header button: `?` glyph, same styling slot as sound button.

**Verify:** open/close via button + Escape; content readable at 375px width.

Commit: `git commit -m "feat: always-available help drawer with copyable prompts"`

---

## Task 5: Solo-mode banner + agent-mode discovery

**Objective:** When `document.modelContext` is absent, tell newcomers exactly how to get the full experience without nagging those who know.

**Files:**
- Modify: `src/components/Corkboard.tsx` — under mcpStatus badge logic

**Implementation:** When `mcpStatus.supported === false`, render one slim dismissible strip below the case card:

> ⚪ You're playing solo. For the AI-partner experience, open this page in the ChatGPT desktop app's built-in browser. [Copy link]

Dismiss stored in `localStorage.cc_solo_dismissed`. Copy uses `location.href`.

**Verify:** in plain Chrome the strip appears once; dismissed stays dismissed; in WebMCP-enabled context strip never renders.

Commit: `git commit -m "feat: discoverable solo-mode banner with copy-link CTA"`

---

## Task 6: Final integration pass

**Objective:** Everything together, verified end-to-end, deployed.

**Steps:**
1. Run: `npx astro check` → Expected: `- 0 errors`.
2. Run: `npx vitest run` → Expected: all tests passing (12 existing + ~7 new).
3. Run: `npx astro build && grep -c "Begin investigating" dist/_astro/*.js` → Expected: ≥1 (overlay shipped).
4. Preview manually: fresh profile flow (clear localStorage) → intro → skip coachmarks → guided start → pin suspect → accuse → epilogue. Confirm zero console errors.
5. Deploy: `npx vercel --prod`, then `curl -sL https://hesabu-eta.vercel.app/ | grep -c "solo"` → Expected ≥0 (banner is client-rendered; smoke check page 200 instead).
6. Commit any stragglers: `git commit -m "chore: first-run experience polish"` and `git push`.

---

## Tests / validation summary

| Layer | Command | Target |
|---|---|---|
| Hook unit | `npx vitest run src/hooks/useOnboarding.test.ts` | 4 passing |
| Overlay component | `npx vitest run e2e/onboarding.test.tsx` (jsdom) | 2 passing |
| Regression | `npx vitest run` | all green (12+ existing) |
| Types | `npx astro check` | 0 errors |
| Build artifact | `npx astro build` + grep dist | overlay present |

## Risks, tradeoffs & open questions

- **R1: testing-library deps.** Adds `@testing-library/react` + `jsdom` devDependencies (~small). Alternative: test only the hook and rely on manual preview for the overlay — acceptable fallback if install friction arises on Windows.
- **R2: localStorage privacy modes.** In Safari private mode writes can throw; wrap all `localStorage.setItem` calls in try/catch (hook degrades to per-session onboarding). Must be handled in Task 1 implementation, not skipped.
- **R3: intro vs. judges' time.** Judges skim fast — the overlay must be skippable in ONE click (Skip is bottom-left, always visible). Never gate content behind multi-step modals.
- **T1: Coach-marks step was descoped** from the original idea (spotlight overlays are fiddly across breakpoints). The HelpDrawer + guided empty-state cover the same need more robustly. Revisit post-deadline.
- **Q1:** Should the intro auto-enable rain ambience by default (checkbox pre-checked)? Currently yes — confirm taste preference before recording the demo video.
- **Q2:** Repo rename to `cold-case-webmcp` still pending owner action; update DEVPOST links after rename.
