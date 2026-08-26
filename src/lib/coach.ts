import type { Exercise, Session } from "./types";

export const EXERCISES: Exercise[] = [
  { id: "ex-squat", name: "Back squat", group: "legs", duration: 15, equipment: ["barbell", "rack"], cues: "Brace, sit back, knees track toes." },
  { id: "ex-lunge", name: "Walking lunges", group: "legs", duration: 10, equipment: [], cues: "Long stride, torso tall." },
  { id: "ex-deadlift", name: "Deadlift", group: "pull", duration: 15, equipment: ["barbell"], cues: "Hips hinge, bar close to shins." },
  { id: "ex-bench", name: "Bench press", group: "push", duration: 12, equipment: ["barbell", "bench"], cues: "Shoulder blades pinned, controlled descent." },
  { id: "ex-ohp", name: "Overhead press", group: "push", duration: 10, equipment: ["barbell"], cues: "Glutes tight, head through at the top." },
  { id: "ex-row", name: "Barbell row", group: "pull", duration: 10, equipment: ["barbell"], cues: "Pull to the belly button." },
  { id: "ex-pullup", name: "Pull-ups", group: "pull", duration: 8, equipment: ["bar"], cues: "Chest to bar, no swinging." },
  { id: "ex-plank", name: "Plank", group: "core", duration: 5, equipment: [], cues: "Squeeze everything, breathe." },
  { id: "ex-hlr", name: "Hanging leg raises", group: "core", duration: 6, equipment: ["bar"], cues: "Curl the pelvis, don't swing." },
  { id: "ex-run", name: "Karura trail run", group: "cardio", duration: 30, equipment: [], cues: "Zone 2 — you should be able to gossip." },
  { id: "ex-skipping", name: "Skipping rope", group: "cardio", duration: 10, equipment: ["rope"], cues: "Wrists, not arms." },
  { id: "ex-yoga", name: "Mobility flow", group: "mobility", duration: 20, equipment: ["mat"], cues: "Slow exhale into every stretch." },
  { id: "ex-kettlebell", name: "Kettlebell swings", group: "cardio", duration: 8, equipment: ["kettlebell"], cues: "Hips snap, arms are ropes." },
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
  let verdict = "Balanced week. Your future self says thanks.";
  if (neglected.includes("legs")) verdict = "No leg day?! The squats know what you did.";
  else if (neglected.length > 3) verdict = "That's a rest week, not a training week.";
  else if (neglected.length > 0) verdict = `Solid — but ${neglected.join(" & ")} got skipped.`;
  return { totalMinutes: total, perGroup, neglected, verdict };
}

const REFUELS = [
  "Ugali + ndengu stew",
  "Sukuma wiki + chapati roll",
  "Mukimo (small sin, big recovery)",
  "Githeri bowl",
  "Chai + peanut-butter toast",
  "Nyama choma (it's leg day, you earned it)",
];

let seq = 100;
function nextId() {
  return `s-${++seq}`;
}

/** Generate one session focusing a group. */
export function generateSession(
  focus: Session["focus"],
  intensity: Session["intensity"] = "moderate",
): Session {
  const pool = EXERCISES.filter((e) => e.group === focus);
  const picked = pool.slice(0, Math.min(pool.length, intensity === "brutal" ? 4 : intensity === "light" ? 2 : 3));
  const minutes = Math.max(20, picked.reduce((t, e) => t + e.duration, 0));
  const titles: Record<string, [string, string, string]> = {
    legs: ["Wheel Day", "The Squat Clinic", "Fry the Wheels"],
    push: ["Press Conference", "Push Party", "Overhead & Out"],
    pull: ["Pull Rank", "Row Your Boat", "Grip & Rip"],
    core: ["Center of Gravity", "Abs-olutely Not", "Core Values"],
    cardio: ["Engine Builder", "Lungs of Lagos", "The Long Way"],
    mobility: ["Oil the Hinges", "Stretch Club", "Human Pretzel Hour"],
  };
  const t = titles[focus];
  return {
    id: nextId(),
    title: t[Math.floor(Math.random() * t.length)],
    focus,
    intensity,
    minutes,
    exercises: picked.map((e) => e.id),
    refuel: REFUELS[Math.floor(Math.random() * REFUELS.length)],
    note:
      intensity === "brutal"
        ? "Bring water. Bring excuses. Leave both behind."
        : undefined,
  };
}
