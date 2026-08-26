import type { Exercise, Session } from "./types";

export const EXERCISES: Exercise[] = [
  { id: "ex-squat", name: "Back squat", group: "legs", duration: 15, equipment: ["barbell", "rack"], cues: "Brace like the bar owes you money. Knees track toes." },
  { id: "ex-lunge", name: "Walking lunges", group: "legs", duration: 10, equipment: [], cues: "Long strides down the corridor — neighbours will stare." },
  { id: "ex-deadlift", name: "Deadlift", group: "pull", duration: 15, equipment: ["barbell"], cues: "Hips hinge, bar kisses the shins, world goes quiet." },
  { id: "ex-bench", name: "Bench press", group: "push", duration: 12, equipment: ["barbell", "bench"], cues: "Shoulder blades pinned. Controlled descent, explosive up." },
  { id: "ex-ohp", name: "Overhead press", group: "push", duration: 10, equipment: ["barbell"], cues: "Glutes tight, push the floor away, head through at the top." },
  { id: "ex-row", name: "Barbell row", group: "pull", duration: 10, equipment: ["barbell"], cues: "Pull to the belly button. Squeeze like wringing a towel." },
  { id: "ex-pullup", name: "Pull-ups", group: "pull", duration: 8, equipment: ["bar"], cues: "Chest to bar. No swinging — this isn't a playground." },
  { id: "ex-plank", name: "Plank", group: "core", duration: 5, equipment: [], cues: "Squeeze everything. Breathe anyway." },
  { id: "ex-hlr", name: "Hanging leg raises", group: "core", duration: 6, equipment: ["bar"], cues: "Curl the pelvis. Toes to the sky, ego to the floor." },
  { id: "ex-run", name: "Karura trail run", group: "cardio", duration: 30, equipment: [], cues: "Red dirt underfoot, canopy overhead. Zone 2 — gossip pace." },
  { id: "ex-skipping", name: "Skipping rope", group: "cardio", duration: 10, equipment: ["rope"], cues: "Wrists spin it, not arms. Light feet, quiet landings." },
  { id: "ex-yoga", name: "Mobility flow", group: "mobility", duration: 20, equipment: ["mat"], cues: "Slow exhale into every stretch. Pole pole ndiyo mwendo." },
  { id: "ex-kettlebell", name: "Kettlebell swings", group: "cardio", duration: 8, equipment: ["kettlebell"], cues: "Hips snap, arms are ropes. Float at the top." },
];

const byId = new Map(EXERCISES.map((e) => [e.id, e]));
export const exerciseById = (id: string) => byId.get(id);

/** Aggregate equipment across sessions into one gear list. */
export function gearList(sessions: Array<Session | null>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of sessions) {
    if (!s) continue;
    const seen = new Set<string>();
    for (const eid of s.exercises) {
      const ex = byId.get(eid);
      if (!ex) continue;
      for (const eq of ex.equipment) seen.add(eq);
    }
    for (const eq of seen) out[eq] = (out[eq] ?? 0) + 1;
  }
  return out;
}

export interface BalanceReport {
  totalMinutes: number;
  perGroup: Record<string, number>;
  neglected: string[];
  verdict: string;
}

/** Which groups did the week neglect? */
export function balanceCheck(sessions: Array<Session | null>): BalanceReport {
  const groups = ["legs", "push", "pull", "core", "cardio", "mobility"];
  const perGroup: Record<string, number> = {};
  let total = 0;
  for (const s of sessions) {
    if (!s) continue;
    total += s.minutes;
    perGroup[s.focus] = (perGroup[s.focus] ?? 0) + s.minutes;
  }
  const neglected = groups.filter((g) => !perGroup[g]);
  let verdict = "Balanced week. Your future self says asante.";
  if (neglected.includes("legs")) verdict = "No leg day?! The squats know what you did.";
  else if (neglected.length > 3) verdict = "That's a rest week, not a training week.";
  else if (neglected.length > 0) verdict = `Solid — but ${neglected.join(" & ")} got skipped.`;
  return { totalMinutes: total, perGroup, neglected, verdict };
}

const REFUELS = [
  "Ugali na ndengu stew",
  "Sukuma wiki & chapati roll",
  "Mukimo (small sin, big recovery)",
  "Githeri bowl, extra beans",
  "Chai ya tangawizi + peanut toast",
  "Nyama choma — leg day currency",
];

// Descriptive Kenyan-rooted titles per focus.
const TITLES: Record<string, string[]> = {
  legs: [
    "Karura Stair Day",
    "Ngong Hills Simulator",
    "The Squat Parliament",
    "Matatu-Free Legs",
    "Deep Knees, Deep Breath",
  ],
  push: [
    "Overhead & Out",
    "The Press Briefing",
    "Shoulders of Nairobi",
    "Bench & Beyond",
    "Push Past Westlands",
  ],
  pull: [
    "Pull Rank Monday",
    "Rope & Row Republic",
    "Grip the Bar, Hold the Line",
    "Back Day Blues Cure",
    "Hang Tough, Lift Heavy",
  ],
  core: [
    "Center of Gravity",
    "Core Ya Kawaida? Never.",
    "Abs Under Construction",
    "Steady Middle, Steady Life",
    "Planks & Promises",
  ],
  cardio: [
    "Karuta Red Dirt Run",
    "Uhuru Gardens Loop",
    "Sunrise to Kasarani",
    "Lungs of the Rift",
    "Skip the Matatu Today",
  ],
  mobility: [
    "Pole Pole Flow",
    "Stretch Club Saturday",
    "Oil the Hinges",
    "Human Pretzel Hour",
    "Breathe & Unwind",
  ],
};

let seq = 100;
function nextId() {
  return `s-${++seq}`;
}

const lastTitlePerFocus = new Map<string, string>();

/** Generate one session focusing a group; never repeats the last title. */
export function generateSession(
  focus: Session["focus"],
  intensity: Session["intensity"] = "moderate",
): Session {
  const pool = EXERCISES.filter((e) => e.group === focus);
  const count = intensity === "brutal" ? 4 : intensity === "light" ? 2 : 3;
  const picked = pool.slice(0, Math.min(pool.length, count));
  const minutes = Math.max(20, picked.reduce((t, e) => t + e.duration, 0));

  const titles = TITLES[focus];
  const lastUsed = lastTitlePerFocus.get(focus);
  const candidates = titles.filter((t) => t !== lastUsed);
  const title = candidates[Math.floor(Math.random() * candidates.length)];
  lastTitlePerFocus.set(focus, title);

  return {
    id: nextId(),
    title,
    focus,
    intensity,
    minutes,
    exercises: picked.map((e) => e.id),
    refuel: REFUELS[Math.floor(Math.random() * REFUELS.length)],
    note:
      intensity === "brutal"
        ? "Hydrate the day before, not just the hour before."
        : intensity === "light"
          ? "Easy pace. Consistency beats heroics."
          : undefined,
  };
}
