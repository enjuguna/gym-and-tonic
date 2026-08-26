# Gym & Tonic UI Plan v2 — Kenyan identity, 20 creative additions

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make Gym & Tonic unmistakably *Kenyan* and dramatically more alive: replace the European stock photography with Kenyan scenes (Karura trails, Nairobi gyms, local food), add ~20 creative engagement features, richer descriptive copy everywhere, and fix the UX oddities found in screenshot review.

**Architecture:** All changes are presentation + content layer. New `src/lib/kenyanFlavor.ts` holds Kenyan scene URLs, Swahili-flavored copy pools, and day-story enrichment data. The slot-menu "4 · am" confusion is fixed by showing real clock times; the missing ChatGPT affordance gets a copy-prompt button in the modal; the flippant "Demolition" line is re-toned.

**Tech Stack:** Existing stack. Images from Pexels with Kenya-specific searches verified by curl before wiring. No new deps.

---

## Current context / assumptions

- Live at gym-and-tonic-five.vercel.app; stack Astro+React+Zustand+Tailwind v4; Fraunces/Inter fonts; SceneImage system in place with gradient fallbacks.
- Screenshot findings to fix:
  1. Hero + DayStory photos show European women — wrong audience signal.
  2. Slot modal says "4 · am" (reads as 4 AM!) — must render "Thursday · Morning".
  3. Modal mentions ChatGPT but offers no action — add "Copy coach prompt" button.
  4. "Demolition — Bring water. Bring excuses." tone mismatch — soften.
  5. "Actually… not today." skip link too low-contrast.
  6. Session titles ("Fry the Wheels", "Press Conference") are generic Western puns.
  7. Duplicate titles possible across slots (two "Row Your Boat"s) — generator should avoid repeating the last title per focus.

## The 20 creative additions (grouped into tasks)

**Kenyan identity (T1–T2):** 1. Kenyan photo set (Karura canopy, Nairobi skyline runs, matuni/market produce, ugali refuel shots). 2. Swahili-seasoned microcopy ("Pole pole, utafika" on rest days; "Haraka haraka haina baraka" anti-rushing cue) used sparingly alongside English.

**Descriptiveness (T3–T5):** 3. Session cards gain a one-line story subtitle under the title. 4. DayStory gains "Why today" paragraph tying focus to week balance. 5. Exercise steps get vivid sensory cues rewritten for African context (trail run → "Karura red dirt underfoot").

**Engagement systems (T6–T9):** 6. Weekly streak flame that grows Mon→Sun as slots fill. 7. Muscle-group coverage strip (six segments lighting up as groups get planned). 8. Refuel-of-the-week spotlight card rotating Kenyan dishes. 9. Sound design upgrade: drum-hit approve, soft rattle reject, morning-bird ambience for AM sessions.

**Delight micro-interactions (T10–T13):** 10. Confetti-free "kilo lift" animation when a brutal session is approved (barbell rises). 11. Grid cells wobble-playful on hover. 12. Coach voice queue indicator (three bouncing dots while lines wait). 13. Time-aware greeting in hero ("Jioni! Evening plans?" after 5pm EAT).

**Storytelling (T14–T17):** 14. Week narrative arc kicker per phase with Kenyan running references ("From Uhuru Gardens to Karura"). 15. DayStory "coach's margin note" pool expanded with Kenyan training culture lines (Fisi Club, Hash Harriers vibes). 16. Ghost-slot copy localized per day with Kenyan flavor. 17. Epilogue-style week summary sheet (print-friendly "Training Diary" view).

**Utility polish (T18–T20):** 18. WhatsApp-share button for the gear list (wa.me link with prefilled text). 19. Reduced-motion media query respected globally. 20. PWA-lite manifest + icon so it installs to a phone home screen.

---

## Files likely to change

- Create: `src/lib/kenyanFlavor.ts` (scenes, copy pools, dish spotlights)
- Create: `src/components/ui/StreakFlame.tsx`, `src/components/ui/CoverageStrip.tsx`, `src/components/ui/RefuelSpotlight.tsx`, `src/components/ui/WeekDiary.tsx`
- Modify: `src/lib/scenes.ts` (swap all 8 photos), `src/lib/coach.ts` (title pools + no-repeat logic + sensory cues), `src/lib/coachVoice.ts` (Swahili seasoning), `src/lib/sound.ts` (drum/rattle/bird tones)
- Modify: `src/components/Corkboard.tsx` (slot modal fixes, streak, coverage strip, greeting, share button, diary entry point)
- Modify: `src/components/ui/{SceneImage,DayStory,CoachVoice}.tsx`
- Create: `public/manifest.webmanifest` + modify `src/pages/index.astro` head
- Test: extend `src/lib/coach.test.ts` (title uniqueness), `src/lib/coachVoice.test.ts`

## Tests / validation

| Check | Command | Target |
|---|---|---|
| Title variety | `npx vitest run src/lib/coach.test.ts` | new uniqueness test passes |
| Voice regression | `npx vitest run src/lib/coachVoice.test.ts` | passes |
| Full suite + types + build | `npx vitest run && npx astro check && npx astro build` | green |
| Image audit | curl loop over new Pexels IDs | all 200 |
| Visual QA | preview 375/768/1440 | Kenyan imagery renders; modal reads "Thursday · Morning" |

## Risks / open questions

- **R1:** Pexels Kenya-tagged photos are thinner than generic fitness — audit early (Task 1 gate); fallback is Unsplash source URLs or CSS-art scenes.
- **R2:** Swahili must be respectful and correct — keep phrases short, common, and double-check spellings; when unsure use English with Kenyan place/culture references instead of forcing Swahili.
- **Q1:** Keep the name "Gym & Tonic"? A Kiswahili-flavored alternative ("Mzigo" = load/burden, playful gym slang) could be a stronger brand — owner's call, not blocking.
