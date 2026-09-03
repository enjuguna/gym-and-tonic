import type { Exercise, Session, SessionGenerationOptions } from "./types";
import { selectRefuel } from "./kenyanFlavor";

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
  { id: "ex-run", name: "Easy outdoor run", group: "cardio", duration: 30, equipment: [], cues: "Keep the pace conversational and land softly." },
  { id: "ex-skipping", name: "Skipping rope", group: "cardio", duration: 10, equipment: ["rope"], cues: "Wrists spin it, not arms. Light feet, quiet landings." },
  { id: "ex-yoga", name: "Mobility flow", group: "mobility", duration: 20, equipment: ["mat"], cues: "Slow exhale into every stretch. Slow is smooth, smooth is fast." },
  { id: "ex-kettlebell", name: "Kettlebell swings", group: "cardio", duration: 8, equipment: ["kettlebell"], cues: "Hips snap, arms are ropes. Float at the top." },
  { id: "ex-walk", name: "Brisk outdoor walk", group: "cardio", duration: 20, equipment: [], cues: "Walk tall and use a pace you can sustain." },
  { id: "ex-chair-squat", name: "Chair squats", group: "legs", duration: 8, equipment: ["chair"], cues: "Tap the chair gently, then stand with control." },
  { id: "ex-glute-bridge", name: "Glute bridges", group: "legs", duration: 8, equipment: [], cues: "Press through the feet and pause at the top." },
  { id: "ex-step-up", name: "Step-ups", group: "legs", duration: 8, equipment: ["step"], cues: "Use a stable step and drive through the whole foot." },
  { id: "ex-wall-push", name: "Wall push-ups", group: "push", duration: 8, equipment: [], cues: "Keep your body in one line and move slowly." },
  { id: "ex-incline-push", name: "Incline push-ups", group: "push", duration: 8, equipment: ["bench"], cues: "Hands under shoulders; lower with a steady breath." },
  { id: "ex-band-row", name: "Resistance-band row", group: "pull", duration: 8, equipment: ["band"], cues: "Pull elbows back and keep shoulders relaxed." },
  { id: "ex-bird-dog", name: "Bird dog", group: "core", duration: 6, equipment: [], cues: "Reach long while keeping hips level." },
  { id: "ex-dead-bug", name: "Dead bug", group: "core", duration: 6, equipment: [], cues: "Move slowly and keep your lower back comfortable." },
  { id: "ex-side-plank", name: "Side plank", group: "core", duration: 6, equipment: [], cues: "Lift from the waist and breathe steadily." },
  { id: "ex-calf-raise", name: "Calf raises", group: "legs", duration: 6, equipment: [], cues: "Rise smoothly, pause, and lower with control." },
  { id: "ex-marching", name: "Standing march", group: "cardio", duration: 8, equipment: [], cues: "Stand tall and choose a rhythm you can repeat." },
  { id: "ex-step-touch", name: "Step touch", group: "mobility", duration: 8, equipment: [], cues: "Keep it light and let your arms move naturally." },
  { id: "ex-cat-cow", name: "Cat-cow mobility", group: "mobility", duration: 6, equipment: [], cues: "Move through a comfortable range with your breath." },
  { id: "ex-hip-flow", name: "Hip mobility flow", group: "mobility", duration: 8, equipment: ["mat"], cues: "Stay gentle and stop short of pinching or pain." },
  { id: "ex-sit-to-stand", name: "Sit to stand", group: "legs", duration: 8, equipment: ["chair"], cues: "Stand tall from a stable chair and lower slowly." },
  { id: "ex-reverse-fly", name: "Band reverse fly", group: "pull", duration: 8, equipment: ["band"], cues: "Open the arms without shrugging and keep the ribs relaxed." },
];

// Keep the instructional contract complete for every movement, including
// legacy and agent-provided sessions that only contain the original fields.
// The cue remains the short on-screen coaching line; this is the fuller,
// plain-language instruction used by the exercise detail surface.
EXERCISES.forEach((exercise) => {
  exercise.instructions ??= `Set up with ${exercise.equipment.length ? exercise.equipment.join(" and ") : "no equipment"}. ${exercise.cues} Work for the full ${exercise.duration}-minute block at a pace you can control.`;
  exercise.impact ??= exercise.group === "cardio" ? "moderate" : exercise.group === "mobility" ? "low" : "moderate";
  exercise.easierAlternative ??= exercise.group === "legs" ? "Use a chair or reduce the range of motion." : exercise.group === "push" ? "Use a wall or a higher surface." : exercise.group === "pull" ? "Use a lighter band or reduce the range." : exercise.group === "cardio" ? "Slow down and keep the effort conversational." : exercise.group === "mobility" ? "Shorten the range and move gently." : "Keep one knee or hand supported.";
  exercise.blockMinutes ??= exercise.duration;
});

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
  let verdict = "Balanced week. Your future self says thank you.";
  if (neglected.includes("legs")) verdict = "No leg day?! The squats know what you did.";
  else if (neglected.length > 3) verdict = "That's a rest week, not a training week.";
  else if (neglected.length > 0) verdict = `Solid — but ${neglected.join(" & ")} got skipped.`;
  return { totalMinutes: total, perGroup, neglected, verdict };
}

// Clear, encouraging titles that work across regions.
const TITLES: Record<string, string[]> = {
  legs: [
    "Strong Legs Start Here",
    "Steady Lower Body",
    "Legs and Balance",
    "Build Your Base",
    "Lower Body Reset",
  ],
  push: [
    "Upper Body Push",
    "Press and Progress",
    "Strong Shoulders",
    "Chest and Triceps",
    "Push with Control",
  ],
  pull: [
    "Back and Grip",
    "Rows and Pulls",
    "Build Your Back",
    "Strong Posture",
    "Pull with Control",
  ],
  core: [
    "Core Foundations",
    "Steady Center",
    "Core in Control",
    "Build Core Strength",
    "Strong from the Middle",
  ],
  cardio: [
    "Easy Cardio Start",
    "Brisk Walk Builder",
    "Cardio and Confidence",
    "Build Your Engine",
    "Move at Your Pace",
  ],
  mobility: [
    "Gentle Mobility",
    "Stretch and Reset",
    "Move with Ease",
    "Full Body Unwind",
    "Breathe and Move",
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
  options: SessionGenerationOptions = {},
): Session {
  const impactSafe = options.lowImpact ? EXERCISES.filter((e) => !["ex-run", "ex-skipping", "ex-kettlebell", "ex-step-up"].includes(e.id)) : EXERCISES;
  const equipmentPool = options.equipment === "home"
    ? impactSafe.filter((e) => e.group === focus && e.equipment.length === 0)
    : impactSafe.filter((e) => e.group === focus);
  const pool = equipmentPool.length > 0 ? equipmentPool : impactSafe.filter((e) => e.group === focus);
  const count = options.duration === "under30"
    ? 2
    : options.duration === "45plus" || intensity === "brutal"
      ? 4
      : intensity === "light" ? 2 : 3;
  const picked = pool.slice(0, Math.min(pool.length, count));
  const minutes = Math.max(20, picked.reduce((t, e) => t + e.duration, 0));

  const titles = TITLES[focus];
  const lastUsed = lastTitlePerFocus.get(focus);
  const candidates = titles.filter((t) => t !== lastUsed);
  const title = candidates[Math.floor(Math.random() * candidates.length)];
  lastTitlePerFocus.set(focus, title);
  const refuelDetail = selectRefuel(options.excludeRefuelIds);

  return {
    id: nextId(),
    title,
    focus,
    intensity,
    minutes,
    exercises: picked.map((e) => e.id),
    refuel: refuelDetail.title,
    refuelDetail,
    note:
      intensity === "brutal"
        ? "Hydrate the day before, not just the hour before."
        : intensity === "light"
          ? "Easy pace. Consistency beats heroics."
          : undefined,
  };
}
